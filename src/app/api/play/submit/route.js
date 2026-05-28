import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { quizId, isCorrect, timeTaken, selectedAnswer } = await request.json();

    // 1. 유저 조회 (첫 번째 유저를 디폴트로 사용)
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'nihongo@learning.com',
          username: '니혼고마스터',
          points: 0,
        }
      });
    }

    // 2. 퀴즈 정보 조회
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { stage: true }
    });

    if (!quiz) {
      return NextResponse.json({ success: false, error: '존재하지 않는 퀴즈입니다.' }, { status: 404 });
    }

    // 3. 풀이 시도 이력(QuizAttempt) 저장
    await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        quizId: quiz.id,
        isCorrect,
        timeTaken: timeTaken || 0
      }
    });

    let pointsEarned = 0;
    
    if (isCorrect) {
      // 정답인 경우: 포인트 지급 (EASY: 10, MEDIUM: 15, HARD: 20)
      const diffPoints = { EASY: 10, MEDIUM: 15, HARD: 20 };
      pointsEarned = diffPoints[quiz.stage.difficulty] || 10;

      // 일일 스트릭 갱신 로직 (간소화)
      const today = new Date();
      let newStreak = user.currentStreak;
      
      if (!user.lastActiveDate) {
        newStreak = 1;
      } else {
        const lastActive = new Date(user.lastActiveDate);
        const diffTime = Math.abs(today - lastActive);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // 어제 공부하고 오늘 또 공부함 -> 스트릭 증가!
          newStreak += 1;
        } else if (diffDays > 1) {
          // 스트릭이 끊김 -> 다시 1일차 시작
          newStreak = 1;
        }
      }

      const maxStreak = Math.max(newStreak, user.maxStreak);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          points: user.points + pointsEarned,
          currentStreak: newStreak,
          maxStreak,
          lastActiveDate: today
        }
      });
    } else {
      // 오답인 경우: 스마트 오답노트(WrongAnswer) 적재
      const existingWrong = await prisma.wrongAnswer.findFirst({
        where: {
          userId: user.id,
          quizId: quiz.id,
          isResolved: false
        }
      });

      if (existingWrong) {
        // 이미 오답노트에 존재하면 틀린 횟수(가중치) 증가
        await prisma.wrongAnswer.update({
          where: { id: existingWrong.id },
          data: {
            reviewCount: existingWrong.reviewCount + 1,
            lastFailed: new Date()
          }
        });
      } else {
        // 오답노트에 신규 등록
        await prisma.wrongAnswer.create({
          data: {
            userId: user.id,
            quizId: quiz.id,
            reviewCount: 1,
            isResolved: false
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      isCorrect,
      pointsEarned,
      correctAnswer: quiz.correctAnswer,
      hint: quiz.hint
    });
  } catch (error) {
    console.error('풀이 제출 처리 중 에러:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
