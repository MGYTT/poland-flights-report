export const dynamic = 'force-dynamic';

import { createPublicClient } from '@/lib/supabase-server';
import CopyButton from '@/components/CopyButton';

export default async function DashboardPage() {
  const supabase = createPublicClient();
  const today = new Date().toISOString().split('T')[0];
  const dateFormatted = new Date(today).toLocaleDateString('pl-PL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
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

  const post1 = `✈️ RAPORT LOTNICZY POLSKA — ${dateFormatted.toUpperCase()}

🛬 Przyloty do Polski: ${report?.total_arrivals ?? 0}
🛫 Odloty z Polski: ${report?.total_departures ?? 0}
📊 Łącznie operacji: ${total}

🗺️ Najczęstsza trasa: ${report?.top_route ?? '—'}
🏆 Największy przewoźnik: ${report?.top_airline ?? '—'}
✈️ Najczęstszy samolot: ${report?.top_aircraft_model ?? '—'}

📡 Źródło: AirLabs / OpenSky
#LotnictwoPolska #Avgeek #Aviation #Polska #Flights`;

  const post2 = `🏢 RANKING LOTNISK POLSKI — ${dateFormatted.toUpperCase()}

${(airports ?? []).slice(0, 5).map((a: any, i: number) =>
  `${['🥇','🥈','🥉','4️⃣','5️⃣'][i]} ${a.airport_name}: ${a.arrivals + a.departures} operacji`
).join('\n')}

📊 Łącznie dziś: ${total} lotów w całej Polsce
#LotnictwoPolska #Airport #Aviation #Polska`;

  const post3 = `📈 POLSKA Z POWIETRZA — ${dateFormatted.toUpperCase()}

Dziś nad Polską:
→ ${report?.total_arrivals ?? 0} samolotów wylądowało 🛬
→ ${report?.total_departures ?? 0} samolotów wystartowało 🛫
→ ${total} operacji lotniczych łącznie 📊

Które lotnisko jest Twoim ulubionym? Napisz w komentarzu! 👇

#Lotnictwo #Polska #FlightTracker #AviationDaily`;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #060d1f 0%, #0a1628 40%, #060d1f 100%)',
      color: 'white',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* NAVBAR */}
      <nav style={{
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 32px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px',
          }}>✈️</div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.3px' }}>
              Raport Lotniczy Polska
            </div>
            <div style={{ fontSize: '11px', color: '#60a5fa', marginTop: '1px' }}>
              Dane real-time · AirLabs API
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '8px',
            padding: '6px 14px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#93c5fd' }}>
              📅 {dateFormatted}
            </div>
            <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '1px' }}>
              Cron: codziennie 01:00 UTC
            </div>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px' }}>

        {/* BRAK DANYCH */}
        {!report && (
          <div style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.35)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            display: 'flex',
            gap: '16px',
          }}>
            <span style={{ fontSize: '28px', flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ color: '#fcd34d', fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>
                Brak danych na dzisiaj ({today})
              </div>
              <div style={{ color: '#92400e', fontSize: '14px', marginBottom: '12px' }}>
                Uruchom zbieranie danych ręcznie odwiedzając poniższy URL:
              </div>
              <code style={{
                background: '#0d1117',
                color: '#34d399',
                padding: '10px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                display: 'block',
                border: '1px solid rgba(52,211,153,0.2)',
              }}>
                {`/api/collect?secret=TWOJ_CRON_SECRET`}
              </code>
            </div>
          </div>
        )}

        {/* GŁÓWNE KARTY STATYSTYK */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          {[
            {
              icon: '🛬', label: 'Przyloty do Polski',
              value: report?.total_arrivals ?? '—',
              sub: 'ze wszystkich lotnisk',
              gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
              border: 'rgba(16,185,129,0.3)', color: '#34d399',
            },
            {
              icon: '🛫', label: 'Odloty z Polski',
              value: report?.total_departures ?? '—',
              sub: 'ze wszystkich lotnisk',
              gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
              border: 'rgba(59,130,246,0.3)', color: '#60a5fa',
            },
            {
              icon: '📊', label: 'Łącznie operacji',
              value: total || '—',
              sub: 'przyloty + odloty',
              gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))',
              border: 'rgba(139,92,246,0.3)', color: '#a78bfa',
            },
            {
              icon: '🏢', label: 'Lotnisk w Polsce',
              value: airports?.length ?? '—',
              sub: 'aktywnie monitorowanych',
              gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
              border: 'rgba(245,158,11,0.3)', color: '#fbbf24',
            },
          ].map((card, i) => (
            <div key={i} style={{
              background: card.gradient,
              border: `1px solid ${card.border}`,
              borderRadius: '20px',
              padding: '24px',
            }}>
              <div style={{ fontSize: '30px', marginBottom: '14px' }}>{card.icon}</div>
              <div style={{
                fontSize: '10px', color: '#6b7280',
                textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px',
              }}>
                {card.label}
              </div>
              <div style={{
                fontSize: '40px', fontWeight: 800,
                color: card.color, lineHeight: 1, letterSpacing: '-1px',
              }}>
                {card.value}
              </div>
              <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '8px' }}>
                {card.sub}
              </div>
            </div>
          ))}
        </div>

        {/* HIGHLIGHTS — trasa, linia, model */}
        {report && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}>
            {[
              {
                icon: '🗺️', label: 'Najczęstsza trasa dnia',
                value: report.top_route ?? '—',
                color: '#c4b5fd', border: 'rgba(196,181,253,0.2)',
                bg: 'rgba(139,92,246,0.06)',
              },
              {
                icon: '🏆', label: 'Lider — linia lotnicza',
                value: report.top_airline ?? '—',
                color: '#fbbf24', border: 'rgba(251,191,36,0.2)',
                bg: 'rgba(245,158,11,0.06)',
              },
              {
                icon: '🛩️', label: 'Najczęstszy model samolotu',
                value: report.top_aircraft_model ?? '—',
                color: '#67e8f9', border: 'rgba(103,232,249,0.2)',
                bg: 'rgba(6,182,212,0.06)',
              },
            ].map((h, i) => (
              <div key={i} style={{
                background: h.bg,
                border: `1px solid ${h.border}`,
                borderRadius: '16px',
                padding: '20px 24px',
              }}>
                <div style={{
                  fontSize: '10px', color: '#6b7280',
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px',
                }}>
                  {h.icon} {h.label}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: h.color }}>
                  {h.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TABELE — lotniska + linie */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '20px',
        }}>

          {/* LOTNISKA */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span style={{ fontSize: '18px' }}>🏢</span>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>Statystyki lotnisk</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Lotnisko', '🛬 Przyloty', '🛫 Odloty', 'Razem'].map((h, i) => (
                    <th key={i} style={{
                      padding: '10px 16px',
                      textAlign: i === 0 ? 'left' : 'right',
                      fontSize: '10px', color: '#4b5563',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      fontWeight: 600,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(airports ?? []).map((a: any, i: number) => (
                  <tr key={a.airport_icao} style={{
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{
                        display: 'inline-block',
                        background: 'rgba(59,130,246,0.15)',
                        color: '#60a5fa',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        marginRight: '8px',
                      }}>
                        {a.airport_icao}
                      </div>
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                        {a.airport_name}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#34d399', fontWeight: 700 }}>
                      {a.arrivals}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#60a5fa', fontWeight: 700 }}>
                      {a.departures}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#e5e7eb', fontWeight: 800 }}>
                      {a.arrivals + a.departures}
                    </td>
                  </tr>
                ))}
                {(!airports || airports.length === 0) && (
                  <tr>
                    <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#374151' }}>
                      Brak danych
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* LINIE LOTNICZE */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span style={{ fontSize: '18px' }}>🏆</span>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>Top 10 linii lotniczych</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['#', 'Linia', 'Loty', 'Udział %'].map((h, i) => (
                    <th key={i} style={{
                      padding: '10px 16px',
                      textAlign: i < 2 ? 'left' : 'right',
                      fontSize: '10px', color: '#4b5563',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      fontWeight: 600,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(airlines ?? []).map((a: any, i: number) => {
                  const pct = total > 0 ? ((a.flight_count / total) * 100).toFixed(1) : '0';
                  return (
                    <tr key={a.airline_name} style={{
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    }}>
                      <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: '13px', width: '36px' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                      </td>
                      <td style={{ padding: '12px 8px', color: 'white', fontSize: '14px', fontWeight: 500 }}>
                        {a.airline_name}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#fbbf24', fontWeight: 700 }}>
                        {a.flight_count}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <span style={{
                          background: 'rgba(251,191,36,0.1)',
                          color: '#d97706',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {(!airlines || airlines.length === 0) && (
                  <tr>
                    <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#374151' }}>
                      Brak danych
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TRASY */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px',
          overflow: 'hidden',
          marginBottom: '32px',
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ fontSize: '18px' }}>🗺️</span>
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Top 10 najczęstszych tras</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['#', 'Skąd', '→', 'Dokąd', 'Loty'].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 16px',
                    textAlign: i === 4 ? 'right' : 'left',
                    fontSize: '10px', color: '#4b5563',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    fontWeight: 600,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(routes ?? []).map((r: any, i: number) => (
                <tr key={`${r.origin}-${r.destination}`} style={{
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                }}>
                  <td style={{ padding: '13px 16px', color: '#4b5563', width: '36px' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </td>
                  <td style={{ padding: '13px 8px' }}>
                    <span style={{
                      background: 'rgba(59,130,246,0.15)',
                      color: '#60a5fa',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '13px',
                      padding: '3px 10px',
                      borderRadius: '8px',
                    }}>{r.origin}</span>
                  </td>
                  <td style={{ padding: '13px 4px', color: '#374151', fontSize: '16px' }}>→</td>
                  <td style={{ padding: '13px 8px' }}>
                    <span style={{
                      background: 'rgba(52,211,153,0.12)',
                      color: '#34d399',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '13px',
                      padding: '3px 10px',
                      borderRadius: '8px',
                    }}>{r.destination}</span>
                  </td>
                  <td style={{ padding: '13px 16px', textAlign: 'right', color: '#a78bfa', fontWeight: 700 }}>
                    {r.flight_count}
                  </td>
                </tr>
              ))}
              {(!routes || routes.length === 0) && (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#374151' }}>
                    Brak danych
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* GENERATOR POSTÓW */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <span style={{ fontSize: '22px' }}>📱</span>
            <span style={{ fontSize: '17px', fontWeight: 700 }}>Generator postów — Social Media</span>
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>
            3 gotowe posty na Instagram · Facebook · Twitter/X — kliknij aby skopiować
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
          }}>
            {[
              { label: '📊 Raport dzienny', text: post1, color: '#3b82f6' },
              { label: '🏢 Ranking lotnisk', text: post2, color: '#10b981' },
              { label: '🔢 Post angażujący', text: post3, color: '#8b5cf6' },
            ].map((post, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{
                  display: 'inline-block',
                  background: `${post.color}20`,
                  color: post.color,
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  marginBottom: '14px',
                  width: 'fit-content',
                }}>
                  {post.label}
                </div>
                <pre style={{
                  fontSize: '12px',
                  color: '#86efac',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  lineHeight: 1.7,
                  flex: 1,
                  marginBottom: '14px',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}>
                  {post.text}
                </pre>
                <CopyButton text={post.text} color={post.color} />
              </div>
            ))}
          </div>
        </div>

        {/* STOPKA */}
        <div style={{
          textAlign: 'center',
          color: '#1f2937',
          fontSize: '12px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          ✈️ Poland Flights Report · Dane: AirLabs API · Next.js + Supabase · Hosting: Vercel
        </div>
      </div>
    </div>
  );
}