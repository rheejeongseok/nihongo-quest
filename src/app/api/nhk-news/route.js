import { NextResponse } from 'next/server';
import { getNewsPayload } from '@/lib/newsService';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const forceRefresh = new URL(request.url).searchParams.get('refresh') === 'true';
  const { payload, cached } = await getNewsPayload(forceRefresh);
  return NextResponse.json({ ...payload, cached }, { headers: {
    'Cache-Control': forceRefresh ? 'no-store' : 'public, max-age=0, s-maxage=900, stale-while-revalidate=3600'
  } });
}
