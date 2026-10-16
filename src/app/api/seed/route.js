import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { timingSafeEqual } from 'node:crypto';
import { syncLearningData } from '@/lib/learningData.mjs';

export const dynamic = 'force-dynamic';
function isSeedAuthorized(request) {
  if (process.env.NODE_ENV !== 'production') return true;
  const configured = process.env.SEED_ADMIN_TOKEN || '';
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  const expected = Buffer.from(configured);
  const actual = Buffer.from(supplied);
  return expected.length > 0 && expected.length === actual.length && timingSafeEqual(expected, actual);
}
export async function POST(request) {
  if (!isSeedAuthorized(request)) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  try {
    return NextResponse.json({ success: true, ...await syncLearningData(prisma) });
  } catch (error) {
    console.error('Learning data sync failed:', error);
    return NextResponse.json({ success: false, error: 'Learning data sync failed.' }, { status: 500 });
  }
}
export async function GET() {
  return NextResponse.json({ success: false, error: 'POST required.' }, { status: 405, headers: { Allow: 'POST' } });
}
