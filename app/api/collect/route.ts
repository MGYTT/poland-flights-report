import { NextResponse } from 'next/server';
import { getArrivals, getDepartures, POLISH_AIRPORTS } from '@/lib/opensky';
import { getAirlineName } from '@/lib/airlines';
import { createServiceClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  // Zabezpieczenie — tylko Vercel Cron lub ręczne wywołanie z kluczem
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = Math.floor(Date.now() / 1000);
  // Zbieramy dane z ostatnich 24 godzin
  const dayStart = now - 86400;
  const reportDate = new Date().toISOString().split('T')[0];

  console.log(`📊 Zbieranie danych dla: ${reportDate}`);

  let allArrivals: any[] = [];
  let allDepartures: any[] = [];
  const airportData: any[] = [];

  // Pobierz dane dla każdego lotniska
  for (const [icao, name] of Object.entries(POLISH_AIRPORTS)) {
    console.log(`✈️  Lotnisko: ${icao}`);

    const arrivals = await getArrivals(icao, dayStart, now);
    const departures = await getDepartures(icao, dayStart, now);

    // Czekaj 1 sekundę między zapytaniami (rate limiting)
    await new Promise(r => setTimeout(r, 1000));

    allArrivals = [...allArrivals, ...arrivals];
    allDepartures = [...allDepartures, ...departures];

    airportData.push({
      report_date: reportDate,
      airport_icao: icao,
      airport_name: name,
      arrivals: arrivals.length,
      departures: departures.length,
    });
  }

  // === STATYSTYKI TRAS ===
  const routeMap: Record<string, number> = {};
  for (const flight of allArrivals) {
    if (flight.estDepartureAirport && flight.estArrivalAirport) {
      const route = `${flight.estDepartureAirport}→${flight.estArrivalAirport}`;
      routeMap[route] = (routeMap[route] || 0) + 1;
    }
  }
  const topRoute = Object.entries(routeMap).sort((a, b) => b[1] - a[1])[0];

  // === STATYSTYKI LINII LOTNICZYCH ===
  const airlineMap: Record<string, number> = {};
  for (const flight of [...allArrivals, ...allDepartures]) {
    if (flight.callsign) {
      const name = getAirlineName(flight.callsign);
      airlineMap[name] = (airlineMap[name] || 0) + 1;
    }
  }
  const topAirline = Object.entries(airlineMap).sort((a, b) => b[1] - a[1])[0];

  // === ZAPIS DO BAZY ===

  // 1. Główny raport
  await supabase.from('daily_reports').upsert({
    report_date: reportDate,
    total_arrivals: allArrivals.length,
    total_departures: allDepartures.length,
    top_route: topRoute ? `${topRoute[0]} (${topRoute[1]}x)` : null,
    top_airline: topAirline ? `${topAirline[0]} (${topAirline[1]} lotów)` : null,
  });

  // 2. Dane lotnisk
  await supabase.from('airport_stats').upsert(airportData);

  // 3. Linie lotnicze
  const airlineRows = Object.entries(airlineMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => ({
      report_date: reportDate,
      callsign: name,
      airline_name: name,
      flight_count: count,
    }));
  await supabase.from('airline_stats').upsert(airlineRows);

  // 4. Trasy
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
  await supabase.from('route_stats').upsert(routeRows);

  return NextResponse.json({
    success: true,
    date: reportDate,
    totalArrivals: allArrivals.length,
    totalDepartures: allDepartures.length,
    topRoute: topRoute?.[0],
    topAirline: topAirline?.[0],
  });
}