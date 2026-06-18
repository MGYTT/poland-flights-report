import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Vercel wysyła nagłówek authorization z cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  const res = await fetch(
    `${baseUrl}/api/collect?secret=${process.env.CRON_SECRET}`
  );
  const data = await res.json();

  return NextResponse.json(data);
}