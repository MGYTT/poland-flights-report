// app/api/debug/route.ts
import { NextResponse } from 'next/server';
import { createServiceClient, createPublicClient } from '@/lib/supabase-server';

export async function GET() {
  const serviceClient = createServiceClient();
  const publicClient = createPublicClient();
  const today = new Date().toISOString().split('T')[0];

  // Test zapisu przez service role
  const { error: writeError } = await serviceClient
    .from('daily_reports')
    .upsert({
      report_date: today,
      total_arrivals: 999,
      total_departures: 888,
      top_route: 'TEST→TEST',
      top_airline: 'TestAir',
    });

  // Test odczytu przez public client
  const { data: report, error: readError } = await publicClient
    .from('daily_reports')
    .select('*')
    .eq('report_date', today)
    .single();

  // Sprawdź jakie klucze są używane (pierwsze 20 znaków)
  const serviceKeyPreview = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) + '...';
  const anonKeyPreview = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) + '...';
  const urlPreview = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return NextResponse.json({
    today,
    writeError,
    report,
    readError,
    keys: {
      serviceKey: serviceKeyPreview,
      anonKey: anonKeyPreview,
      url: urlPreview,
    },
  });
}