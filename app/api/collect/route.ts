import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getArrivals, getDepartures, POLISH_AIRPORTS, ICAO_TO_IATA } from '@/lib/airlabs';
import { createServiceClient } from '@/lib/supabase-server';

const AIRLINE_NAMES: Record<string, string> = {
  FR: 'Ryanair', W6: 'Wizz Air', LO: 'LOT Polish Airlines',
  U2: 'easyJet', LH: 'Lufthansa', BA: 'British Airways',
  AF: 'Air France', KL: 'KLM', EK: 'Emirates', QR: 'Qatar Airways',
  TK: 'Turkish Airlines', SK: 'SAS', IB: 'Iberia', OS: 'Austrian Airlines',
  SN: 'Brussels Airlines', TP: 'TAP Air Portugal', V7: 'Volotea',
  DY: 'Norwegian', PS: 'Ukraine International Airlines', PC: 'Pegasus Airlines',
  VY: 'Vueling', AZ: 'ITA Airways', DL: 'Delta Air Lines',
  AA: 'American Airlines', UA: 'United Airlines', MS: 'EgyptAir',
  ET: 'Ethiopian Airlines', RO: 'TAROM', BT: 'airBaltic',
  AY: 'Finnair', LX: 'SWISS', DE: 'Condor', X3: 'TUI fly',
  EN: 'Enter Air', 4: 'Enter Air', QS: 'SmartWings',
};

const AIRCRAFT_NAMES: Record<string, string> = {
  B738: 'Boeing 737-800', B739: 'Boeing 737-900', B737: 'Boeing 737-700',
  B752: 'Boeing 757-200', B763: 'Boeing 767-300', B772: 'Boeing 777-200',
  B77W: 'Boeing 777-300ER', B788: 'Boeing 787-8', B789: 'Boeing 787-9',
  A319: 'Airbus A319', A320: 'Airbus A320', A321: 'Airbus A321',
  A20N: 'Airbus A320neo', A21N: 'Airbus A321neo', A19N: 'Airbus A319neo',
  A332: 'Airbus A330-200', A333: 'Airbus A330-300',
  A359: 'Airbus A350-900', A388: 'Airbus A380-800',
  E170: 'Embraer E170', E175: 'Embraer E175',
  E190: 'Embraer E190', E195: 'Embraer E195',
  AT72: 'ATR 72', AT45: 'ATR 42',
  CRJ2: 'CRJ-200', CRJ7: 'CRJ-700', CRJ9: 'CRJ-900',
  DH8D: 'Bombardier Q400',
};

function resolveAirline(f: any): string {
  const iata = f.airline_iata;
  if (iata && AIRLINE_NAMES[iata]) return AIRLINE_NAMES[iata];
  if (f.airline_name?.trim()) return f.airline_name.trim();
  if (iata) return iata;
  return 'Nieznana linia';
}

