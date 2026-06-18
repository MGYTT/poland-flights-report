import { NextResponse } from 'next/server';
import { getArrivals, getDepartures, POLISH_AIRPORTS } from '@/lib/opensky';
import { getAirlineName } from '@/lib/airlines';
import { createServiceClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // OpenSky wymaga zakresu >2 dni UTC dla departures
  // Pobieramy: przedwczoraj 00:00 → wczoraj 23:59:59 UTC
  const now = new Date();

  const twoDaysAgo = new Date(now);
  twoDaysAgo.setUTCDate(now.getUTCDate() - 2);
  const dayStart = Math.floor(new Date(Date.UTC(
    twoDaysAgo.getUTCFullYear(),
    twoDaysAgo.getUTCMonth(),
    twoDaysAgo.getUTCDate(), 0, 0, 0
  )).getTime() / 1000);

  const yesterday = new Date(now);
  yesterday.setUTCDate(now.getUTCDate() - 1);
  const dayEnd = Math.floor(new Date(Date.UTC(
    yesterday.getUTCFullYear(),
    yesterday.getUTCMonth(),
    yesterday.getUTCDate(), 23, 59, 59
  )).getTime() / 1000);

  const reportDate = yesterday.toISOString().split('T')[0];

  console.log(`📊 Zbieranie danych za: ${reportDate} (${dayStart} → ${dayEnd})`);

  let allArrivals: any[] = [];
  let allDepartures: any[] = [];
  const airportData: any[] = [];
  const errors: string[] = [];

  for (const [icao, name] of Object.entries(POLISH_AIRPORTS)) {
    console.log(`✈️  Pobieram: ${icao} — ${name}`);

    const arrivals = await getArrivals(icao, dayStart, dayEnd);
    await new Promise(r => setTimeout(r, 2000));

    const departures = await getDepartures(icao, dayStart, dayEnd);
    await new Promise(r => setTimeout(r, 2000));

    if (!Array.isArray(arrivals)) {
      errors.push(`${icao} arrivals: nieoczekiwana odpowiedź`);
    }
    if (!Array.isArray(departures)) {
      errors.push(`${icao} departures: nieoczekiwana odpowiedź`);
    }

    const safeArrivals = Array.isArray(arrivals) ? arrivals : [];
    const safeDepartures = Array.isArray(departures) ? departures : [];

    allArrivals = [...allArrivals, ...safeArrivals];
    allDepartures = [...allDepartures, ...safeDepartures];

    airportData.push({
      report_date: reportDate,
      airport_icao: icao,
      airport_name: name,
      arrivals: safeArrivals.length,
      departures: safeDepartures.length,
    });

    console.log(`   ✅ ${icao}: ${safeArrivals.length} przylotów, ${safeDepartures.length} odlotów`);
  }

  // === TRASY ===
  const routeMap: Record<string, number> = {};
  for (const flight of allArrivals) {
    const origin = flight.estDepartureAirport;
    const dest = flight.estArrivalAirport;
    if (origin && dest && origin !== dest) {
      const route = `${origin}→${dest}`;
      routeMap[route] = (routeMap[route] || 0) + 1;
    }
  }
  const topRoute = Object.entries(routeMap).sort((a, b) => b[1] - a[1])[0];

  // === LINIE LOTNICZE ===
  const airlineMap: Record<string, number> = {};
  for (const flight of [...allArrivals, ...allDepartures]) {
    if (flight.callsign && flight.callsign.trim() !== '') {
      const airline = getAirlineName(flight.callsign);
      airlineMap[airline] = (airlineMap[airline] || 0) + 1;
    }
  }
  const topAirline = Object.entries(airlineMap).sort((a, b) => b[1] - a[1])[0];

  // === ZAPIS GŁÓWNY RAPORT ===
  const { error: reportError } = await supabase.from('daily_reports').upsert({
    report_date: reportDate,
    total_arrivals: allArrivals.length,
    total_departures: allDepartures.length,
    top_route: topRoute ? `${topRoute[0]} (${topRoute[1]}x)` : null,
    top_airline: topAirline ? `${topAirline[0]} (${topAirline[1]} lotów)` : null,
  });
  if (reportError) console.error('DB report error:', reportError);

  // === ZAPIS LOTNISKA ===
  const { error: airportError } = await supabase.from('airport_stats').upsert(airportData);
  if (airportError) console.error('DB airport error:', airportError);

  // === ZAPIS LINII LOTNICZYCH ===
  const airlineRows = Object.entries(airlineMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => ({
      report_date: reportDate,
      callsign: name,
      airline_name: name,
      flight_count: count,
    }));
  if (airlineRows.length > 0) {
    const { error: airlineError } = await supabase.from('airline_stats').upsert(airlineRows);
    if (airlineError) console.error('DB airline error:', airlineError);
  }

  // === ZAPIS TRAS ===
  const routeRows = Object.entries(routeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([route, count]) => {
      const [origin, destination] = route.split('→');
      return {
        report_date: reportDate,
        origin,
        destination,
        flight_count: count,
      };
    });
  if (routeRows.length > 0) {
    const { error: routeError } = await supabase.from('route_stats').upsert(routeRows);
    if (routeError) console.error('DB route error:', routeError);
  }

  return NextResponse.json({
    success: true,
    date: reportDate,
    totalArrivals: allArrivals.length,
    totalDepartures: allDepartures.length,
    airports: airportData,
    topRoute: topRoute ? topRoute[0] : null,
    topAirline: topAirline ? topAirline[0] : null,
    errors: errors.length > 0 ? errors : undefined,
  });
}