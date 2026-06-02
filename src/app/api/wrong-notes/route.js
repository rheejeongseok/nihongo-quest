import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// 오답노트 조회 (GET) - 에빙하우스 필터링 파라미터 지원
export async function GET(request) {
  try {
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

    // 에빙하우스 필터 여부 파싱
    const { searchParams } = new URL(request.url);
    const isEbbinghaus = searchParams.get('ebbinghaus') === 'true';

    let wrongAnswers = await prisma.wrongAnswer.findMany({
      where: { userId: user.id, isResolved: false },
      include: { quiz: true },
      orderBy: { lastFailed: 'desc' }
    });

    if (isEbbinghaus) {
      const now = Date.now();
      wrongAnswers = wrongAnswers.filter(item => {
        const lastFailedTime = new Date(item.lastFailed).getTime();
        const diffHours = (now - lastFailedTime) / (1000 * 60 * 60);
        
        const reviewCount = item.reviewCount || 1;
        
        // 에빙하우스 5단계 노출 대기시간 필터링
        if (reviewCount === 1) return diffHours >= 24;  // 1단계: 24시간 이후
        if (reviewCount === 2) return diffHours >= 72;  // 2단계: 3일 이후
        if (reviewCount === 3) return diffHours >= 168; // 3단계: 7일 이후
        if (reviewCount === 4) return diffHours >= 360; // 4단계: 15일 이후
        if (reviewCount === 5) return diffHours >= 720; // 5단계: 30일 이후
        return true;
      });
    }

    return NextResponse.json({ success: true, wrongAnswers });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 오답노트 복습 해결 처리 (POST) - SRS 단계 갱신 및 5단계 졸업
export async function POST(request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: '해결할 오답 ID가 없습니다.' }, { status: 400 });
    }

    const wrongAnswer = await prisma.wrongAnswer.findUnique({
      where: { id }
    });

    if (!wrongAnswer) {
      return NextResponse.json({ success: false, error: '존재하지 않는 오답 기록입니다.' }, { status: 404 });
    }

    const currentCount = wrongAnswer.reviewCount || 1;
    let nextCount = currentCount + 1;
    let isResolved = false;

    // 💡 [사용자 경험 개선]: 에빙하우스 다회성 대기 방식 대신 복습 완료를 단 한 번이라도 누르면 
    // 즉시 오답노트 전체 목록에서 완벽 소탕(isResolved = true)되어 즉시 사라지도록 해결 처리합니다!
    isResolved = true;

    await prisma.wrongAnswer.update({
      where: { id },
      data: {
        reviewCount: nextCount,
        lastFailed: new Date(),
        isResolved: isResolved
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: isResolved ? '축하합니다! 5단계 졸업 완료!' : '복습 단계 상승!', 
      isGraduated: isResolved,
      nextCount: nextCount
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
