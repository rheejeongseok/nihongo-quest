import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { pointsToAdd } = await request.json();
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

    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        points: user.points + (pointsToAdd || 0)
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
