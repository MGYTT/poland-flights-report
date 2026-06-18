// lib/airlabs.ts
const BASE = 'https://airlabs.co/api/v9';

export const POLISH_AIRPORTS: Record<string, string> = {
  EPWA: 'Warszawa Chopin',
  EPKK: 'Kraków Balice',
  EPGD: 'Gdańsk Lech Wałęsa',
  EPWR: 'Wrocław Copernicus',
  EPKT: 'Katowice Pyrzowice',
  EPPO: 'Poznań Ławica',
  EPRZ: 'Rzeszów Jasionka',
  EPSC: 'Szczecin Goleniów',
  EPBY: 'Bydgoszcz Szwederowo',
  EPLB: 'Lublin',
};

export const ICAO_TO_IATA: Record<string, string> = {
  EPWA: 'WAW', EPKK: 'KRK', EPGD: 'GDN', EPWR: 'WRO',
  EPKT: 'KTW', EPPO: 'POZ', EPRZ: 'RZE', EPSC: 'SZZ',
  EPBY: 'BZG', EPLB: 'LUZ',
};

async function apiFetch(endpoint: string, params: Record<string, string>) {
  const key = process.env.AIRLABS_API_KEY;
  if (!key) throw new Error('Brak AIRLABS_API_KEY');
  const url = new URL(`${BASE}/${endpoint}`);
  url.searchParams.set('api_key', key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  try {
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) { console.error(`AirLabs ${endpoint} ${res.status}`); return []; }
    const data = await res.json();
    return data.response ?? [];
  } catch (e) {
    console.error(`AirLabs error:`, e);
    return [];
  }
}

// Przyloty do lotniska (scheduled + landed dziś)
export async function getArrivals(iataCode: string) {
  return apiFetch('schedules', {
    arr_iata: iataCode,
    limit: '1000',
  });
}

// Odloty z lotniska
export async function getDepartures(iataCode: string) {
  return apiFetch('schedules', {
    dep_iata: iataCode,
    limit: '1000',
  });
}

// Wszystkie samoloty aktualnie nad Polską (bbox)
export async function getFlightsOverPoland() {
  return apiFetch('flights', {
    // Polska bbox
    _fields: 'hex,reg_number,flag,lat,lng,alt,speed,flight_iata,flight_icao,dep_iata,arr_iata,airline_iata,aircraft_icao,status',
  });
}