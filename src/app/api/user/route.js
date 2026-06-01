import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
