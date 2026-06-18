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

// IATA kody potrzebne dla AirLabs (używa IATA zamiast ICAO)
export const ICAO_TO_IATA: Record<string, string> = {
  EPWA: 'WAW',
  EPKK: 'KRK',
  EPGD: 'GDN',
  EPWR: 'WRO',
  EPKT: 'KTW',
  EPPO: 'POZ',
  EPRZ: 'RZE',
  EPSC: 'SZZ',
  EPBY: 'BZG',
  EPLB: 'LUZ',
};

async function apiFetch(endpoint: string, params: Record<string, string>) {
  const key = process.env.AIRLABS_API_KEY;
  if (!key) throw new Error('Brak AIRLABS_API_KEY');

  const url = new URL(`${BASE}/${endpoint}`);
  url.searchParams.set('api_key', key);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (!res.ok) {
      console.error(`AirLabs ${endpoint} error: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.response ?? [];
  } catch (e) {
    console.error(`AirLabs fetch error:`, e);
    return [];
  }
}

export async function getArrivals(iataCode: string) {
  return apiFetch('schedules', { arr_iata: iataCode });
}

export async function getDepartures(iataCode: string) {
  return apiFetch('schedules', { dep_iata: iataCode });
}