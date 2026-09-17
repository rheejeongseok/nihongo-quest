import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getOrCreateRequestUser } from '@/lib/requestUser';

export const dynamic = 'force-dynamic';

// 북마크 조회 (GET)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get('countOnly') === 'true';
    const { user } = await getOrCreateRequestUser(request);

    if (countOnly) {
      const count = await prisma.bookmark.count({
        where: { userId: user.id }
      });

      return NextResponse.json({ success: true, count });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      orderBy: { savedAt: 'desc' }
    });

    return NextResponse.json({ success: true, bookmarks });
  } catch (error) {
    console.error('[BOOKMARK LIST ERROR]:', error);
    return NextResponse.json({ success: false, error: '단어장을 불러오지 못했습니다.' }, { status: 500 });
  }
}

// 북마크 등록 (POST)
export async function POST(request) {
  try {
    const { user } = await getOrCreateRequestUser(request);
    const body = await request.json();
    const word = String(body.word || '').trim().slice(0, 100);
    const meaning = String(body.meaning || '').trim().slice(0, 500);
    const reading = String(body.reading || '').trim().slice(0, 100);
    if (!word) {
      return NextResponse.json({ success: false, error: '저장할 단어가 없습니다.' }, { status: 400 });
    }

    // 이미 등록된 단어인지 중복 체크
    const existing = await prisma.bookmark.findUnique({
      where: { userId_word: { userId: user.id, word } }
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
    console.error('[BOOKMARK CREATE ERROR]:', error);
    return NextResponse.json({ success: false, error: '단어를 저장하지 못했습니다.' }, { status: 500 });
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

    const { user } = await getOrCreateRequestUser(request);
    const result = await prisma.bookmark.deleteMany({
      where: { id, userId: user.id }
    });

    if (!result.count) {
      return NextResponse.json({ success: false, error: '삭제할 단어를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: '단어장에서 제거되었습니다.' });
  } catch (error) {
    console.error('[BOOKMARK DELETE ERROR]:', error);
    return NextResponse.json({ success: false, error: '단어를 삭제하지 못했습니다.' }, { status: 500 });
  }
}
