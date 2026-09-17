import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOrCreateRequestUser } from "@/lib/requestUser";

export const dynamic = "force-dynamic";
const MAX_IMPORT_ITEMS = 1000;
const MAX_BACKUP_CODE_LENGTH = 1024 * 1024;

// 📤 [EXPORT] 현재 학습 데이터 타입별 추출 (GET)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'bookmarks' 또는 'wrong-notes'

    if (!type || (type !== "bookmarks" && type !== "wrong-notes")) {
      return NextResponse.json(
        { success: false, error: "올바르지 않은 동기화 타입(type)이 지정되었습니다." },
        { status: 400 }
      );
    }

    const { user } = await getOrCreateRequestUser(request);

    let backupData = {};

    if (type === "bookmarks") {
      // 1. 단어장 긁어오기 (핵심 컬럼만)
      const bookmarks = await prisma.bookmark.findMany({
        where: { userId: user.id },
        select: {
          word: true,
          meaning: true,
          reading: true,
        },
      });
      backupData = { bookmarks };
    } else {
      // 2. 오답노트 긁어오기 (핵심 컬럼만)
      const wrongAnswers = await prisma.wrongAnswer.findMany({
        where: { userId: user.id },
        select: {
          quizId: true,
          reviewCount: true,
          isResolved: true,
        },
      });
      backupData = { wrongAnswers };
    }

    // 3. 데이터를 Base64 해시 코드로 인코딩
    const jsonString = JSON.stringify(backupData);
    const backupCode = Buffer.from(jsonString, "utf-8").toString("base64");

    return NextResponse.json({
      success: true,
      backupCode,
      rawJson: backupData,
    });
  } catch (error) {
    console.error("[SYNC EXPORT ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "학습 데이터 내보내기에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 📥 [IMPORT & MERGE] 학습 데이터 타입별 스마트 주입 및 병합 (POST)
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'bookmarks' 또는 'wrong-notes'

    if (!type || (type !== "bookmarks" && type !== "wrong-notes")) {
      return NextResponse.json(
        { success: false, error: "올바르지 않은 동기화 타입(type)이 지정되었습니다." },
        { status: 400 }
      );
    }

    const { backupCode, rawJson } = await request.json();
    if (typeof backupCode === "string" && backupCode.length > MAX_BACKUP_CODE_LENGTH) {
      return NextResponse.json(
        { success: false, error: "백업 코드는 1MB 이하만 가져올 수 있습니다." },
        { status: 413 }
      );
    }
    let backupData = null;

    // 1. Base64 텍스트 코드 우선 디코딩 및 복원
    if (backupCode && backupCode.trim() !== "") {
      try {
        const decodedString = Buffer.from(backupCode.trim(), "base64").toString("utf-8");
        backupData = JSON.parse(decodedString);
      } catch (decodeErr) {
        return NextResponse.json(
          { success: false, error: "올바르지 않은 백업 코드 형식입니다. 다시 확인해 주세요." },
          { status: 400 }
        );
      }
    } else if (rawJson) {
      backupData = rawJson;
    }

    if (!backupData) {
      return NextResponse.json(
        { success: false, error: "주입할 데이터가 존재하지 않거나 손상되었습니다." },
        { status: 400 }
      );
    }

    // 2. 요청 사용자 확보
    const { user } = await getOrCreateRequestUser(request);

    let addedCount = 0;

    // 3. 🍱 [단어장 스마트 병합]
    if (type === "bookmarks") {
      if (!backupData.bookmarks || !Array.isArray(backupData.bookmarks)) {
        return NextResponse.json(
          { success: false, error: "단어장 주입 영역에 올바른 단어 백업 데이터가 존재하지 않습니다." },
          { status: 400 }
        );
      }
      if (backupData.bookmarks.length > MAX_IMPORT_ITEMS) {
        return NextResponse.json(
          { success: false, error: `한 번에 최대 ${MAX_IMPORT_ITEMS}개 단어만 가져올 수 있습니다.` },
          { status: 413 }
        );
      }

      const uniqueBookmarks = new Map();
      for (const item of backupData.bookmarks) {
        const word = String(item?.word || "").trim().slice(0, 100);
        if (!word) continue;
        uniqueBookmarks.set(word, {
          userId: user.id,
          word,
          meaning: String(item?.meaning || "").trim().slice(0, 500),
          reading: String(item?.reading || "").trim().slice(0, 100)
        });
      }

      const result = await prisma.bookmark.createMany({
        data: [...uniqueBookmarks.values()],
        skipDuplicates: true
      });
      addedCount = result.count;
    }

    // 4. 📓 [오답노트 스마트 병합]
    if (type === "wrong-notes") {
      if (!backupData.wrongAnswers || !Array.isArray(backupData.wrongAnswers)) {
        return NextResponse.json(
          { success: false, error: "오답노트 주입 영역에 올바른 오답 백업 데이터가 존재하지 않습니다." },
          { status: 400 }
        );
      }
      if (backupData.wrongAnswers.length > MAX_IMPORT_ITEMS) {
        return NextResponse.json(
          { success: false, error: `한 번에 최대 ${MAX_IMPORT_ITEMS}개 오답만 가져올 수 있습니다.` },
          { status: 413 }
        );
      }

      const incomingByQuiz = new Map();
      for (const item of backupData.wrongAnswers) {
        const quizId = typeof item?.quizId === "string" ? item.quizId.trim() : "";
        if (!quizId) continue;
        incomingByQuiz.set(quizId, {
          quizId,
          reviewCount: Math.min(Math.max(Number(item.reviewCount) || 1, 1), 100),
          isResolved: item.isResolved === true
        });
      }

      const quizIds = [...incomingByQuiz.keys()];
      const [validQuizzes, existingAnswers] = await Promise.all([
        prisma.quiz.findMany({ where: { id: { in: quizIds } }, select: { id: true } }),
        prisma.wrongAnswer.findMany({ where: { userId: user.id, quizId: { in: quizIds } } })
      ]);
      const validQuizIds = new Set(validQuizzes.map(quiz => quiz.id));
      const existingByQuiz = new Map(existingAnswers.map(answer => [answer.quizId, answer]));
      const toCreate = [];
      const toUpdate = [];

      for (const incoming of incomingByQuiz.values()) {
        if (!validQuizIds.has(incoming.quizId)) continue;
        const existing = existingByQuiz.get(incoming.quizId);
        if (!existing) {
          toCreate.push({ userId: user.id, ...incoming });
          continue;
        }

        const reviewCount = Math.max(incoming.reviewCount, existing.reviewCount);
        const isResolved = incoming.isResolved && existing.isResolved;
        if (reviewCount !== existing.reviewCount || isResolved !== existing.isResolved) {
          toUpdate.push(prisma.wrongAnswer.update({
            where: { id: existing.id },
            data: { reviewCount, isResolved }
          }));
        }
      }

      const createResult = toCreate.length
        ? await prisma.wrongAnswer.createMany({ data: toCreate })
        : { count: 0 };
      for (let index = 0; index < toUpdate.length; index += 50) {
        await prisma.$transaction(toUpdate.slice(index, index + 50));
      }
      addedCount = createResult.count + toUpdate.length;
    }

    return NextResponse.json({
      success: true,
      message: `성공적으로 데이터를 안전하게 병합했습니다!`,
      addedCount,
    });
  } catch (error) {
    console.error("[SYNC IMPORT ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "학습 데이터 가져오기에 실패했습니다." },
      { status: 500 }
    );
  }
}
