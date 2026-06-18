// app/dashboard/page.tsx
import { createPublicClient } from '@/lib/supabase-server';
import AirportTable from '@/components/AirportTable';
import AirlineTable from '@/components/AirlineTable';
import RouteTable from '@/components/RouteTable';
import ReportCard from '@/components/ReportCard';
import SocialPostGenerator from '@/components/SocialPostGenerator';

export const revalidate = 3600;

export default async function DashboardPage() {
  const supabase = createPublicClient();
  const today = new Date().toISOString().split('T')[0];

  const [
    { data: report },
    { data: airports },
    { data: airlines },
    { data: routes },
  ] = await Promise.all([
    supabase.from('daily_reports').select('*').eq('report_date', today).single(),
    supabase.from('airport_stats').select('*').eq('report_date', today).order('arrivals', { ascending: false }),
    supabase.from('airline_stats').select('*').eq('report_date', today).order('flight_count', { ascending: false }).limit(10),
    supabase.from('route_stats').select('*').eq('report_date', today).order('flight_count', { ascending: false }).limit(10),
  ]);

  const noData = !report;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Nawigacja */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✈️</span>
            <div>
              <h1 className="text-lg font-bold text-white">Raport Lotniczy Polska</h1>
              <p className="text-xs text-gray-400">Dane z OpenSky Network</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-300 font-medium">📅 {today}</p>
            <p className="text-xs text-gray-500">Aktualizacja codziennie o 01:00</p>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Brak danych — instrukcja */}
        {noData && (
          <div className="mb-8 bg-amber-950/50 border border-amber-700 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h2 className="font-semibold text-amber-300 mb-1">
                  Brak danych na dzisiaj ({today})
                </h2>
                <p className="text-amber-400/80 text-sm mb-3">
                  Dane zbierane są automatycznie codziennie o 01:00.
                  Możesz uruchomić zbieranie ręcznie:
                </p>
                <code className="bg-gray-900 text-green-400 px-3 py-2 rounded text-sm block">
                  /api/collect?secret=TWOJ_CRON_SECRET
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Karty statystyk */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <ReportCard
            title="Przyloty do Polski"
            value={report?.total_arrivals ?? '—'}
            subtitle="ze wszystkich lotnisk"
            icon="🛬"
            color="green"
          />
          <ReportCard
            title="Odloty z Polski"
            value={report?.total_departures ?? '—'}
            subtitle="ze wszystkich lotnisk"
            icon="🛫"
            color="blue"
          />
          <ReportCard
            title="Łącznie operacji"
            value={report ? report.total_arrivals + report.total_departures : '—'}
            subtitle="przyloty + odloty"
            icon="📊"
            color="purple"
          />
          <ReportCard
            title="Lotnisk monitorowanych"
            value={airports?.length ?? '—'}
            subtitle="w całej Polsce"
            icon="🏢"
            color="yellow"
          />
        </div>

        {/* Top trasa i linia */}
        {report && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <div className="text-xs text-gray-500 mb-1">🗺️ NAJCZĘSTSZA TRASA DNIA</div>
              <div className="text-xl font-bold text-white">
                {report.top_route || '—'}
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <div className="text-xs text-gray-500 mb-1">🏆 LIDER — LINIA LOTNICZA</div>
              <div className="text-xl font-bold text-white">
                {report.top_airline || '—'}
              </div>
            </div>
          </div>
        )}

        {/* Tabele */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <AirportTable airports={airports ?? []} />
          <AirlineTable airlines={airlines ?? []} />
        </div>

        <div className="mb-8">
          <RouteTable routes={routes ?? []} />
        </div>

        {/* Generator postów Social Media */}
        {report && (
          <SocialPostGenerator
            report={report}
            topAirport={airports?.[0]}
            date={today}
          />
        )}
      </div>
    </main>
  );
}