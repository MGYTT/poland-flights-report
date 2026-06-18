const BASE_URL = 'https://opensky-network.org/api';

const POLISH_AIRPORTS: Record<string, string> = {
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

function getAuthHeader() {
  const credentials = Buffer.from(
    `${process.env.OPENSKY_USERNAME}:${process.env.OPENSKY_PASSWORD}`
  ).toString('base64');
  return { Authorization: `Basic ${credentials}` };
}

export async function getArrivals(airport: string, begin: number, end: number) {
  try {
    const res = await fetch(
      `${BASE_URL}/flights/arrival?airport=${airport}&begin=${begin}&end=${end}`,
      { headers: getAuthHeader(), next: { revalidate: 0 } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getDepartures(airport: string, begin: number, end: number) {
  try {
    const res = await fetch(
      `${BASE_URL}/flights/departure?airport=${airport}&begin=${begin}&end=${end}`,
      { headers: getAuthHeader(), next: { revalidate: 0 } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export { POLISH_AIRPORTS };