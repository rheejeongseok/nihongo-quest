import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// 북마크 조회 (GET)
export async function GET(request) {
  try {
    const rawUsername = request.headers.get("x-nihongo-username");
    const targetLevel = request.headers.get("x-nihongo-target-level") || "N1";
    let username = rawUsername ? decodeURIComponent(rawUsername) : "니혼고마스터";
    if (targetLevel === "BEGINNER") {
      username = `${username}-beginner`;
    }

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

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      orderBy: { savedAt: 'desc' }
    });

    return NextResponse.json({ success: true, bookmarks });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 북마크 등록 (POST)
export async function POST(request) {
  try {
    const rawUsername = request.headers.get("x-nihongo-username");
    const targetLevel = request.headers.get("x-nihongo-target-level") || "N1";
    let username = rawUsername ? decodeURIComponent(rawUsername) : "니혼고마스터";
    if (targetLevel === "BEGINNER") {
      username = `${username}-beginner`;
    }
    const { word, meaning, reading } = await request.json();
    
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

    // 이미 등록된 단어인지 중복 체크
    const existing = await prisma.bookmark.findFirst({
      where: {
        userId: user.id,
        word
      }
    });

    if (existing) {
      return NextResponse.json({ success: true, message: '이미 단어장에 존재합니다.', bookmark: existing });
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: user.id,
        word,
        meaning,
        reading
      }
    });

    return NextResponse.json({ success: true, message: '단어장에 성공적으로 추가되었습니다!', bookmark });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 북마크 제거 (DELETE)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: '삭제할 단어 ID가 없습니다.' }, { status: 400 });
    }

    await prisma.bookmark.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: '단어장에서 제거되었습니다.' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
