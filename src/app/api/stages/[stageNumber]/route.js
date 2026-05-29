import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

export async function GET(request, { params }) {
  try {
    const stageNumber = parseInt(params.stageNumber);
    
    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const jlptLevel = searchParams.get('jlptLevel') || 'N1'; // 대분류: N1 (N2 무시)
    const difficulty = searchParams.get('difficulty') || 'EASY'; // 소분류: EASY, MEDIUM, HARD

    // 1. 스테이지 카테고리 정보 조회
    const stage = await prisma.stage.findUnique({
      where: { stageNumber }
    });

    if (!stage) {
      return NextResponse.json({ success: false, error: '존재하지 않는 스테이지입니다.' }, { status: 404 });
    }

    // 2. 다차원 메타 태그 검색 쿼리 수행
    // [N2-EASY], [N1-HARD] 등 본문 접두사 매핑
    const metaSearchTag = `[${jlptLevel}-${difficulty}]`;

    const allQuizzesInPool = await prisma.quiz.findMany({
      where: {
        stageId: stage.id,
        questionText: {
          contains: metaSearchTag
        }
      }
    });

    if (allQuizzesInPool.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: `해당 카테고리의 ${jlptLevel} [${difficulty}] 퀴즈 데이터를 찾을 수 없습니다. 상단에서 240+ 문항 강제 동기화 버튼을 먼저 눌러주세요.` 
      }, { status: 404 });
    }

    // 3. 240문항 풀에서 실시간 완전 무작위 셔플링
    const fullyShuffledPool = shuffleArray(allQuizzesInPool);

    // 4. 무작위 10문항 동적 추출
    let selectedQuizzes = fullyShuffledPool.slice(0, 10);

    // 5. 보기 셔플하여 정답 위치 무작위화 (wrongAnswers가 존재하는 모든 퀴즈 확장)
    selectedQuizzes = selectedQuizzes.map(quiz => {
      if (quiz.wrongAnswers) {
        try {
          const wrongList = JSON.parse(quiz.wrongAnswers);
          if (Array.isArray(wrongList) && wrongList.length > 0) {
            const allOptions = shuffleArray([quiz.correctAnswer, ...wrongList]);
            
            return {
              ...quiz,
              options: allOptions,
              wrongAnswers: undefined // 정답 은폐
            };
          }
        } catch (e) {
          console.error("보기 목록 셔플 파싱 에러:", e);
        }
      }
      return quiz;
    });

    return NextResponse.json({
      success: true,
      stage: {
        id: stage.id,
        stageNumber: stage.stageNumber,
        title: stage.title,
        category: stage.category,
        jlptLevel: jlptLevel,
        difficulty: difficulty
      },
      quizzes: selectedQuizzes
    });
  } catch (error) {
    console.error('다차원 퀴즈 추출 엔진 에러:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
