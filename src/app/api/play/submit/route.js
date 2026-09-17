import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getOrCreateRequestUser } from '@/lib/requestUser';
import { evaluateQuizAnswer, normalizeTimeTaken } from '@/lib/quizScoring.mjs';

export const dynamic = 'force-dynamic';

function koreanDateKey(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function calculateStreak(user, now) {
  if (!user.lastActiveDate) return 1;

  const todayKey = koreanDateKey(now);
  const lastActiveKey = koreanDateKey(new Date(user.lastActiveDate));
  if (todayKey === lastActiveKey) return Math.max(user.currentStreak, 1);

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return lastActiveKey === koreanDateKey(yesterday)
    ? Math.max(user.currentStreak, 0) + 1
    : 1;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const quizId = typeof body.quizId === 'string' ? body.quizId.trim() : '';
    const selectedAnswer = typeof body.selectedAnswer === 'string'
      ? body.selectedAnswer.slice(0, 500)
      : '';

    if (!quizId || !selectedAnswer.trim()) {
      return NextResponse.json(
        { success: false, error: '퀴즈 ID와 제출 답안이 필요합니다.' },
        { status: 400 }
      );
    }

    const [{ user }, quiz] = await Promise.all([
      getOrCreateRequestUser(request),
      prisma.quiz.findUnique({
        where: { id: quizId },
        include: { stage: true }
      })
    ]);

    if (!quiz) {
      return NextResponse.json({ success: false, error: '존재하지 않는 퀴즈입니다.' }, { status: 404 });
    }

    // 클라이언트가 보낸 isCorrect 값은 신뢰하지 않고 DB 정답으로 직접 판정한다.
    const isCorrect = evaluateQuizAnswer(selectedAnswer, quiz);
    const timeTaken = normalizeTimeTaken(body.timeTaken);
    const diffPoints = { EASY: 10, MEDIUM: 15, HARD: 20 };
    const pointsEarned = isCorrect ? (diffPoints[quiz.stage.difficulty] || 10) : 0;
    const now = new Date();

    await prisma.$transaction(async tx => {
      await tx.quizAttempt.create({
        data: {
          userId: user.id,
          quizId: quiz.id,
          isCorrect,
          timeTaken
        }
      });

      if (isCorrect) {
        const currentStreak = calculateStreak(user, now);
        await tx.user.update({
          where: { id: user.id },
          data: {
            points: { increment: pointsEarned },
            currentStreak,
            maxStreak: Math.max(currentStreak, user.maxStreak),
            lastActiveDate: now
          }
        });
        return;
      }

      const existingWrong = await tx.wrongAnswer.findFirst({
        where: {
          userId: user.id,
          quizId: quiz.id,
          isResolved: false
        }
      });

      if (existingWrong) {
        await tx.wrongAnswer.update({
          where: { id: existingWrong.id },
          data: {
            reviewCount: { increment: 1 },
            lastFailed: now
          }
        });
      } else {
        await tx.wrongAnswer.create({
          data: {
            userId: user.id,
            quizId: quiz.id,
            reviewCount: 1,
            isResolved: false,
            lastFailed: now
          }
        });
      }
    });

    return NextResponse.json({
      success: true,
      isCorrect,
      pointsEarned,
      correctAnswer: quiz.correctAnswer,
      hint: quiz.hint
    });
  } catch (error) {
    console.error('풀이 제출 처리 중 에러:', error);
    return NextResponse.json(
      { success: false, error: '풀이 결과를 저장하지 못했습니다.' },
      { status: 500 }
    );
  }
}
