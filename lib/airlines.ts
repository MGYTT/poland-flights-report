// Mapa prefixów callsign → nazwa linii lotniczej
export const AIRLINE_CODES: Record<string, string> = {
  LOT: 'LOT Polish Airlines',
  RYR: 'Ryanair',
  WZZ: 'Wizz Air',
  EZY: 'easyJet',
  LFT: 'Lufthansa',
  DLH: 'Lufthansa',
  BAW: 'British Airways',
  AFR: 'Air France',
  KLM: 'KLM',
  UAE: 'Emirates',
  QTR: 'Qatar Airways',
  THY: 'Turkish Airlines',
  SAS: 'Scandinavian Airlines',
  IBE: 'Iberia',
  AUA: 'Austrian Airlines',
  BEL: 'Brussels Airlines',
  TAP: 'TAP Air Portugal',
  AZA: 'Alitalia/ITA Airways',
  CFG: 'Condor',
  TUI: 'TUI fly',
  ENT: 'Enter Air',
  SPR: 'Small Planet Airlines',
};

export function getAirlineName(callsign: string): string {
  if (!callsign) return 'Nieznana';
  const prefix = callsign.replace(/[0-9]/g, '').trim().toUpperCase();
  return AIRLINE_CODES[prefix] || callsign.trim();
}