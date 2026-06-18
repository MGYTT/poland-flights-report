export const dynamic = 'force-dynamic';

import { createPublicClient } from '@/lib/supabase-server';

export default async function DashboardPage() {
  const supabase = createPublicClient();
  const yesterday = new Date();
yesterday.setUTCDate(yesterday.getUTCDate() - 1);
const today = yesterday.toISOString().split('T')[0];
  const dateFormatted = new Date(today).toLocaleDateString('pl-PL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

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

  const total = report ? report.total_arrivals + report.total_departures : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 50%, #0a0f1e 100%)', color: 'white', fontFamily: 'system-ui, sans-serif' }}>

      {/* NAVBAR */}
      <nav style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '32px' }}>✈️</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'white' }}>Raport Lotniczy Polska</div>
            <div style={{ fontSize: '12px', color: '#60a5fa' }}>Powered by OpenSky Network</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', color: 'white', fontWeight: 600 }}>📅 {dateFormatted}</div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Aktualizacja codziennie o 01:00</div>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>

        {/* BRAK DANYCH */}
        {!report && (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '16px', padding: '20px 24px', marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <div>
              <div style={{ color: '#fcd34d', fontWeight: 600, marginBottom: '6px' }}>Brak danych na dzisiaj ({today})</div>
              <div style={{ color: '#d97706', fontSize: '14px', marginBottom: '10px' }}>Uruchom zbieranie danych ręcznie, otwierając w przeglądarce:</div>
              <code style={{ background: '#0d1117', color: '#34d399', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', display: 'block' }}>
                /api/collect?secret=TWOJ_CRON_SECRET
              </code>
            </div>
          </div>
        )}

        {/* HERO STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { icon: '🛬', label: 'Przyloty do Polski', value: report?.total_arrivals ?? '—', sub: 'ze wszystkich lotnisk', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)' },
            { icon: '🛫', label: 'Odloty z Polski', value: report?.total_departures ?? '—', sub: 'ze wszystkich lotnisk', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.3)' },
            { icon: '📊', label: 'Łącznie operacji', value: total || '—', sub: 'przyloty + odloty', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.3)' },
            { icon: '🏢', label: 'Lotnisk w raporcie', value: airports?.length ?? '—', sub: 'monitorowanych', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)' },
          ].map((card, i) => (
            <div key={i} style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: '16px', padding: '24px', transition: 'transform 0.2s' }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{card.icon}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{card.label}</div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* TOP TRASA + LINIA */}
        {report && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>🗺️ Najczęstsza trasa dnia</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#c4b5fd' }}>{report.top_route || '—'}</div>
            </div>
            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>🏆 Lider — linia lotnicza</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#fbbf24' }}>{report.top_airline || '—'}</div>
            </div>
          </div>
        )}

        {/* TABELE */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

          {/* Lotniska */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>🏢 Statystyki lotnisk</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lotnisko</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>🛬</th>
                  <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>🛫</th>
                </tr>
              </thead>
              <tbody>
                {(airports ?? []).map((a: any, i: number) => (
                  <tr key={a.airport_icao} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '13px 24px' }}>
                      <span style={{ color: '#60a5fa', fontFamily: 'monospace', fontWeight: 700, fontSize: '13px' }}>{a.airport_icao}</span>
                      <span style={{ color: '#9ca3af', fontSize: '11px', marginLeft: '8px' }}>{a.airport_name}</span>
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{a.arrivals}</td>
                    <td style={{ padding: '13px 24px', textAlign: 'right', color: '#3b82f6', fontWeight: 700 }}>{a.departures}</td>
                  </tr>
                ))}
                {(!airports || airports.length === 0) && (
                  <tr><td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#4b5563' }}>Brak danych</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Linie lotnicze */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>🏆 Top 10 linii lotniczych</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>#</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Linia</th>
                  <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Loty</th>
                </tr>
              </thead>
              <tbody>
                {(airlines ?? []).map((a: any, i: number) => (
                  <tr key={a.airline_name} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '13px 24px', color: '#6b7280', fontSize: '13px' }}>{i + 1}</td>
                    <td style={{ padding: '13px 16px', color: 'white', fontSize: '14px' }}>{a.airline_name}</td>
                    <td style={{ padding: '13px 24px', textAlign: 'right', color: '#fbbf24', fontWeight: 700 }}>{a.flight_count}</td>
                  </tr>
                ))}
                {(!airlines || airlines.length === 0) && (
                  <tr><td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#4b5563' }}>Brak danych</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TRASY */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden', marginBottom: '32px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>🗺️ Top 10 najczęstszych tras</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>#</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Skąd</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Dokąd</th>
                <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Loty</th>
              </tr>
            </thead>
            <tbody>
              {(routes ?? []).map((r: any, i: number) => (
                <tr key={`${r.origin}-${r.destination}`} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '13px 24px', color: '#6b7280' }}>{i + 1}</td>
                  <td style={{ padding: '13px 16px', color: '#60a5fa', fontFamily: 'monospace', fontWeight: 700 }}>{r.origin}</td>
                  <td style={{ padding: '13px 16px', color: '#34d399', fontFamily: 'monospace', fontWeight: 700 }}>{r.destination}</td>
                  <td style={{ padding: '13px 24px', textAlign: 'right', color: '#a78bfa', fontWeight: 700 }}>{r.flight_count}</td>
                </tr>
              ))}
              {(!routes || routes.length === 0) && (
                <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#4b5563' }}>Brak danych</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* GENERATOR POSTÓW */}
        {report && (
          <SocialSection report={report} total={total} date={today} dateFormatted={dateFormatted} topAirport={airports?.[0]} />
        )}

        {/* STOPKA */}
        <div style={{ textAlign: 'center', color: '#374151', fontSize: '13px', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          Dane: OpenSky Network · Projekt zbudowany w Next.js · Hosting: Vercel
        </div>
      </div>
    </div>
  );
}

function SocialSection({ report, total, date, dateFormatted, topAirport }: any) {
  const posts = [
    {
      label: '📊 Post dzienny',
      text: `✈️ RAPORT LOTNICZY POLSKA — ${dateFormatted}\n\n🛬 Przyloty: ${report.total_arrivals}\n🛫 Odloty: ${report.total_departures}\n📊 Łącznie: ${total} operacji\n\n🗺️ Najczęstsza trasa: ${report.top_route ?? '—'}\n🏆 Przewoźnik: ${report.top_airline ?? '—'}\n\n#LotnictwoPolska #Avgeek #Aviation`,
    },
    {
      label: '🏢 Top lotnisko',
      text: `🏢 TOP LOTNISKO POLSKI — ${dateFormatted}\n\n🥇 ${topAirport?.airport_name} (${topAirport?.airport_icao})\n🛬 Przylotów: ${topAirport?.arrivals}\n🛫 Odlotów: ${topAirport?.departures}\n📊 Łącznie: ${(topAirport?.arrivals ?? 0) + (topAirport?.departures ?? 0)}\n\n#${topAirport?.airport_icao} #LotnictwoPolska`,
    },
    {
      label: '🔢 Angażujący post',
      text: `📈 POLSKA Z POWIETRZA — ${dateFormatted}\n\nDziś:\n→ ${report.total_arrivals} samolotów wylądowało 🛬\n→ ${report.total_departures} samolotów wystartowało 🛫\n→ ${total} operacji łącznie\n\nJaki jest Twój ulubiony lot? 👇\n\n#Lotnictwo #Polska #Aviation`,
    },
  ];

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
      <div style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '6px' }}>📱 Generator postów — Social Media</div>
      <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '24px' }}>Gotowe posty na Instagram, Facebook, Twitter/X — kliknij aby skopiować</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {posts.map((post, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#d1d5db', marginBottom: '12px' }}>{post.label}</div>
            <pre style={{ fontSize: '12px', color: '#86efac', whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.6, flex: 1, marginBottom: '12px' }}>{post.text}</pre>
            <CopyButton text={post.text} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Osobny client component do kopiowania
import CopyButton from '@/components/CopyButton';