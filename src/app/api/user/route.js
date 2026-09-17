import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getOrCreateRequestUser } from '@/lib/requestUser';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { user } = await getOrCreateRequestUser(request);

    const [wrongCount, bookmarkCount] = await Promise.all([
      prisma.wrongAnswer.count({
        where: { userId: user.id, isResolved: false }
      }),
      prisma.bookmark.count({
        where: { userId: user.id }
      })
    ]);

    return NextResponse.json({
      success: true,
      user,
      wrongCount,
      bookmarkCount
    });
  } catch (error) {
    console.error('[USER LOAD ERROR]:', error);
    return NextResponse.json({ success: false, error: '사용자 정보를 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { action } = await request.json();
    const fixedRewards = { calligraphy_complete: 10 };
    const points = fixedRewards[action];
    if (!points) {
      return NextResponse.json({ success: false, error: '허용되지 않은 포인트 작업입니다.' }, { status: 400 });
    }

    const { user } = await getOrCreateRequestUser(request);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        points: { increment: points }
      }
    });

    return NextResponse.json({ success: true, user: updatedUser, pointsEarned: points });
  } catch (error) {
    console.error('[USER REWARD ERROR]:', error);
    return NextResponse.json({ success: false, error: '포인트를 반영하지 못했습니다.' }, { status: 500 });
  }
}
