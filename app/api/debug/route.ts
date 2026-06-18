// app/api/debug/route.ts
import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createPublicClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: report, error: reportError } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('report_date', today)
    .single();

  const { data: airports, error: airportError } = await supabase
    .from('airport_stats')
    .select('*')
    .eq('report_date', today);

  return NextResponse.json({
    today,
    report,
    reportError,
    airports,
    airportError,
    airportsCount: airports?.length ?? 0,
  });
}