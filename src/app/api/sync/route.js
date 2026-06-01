import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

    const rawUsername = request.headers.get("x-nihongo-username");
    const username = rawUsername ? decodeURIComponent(rawUsername) : "니혼고마스터";

    let user = await prisma.user.findFirst({
      where: { username }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `${username}@learning.com`,
          username,
          points: 0,
        }
      });
    }

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
      { success: false, error: error.message },
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

    // 2. 기본 사용자 확보 (없으면 자동 생성)
    const rawUsername = request.headers.get("x-nihongo-username");
    const username = rawUsername ? decodeURIComponent(rawUsername) : "니혼고마스터";

    let user = await prisma.user.findFirst({
      where: { username }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `${username}@learning.com`,
          username,
          points: 0,
        }
      });
    }

    let addedCount = 0;

    // 3. 🍱 [단어장 스마트 병합]
    if (type === "bookmarks") {
      if (!backupData.bookmarks || !Array.isArray(backupData.bookmarks)) {
        return NextResponse.json(
          { success: false, error: "단어장 주입 영역에 올바른 단어 백업 데이터가 존재하지 않습니다." },
          { status: 400 }
        );
      }

      for (const b of backupData.bookmarks) {
        if (!b.word) continue;

        // 기존에 이미 존재하는 단어인지 체크
        const existing = await prisma.bookmark.findFirst({
          where: {
            userId: user.id,
            word: b.word,
          },
        });

        if (!existing) {
          await prisma.bookmark.create({
            data: {
              userId: user.id,
              word: b.word,
              meaning: b.meaning || "",
              reading: b.reading || "",
            },
          });
          addedCount++;
        }
      }
    }

    // 4. 📓 [오답노트 스마트 병합]
    if (type === "wrong-notes") {
      if (!backupData.wrongAnswers || !Array.isArray(backupData.wrongAnswers)) {
        return NextResponse.json(
          { success: false, error: "오답노트 주입 영역에 올바른 오답 백업 데이터가 존재하지 않습니다." },
          { status: 400 }
        );
      }

      for (const w of backupData.wrongAnswers) {
        if (!w.quizId) continue;

        // 기존에 이미 존재하는 오답 노트인지 체크
        const existing = await prisma.wrongAnswer.findFirst({
          where: {
            userId: user.id,
            quizId: w.quizId,
          },
        });

        if (!existing) {
          // 신규 등록
          await prisma.wrongAnswer.create({
            data: {
              userId: user.id,
              quizId: w.quizId,
              reviewCount: w.reviewCount || 1,
              isResolved: w.isResolved !== undefined ? w.isResolved : false,
            },
          });
          addedCount++;
        } else {
          // 기존에 존재하나, 들어온 백업 코드가 더 복습 회수가 많거나 아직 안 풀린 경우 스마트 업데이트
          const shouldUpdate =
            (w.reviewCount && w.reviewCount > existing.reviewCount) ||
            (!w.isResolved && existing.isResolved);

          if (shouldUpdate) {
            await prisma.wrongAnswer.update({
              where: { id: existing.id },
              data: {
                reviewCount: Math.max(w.reviewCount || 1, existing.reviewCount),
                isResolved: w.isResolved !== undefined ? w.isResolved : existing.isResolved,
              },
            });
            addedCount++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `성공적으로 데이터를 안전하게 병합했습니다!`,
      addedCount,
    });
  } catch (error) {
    console.error("[SYNC IMPORT ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