function resolveAircraft(f: any): string | null {
  const code = f.aircraft_icao || f.aircraft_iata;
  if (!code?.trim()) return null;
  return AIRCRAFT_NAMES[code] || code;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const reportDate = new Date().toISOString().split('T')[0];

  console.log(`\n🚀 Zbieranie danych: ${reportDate}\n`);

  let allArrivals: any[] = [];
  let allDepartures: any[] = [];
  const airportData: any[] = [];

  for (const [icao, name] of Object.entries(POLISH_AIRPORTS)) {
    const iata = ICAO_TO_IATA[icao];
    if (!iata) continue;

    // Pobierz równolegle przyloty i odloty
    const [arrivals, departures] = await Promise.all([
      getArrivals(iata),
      getDepartures(iata),
    ]);

    // Filtruj tylko loty które faktycznie dziś operują
    // (status: landed = wylądował, scheduled = zaplanowany, active = w powietrzu)
    const todayArrivals = arrivals.filter((f: any) => {
      const time = f.arr_time || f.arr_estimated || f.dep_time || '';
      return time.startsWith(reportDate) || f.status === 'landed' || f.status === 'active';
    });

    const todayDepartures = departures.filter((f: any) => {
      const time = f.dep_time || f.dep_estimated || '';
      return time.startsWith(reportDate) || f.status === 'active' || f.status === 'scheduled';
    });

    allArrivals = [...allArrivals, ...todayArrivals];
    allDepartures = [...allDepartures, ...todayDepartures];

    airportData.push({
      report_date: reportDate,
      airport_icao: icao,
      airport_name: name,
      arrivals: todayArrivals.length,
      departures: todayDepartures.length,
    });

    console.log(`✅ ${icao}: ${todayArrivals.length} przylotów | ${todayDepartures.length} odlotów`);
    await new Promise(r => setTimeout(r, 600));
  }

  // === TRASY ===
  const routeMap: Record<string, number> = {};
  for (const f of allArrivals) {
    const o = f.dep_iata, d = f.arr_iata;
    if (o && d && o !== d) routeMap[`${o}→${d}`] = (routeMap[`${o}→${d}`] || 0) + 1;
  }

  // === LINIE LOTNICZE ===
  const airlineMap: Record<string, number> = {};
  for (const f of [...allArrivals, ...allDepartures]) {
    const a = resolveAirline(f);
    airlineMap[a] = (airlineMap[a] || 0) + 1;
  }

  // === MODELE SAMOLOTÓW ===
  const aircraftMap: Record<string, number> = {};
  for (const f of [...allArrivals, ...allDepartures]) {
    const m = resolveAircraft(f);
    if (m) aircraftMap[m] = (aircraftMap[m] || 0) + 1;
  }

  const topRoute = Object.entries(routeMap).sort((a, b) => b[1] - a[1])[0];
  const topAirline = Object.entries(airlineMap).sort((a, b) => b[1] - a[1])[0];
  const topAircraft = Object.entries(aircraftMap).sort((a, b) => b[1] - a[1])[0];

  // === ZAPIS ===
  const [r1, r2, r3, r4] = await Promise.all([
    supabase.from('daily_reports').upsert({
      report_date: reportDate,
      total_arrivals: allArrivals.length,
      total_departures: allDepartures.length,
      top_route: topRoute ? `${topRoute[0]} (${topRoute[1]}x)` : null,
      top_airline: topAirline ? `${topAirline[0]} (${topAirline[1]} lotów)` : null,
      top_aircraft_model: topAircraft ? `${topAircraft[0]} (${topAircraft[1]}x)` : null,
    }),
    supabase.from('airport_stats').upsert(airportData),
    supabase.from('airline_stats').upsert(
      Object.entries(airlineMap)
        .sort((a, b) => b[1] - a[1]).slice(0, 20)
        .map(([name, count]) => ({
          report_date: reportDate,
          callsign: name,
          airline_name: name,
          flight_count: count,
        }))
    ),
    supabase.from('route_stats').upsert(
      Object.entries(routeMap)
        .sort((a, b) => b[1] - a[1]).slice(0, 30)
        .map(([route, count]) => {
          const [origin, destination] = route.split('→');
          return { report_date: reportDate, origin, destination, flight_count: count };
        })
    ),
  ]);

  // Loguj błędy zapisu
  [r1, r2, r3, r4].forEach((r, i) => {
    if (r.error) console.error(`DB error [${i}]:`, r.error);
  });

  revalidatePath('/dashboard');
  revalidatePath('/');

  console.log(`\n✅ GOTOWE: ${allArrivals.length} przylotów | ${allDepartures.length} odlotów`);

  return NextResponse.json({
    success: true,
    date: reportDate,
    totalArrivals: allArrivals.length,
    totalDepartures: allDepartures.length,
    topRoute: topRoute?.[0] ?? null,
    topAirline: topAirline?.[0] ?? null,
    topAircraft: topAircraft?.[0] ?? null,
    airports: airportData,
    dbErrors: [r1, r2, r3, r4].map(r => r.error).filter(Boolean),
  });
}