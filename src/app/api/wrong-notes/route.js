import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// 오답노트 조회 (GET)
export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ success: true, wrongAnswers: [] });
    }

    const wrongAnswers = await prisma.wrongAnswer.findMany({
      where: { userId: user.id, isResolved: false },
      include: { quiz: true },
      orderBy: { lastFailed: 'desc' }
    });

    return NextResponse.json({ success: true, wrongAnswers });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 오답노트 복습 해결 처리 (POST)
export async function POST(request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: '해결할 오답 ID가 없습니다.' }, { status: 400 });
    }

    // 완전히 지우지 않고 해결(isResolved = true) 상태로 업데이트
    await prisma.wrongAnswer.update({
      where: { id },
      data: { isResolved: true }
    });

    return NextResponse.json({ success: true, message: '오답 복습이 완료되었습니다!' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
