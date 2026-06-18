// lib/opensky.ts
const BASE_URL = 'https://opensky-network.org/api';
const TOKEN_URL = 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';

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

// Cache tokenu w pamięci (działa w obrębie jednego wywołania serverless)
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 30000) {
    return cachedToken;
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.OPENSKY_CLIENT_ID!,
      client_secret: process.env.OPENSKY_CLIENT_SECRET!,
    }),
  });

  if (!res.ok) {
    throw new Error(`Token error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;
  return cachedToken!;
}

async function authHeaders() {
  const token = await getToken();
  return { Authorization: `Bearer ${token}` };
}

export async function getArrivals(airport: string, begin: number, end: number) {
  try {
    const headers = await authHeaders();
    const res = await fetch(
      `${BASE_URL}/flights/arrival?airport=${airport}&begin=${begin}&end=${end}`,
      { headers, next: { revalidate: 0 } }
    );
    if (res.status === 404) return []; // brak lotów — normalne
    if (!res.ok) {
      console.error(`Arrivals ${airport}: ${res.status}`);
      return [];
    }
    return await res.json();
  } catch (e) {
    console.error(`Arrivals error ${airport}:`, e);
    return [];
  }
}

export async function getDepartures(airport: string, begin: number, end: number) {
  try {
    const headers = await authHeaders();
    const res = await fetch(
      `${BASE_URL}/flights/departure?airport=${airport}&begin=${begin}&end=${end}`,
      { headers, next: { revalidate: 0 } }
    );
    if (res.status === 404) return [];
    if (!res.ok) {
      console.error(`Departures ${airport}: ${res.status}`);
      return [];
    }
    return await res.json();
  } catch (e) {
    console.error(`Departures error ${airport}:`, e);
    return [];
  }
}