import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getN1Arena } from '@/lib/n1Arena.mjs';
import { getBeginnerArena } from '@/lib/beginnerArena.mjs';

export const dynamic = 'force-dynamic';

// Fisher-Yates 셔플 알고리즘
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function prepareQuizForClient(quiz) {
  if (!quiz.wrongAnswers) return quiz;

  try {
    const values = JSON.parse(quiz.wrongAnswers);
    if (!Array.isArray(values) || values.length === 0) return quiz;

    if (quiz.quizType === 'ASSEMBLY') {
      return {
        ...quiz,
        options: shuffleArray(values),
        wrongAnswers: undefined
      };
    }

    return {
      ...quiz,
      options: shuffleArray([quiz.correctAnswer, ...values]),
      wrongAnswers: undefined
    };
  } catch (error) {
    console.error('보기 목록 셔플 파싱 에러:', error);
    return quiz;
  }
}

export async function GET(request, { params }) {
  try {
    const { stageNumber: stageNumberParam } = await params;
    const stageNumber = parseInt(stageNumberParam, 10);
    const { searchParams } = new URL(request.url);
    const jlptLevel = searchParams.get('jlptLevel') === 'BEGINNER' ? 'BEGINNER' : 'N1';
    const requestedDifficulty = searchParams.get('difficulty') || 'EASY';
    const difficulty = ['EASY', 'MEDIUM', 'HARD'].includes(requestedDifficulty)
      ? requestedDifficulty
      : 'EASY';
    const requestedCategory = searchParams.get('category') || '';
    
    if (jlptLevel === 'N1') {
      if (stageNumber === 6) return NextResponse.json({ success: false, redirectTo: '/mock-exam' }, { status: 410 });
      const result = await getN1Arena(prisma, stageNumber, requestedCategory);
      if (!result) return NextResponse.json({ success: false, error: '아레나 정보를 찾을 수 없습니다.' }, { status: 404 });
      return NextResponse.json({ success: true, stage: result.stage, quizzes: result.quizzes.map(prepareQuizForClient) });
    }

    const result = await getBeginnerArena(prisma, stageNumber, requestedCategory, difficulty);
    if (!result) return NextResponse.json({ success: false, error: 'Learning data is not ready.' }, { status: 404 });
    return NextResponse.json({ success: true, stage: result.stage, quizzes: result.quizzes.map(prepareQuizForClient) });
  } catch (error) {
    console.error('다차원 퀴즈 추출 엔진 에러:', error);
    return NextResponse.json({ success: false, error: '퀴즈를 불러오지 못했습니다.' }, { status: 500 });
  }
}
