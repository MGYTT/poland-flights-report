import { NextResponse } from 'next/server';
import {
  getArrivals,
  getDepartures,
  POLISH_AIRPORTS,
  ICAO_TO_IATA,
} from '@/lib/airlabs';
import { createServiceClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const reportDate = new Date().toISOString().split('T')[0];

  console.log(`📊 Start zbierania: ${reportDate}`);

  let allArrivals: any[] = [];
  let allDepartures: any[] = [];
  const airportData: any[] = [];

  for (const [icao, name] of Object.entries(POLISH_AIRPORTS)) {
    const iata = ICAO_TO_IATA[icao];
    if (!iata) continue;

    console.log(`✈️  ${icao} (${iata}) — ${name}`);

    const arrivals = await getArrivals(iata);
    await new Promise(r => setTimeout(r, 1000));
    const departures = await getDepartures(iata);
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

    console.log(`   ✅ ${arrivals.length} przylotów | ${departures.length} odlotów`);
  }

  // === TRASY ===
  const routeMap: Record<string, number> = {};
  for (const f of allArrivals) {
    const origin = f.dep_iata;
    const dest = f.arr_iata;
    if (origin && dest) {
      const route = `${origin}→${dest}`;
      routeMap[route] = (routeMap[route] || 0) + 1;
    }
  }
  const topRoute = Object.entries(routeMap).sort((a, b) => b[1] - a[1])[0];

  // === LINIE LOTNICZE ===
  const airlineMap: Record<string, number> = {};
  for (const f of [...allArrivals, ...allDepartures]) {
    // AirLabs zwraca airline_iata i airline_name bezpośrednio!
    const airline = f.airline_name || f.airline_iata || f.airline_icao;
    if (airline && airline.trim() !== '') {
      airlineMap[airline] = (airlineMap[airline] || 0) + 1;
    }
  }
  const topAirline = Object.entries(airlineMap).sort((a, b) => b[1] - a[1])[0];

  // === MODELE SAMOLOTÓW ===
  const aircraftMap: Record<string, number> = {};
  for (const f of [...allArrivals, ...allDepartures]) {
    const model = f.aircraft_icao || f.aircraft_iata;
    if (model && model.trim() !== '') {
      aircraftMap[model] = (aircraftMap[model] || 0) + 1;
    }
  }
  const topAircraft = Object.entries(aircraftMap).sort((a, b) => b[1] - a[1])[0];

  // === ZAPIS DO SUPABASE ===
  await supabase.from('daily_reports').upsert({
    report_date: reportDate,
    total_arrivals: allArrivals.length,
    total_departures: allDepartures.length,
    top_route: topRoute ? `${topRoute[0]} (${topRoute[1]}x)` : null,
    top_airline: topAirline ? `${topAirline[0]} (${topAirline[1]} lotów)` : null,
    top_aircraft_model: topAircraft ? `${topAircraft[0]} (${topAircraft[1]}x)` : null,
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
  if (airlineRows.length > 0) {
    await supabase.from('airline_stats').upsert(airlineRows);
  }

  const routeRows = Object.entries(routeMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 30)
    .map(([route, count]) => {
      const [origin, destination] = route.split('→');
      return { report_date: reportDate, origin, destination, flight_count: count };
    });
  if (routeRows.length > 0) {
    await supabase.from('route_stats').upsert(routeRows);
  }

  return NextResponse.json({
    success: true,
    date: reportDate,
    totalArrivals: allArrivals.length,
    totalDepartures: allDepartures.length,
    topRoute: topRoute?.[0] ?? null,
    topAirline: topAirline?.[0] ?? null,
    topAircraft: topAircraft?.[0] ?? null,
    airports: airportData,
  });
}