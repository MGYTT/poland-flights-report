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

  // Wczorajszy pełny dzień UTC (jedyne co OpenSky udostępnia za darmo)
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setUTCDate(now.getUTCDate() - 1);

  const dayStart = Math.floor(new Date(Date.UTC(
    yesterday.getUTCFullYear(),
    yesterday.getUTCMonth(),
    yesterday.getUTCDate(), 0, 0, 0
  )).getTime() / 1000);
  const dayEnd = dayStart + 86399;

  const reportDate = yesterday.toISOString().split('T')[0];

  console.log(`📊 Zbieranie danych za: ${reportDate}`);

  let allArrivals: any[] = [];
  let allDepartures: any[] = [];
  const airportData: any[] = [];

  for (const [icao, name] of Object.entries(POLISH_AIRPORTS)) {
    console.log(`✈️ Pobieram: ${icao}`);

    const arrivals = await getArrivals(icao, dayStart, dayEnd);
    await new Promise(r => setTimeout(r, 1500));
    const departures = await getDepartures(icao, dayStart, dayEnd);
    await new Promise(r => setTimeout(r, 1500));

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

  // Trasy
  const routeMap: Record<string, number> = {};
  for (const flight of allArrivals) {
    if (flight.estDepartureAirport && flight.estArrivalAirport) {
      const route = `${flight.estDepartureAirport}→${flight.estArrivalAirport}`;
      routeMap[route] = (routeMap[route] || 0) + 1;
    }
  }
  const topRoute = Object.entries(routeMap).sort((a, b) => b[1] - a[1])[0];

  // Linie lotnicze
  const airlineMap: Record<string, number> = {};
  for (const flight of [...allArrivals, ...allDepartures]) {
    if (flight.callsign) {
      const name = getAirlineName(flight.callsign);
      airlineMap[name] = (airlineMap[name] || 0) + 1;
    }
  }
  const topAirline = Object.entries(airlineMap).sort((a, b) => b[1] - a[1])[0];

  // Zapis do Supabase
  await supabase.from('daily_reports').upsert({
    report_date: reportDate,
    total_arrivals: allArrivals.length,
    total_departures: allDepartures.length,
    top_route: topRoute ? `${topRoute[0]} (${topRoute[1]}x)` : null,
    top_airline: topAirline ? `${topAirline[0]} (${topAirline[1]} lotów)` : null,
  });

  await supabase.from('airport_stats').upsert(airportData);

  const airlineRows = Object.entries(airlineMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 20)
    .map(([name, count]) => ({
      report_date: reportDate,
      callsign: name,
      airline_name: name,
      flight_count: count,
    }));
  await supabase.from('airline_stats').upsert(airlineRows);

  const routeRows = Object.entries(routeMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 30)
    .map(([route, count]) => {
      const [origin, destination] = route.split('→');
      return { report_date: reportDate, origin, destination, flight_count: count };
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