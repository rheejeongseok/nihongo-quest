import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getN1Arena } from '@/lib/n1Arena.mjs';

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

    if (stageNumber === 6 && jlptLevel === 'BEGINNER') {
      const tag = `[BEGINNER-${difficulty}]`;
      const sample = async (where, take) => {
        const fullWhere = {
          ...where,
          jlptLevel: 'BEGINNER',
          status: 'ACTIVE',
          questionText: { contains: tag }
        };
        const count = await prisma.quiz.count({ where: fullWhere });
        if (!count) return [];
        const skip = Math.floor(Math.random() * Math.max(1, count - take + 1));
        return prisma.quiz.findMany({ where: fullWhere, skip, take });
      };

      const [characters, vocabulary, grammar, listening, wordle, assembly] = await Promise.all([
        sample({ stage: { category: 'CHARACTERS' } }, 2),
        sample({ stage: { category: 'VOCAB' } }, 2),
        sample({ stage: { category: 'GRAMMAR' } }, 2),
        sample({ stage: { category: 'LISTENING' } }, 2),
        sample({ quizType: 'WORDLE' }, 1),
        sample({ quizType: 'ASSEMBLY' }, 1)
      ]);
      const selectedQuizzes = shuffleArray([
        ...characters,
        ...vocabulary,
        ...grammar,
        ...listening,
        ...wordle,
        ...assembly
      ]).map(prepareQuizForClient);

      if (selectedQuizzes.length < 10) {
        return NextResponse.json({
          success: false,
          error: '초보 실력 진단 문제 풀이 준비되지 않았습니다. 초보 문제 데이터를 먼저 추가해 주세요.'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        stage: {
          id: 'virtual-beginner-stage-6',
          stageNumber: 6,
          title: '🌱 초보 실력 진단',
          category: 'MOCK_EXAM',
          jlptLevel: 'BEGINNER',
          difficulty
        },
        quizzes: selectedQuizzes
      });
    }

    // 1. 스테이지 카테고리 정보 조회
    const stage = await prisma.stage.findUnique({
      where: { stageNumber }
    });

    if (!stage) {
      return NextResponse.json({ success: false, error: '존재하지 않는 스테이지입니다.' }, { status: 404 });
    }

    // 초보 트랙은 DB에 저장된 난이도별 문제를 조회한다.
    const metaSearchTag = `[${jlptLevel}-${difficulty}]`;

    const quizWhere = {
      stageId: stage.id,
      jlptLevel: 'BEGINNER',
      status: 'ACTIVE',
      questionText: {
        contains: metaSearchTag
      }
    };
    if (stageNumber === 5) {
      quizWhere.quizType = requestedCategory === 'ASSEMBLY' ? 'ASSEMBLY' : 'WORDLE';
    }
    const quizCount = await prisma.quiz.count({ where: quizWhere });

    if (quizCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: `해당 카테고리의 ${jlptLevel} [${difficulty}] 퀴즈 데이터를 찾을 수 없습니다. 상단에서 240+ 문항 강제 동기화 버튼을 먼저 눌러주세요.` 
      }, { status: 404 });
    }

    // 3. 무작위 시작점에서 최대 10문항만 조회
    const randomOffset = Math.floor(Math.random() * Math.max(1, quizCount - 9));
    const randomlySelectedPool = await prisma.quiz.findMany({
      where: quizWhere,
      skip: randomOffset,
      take: 10
    });

    // 4. 조회한 표본의 순서를 한 번 더 섞음
    let selectedQuizzes = shuffleArray(randomlySelectedPool);

    // 5. 보기 셔플하여 정답 위치 무작위화 (wrongAnswers가 존재하는 모든 퀴즈 확장)
    selectedQuizzes = selectedQuizzes.map(prepareQuizForClient);

    const beginnerTitles = {
      1: '🌸 기초 문자 정복 아레나',
      2: '🍱 기초 필수 어휘 아레나',
      3: '⚙️ 기초 조사와 문법 아레나',
      4: '🎧 일상 회화 청해 아레나',
      5: requestedCategory === 'ASSEMBLY' ? '⚔️ 기초 문장 조립 아레나' : '🧩 기초 단어 워들 아레나'
    };

    return NextResponse.json({
      success: true,
      stage: {
        id: stage.id,
        stageNumber: stage.stageNumber,
        title: jlptLevel === 'BEGINNER' ? beginnerTitles[stageNumber] : stage.title,
        category: stageNumber === 5 && requestedCategory === 'ASSEMBLY' ? 'ASSEMBLY' : stage.category,
        jlptLevel: jlptLevel,
        difficulty: difficulty
      },
      quizzes: selectedQuizzes
    });
  } catch (error) {
    console.error('다차원 퀴즈 추출 엔진 에러:', error);
    return NextResponse.json({ success: false, error: '퀴즈를 불러오지 못했습니다.' }, { status: 500 });
  }
}
