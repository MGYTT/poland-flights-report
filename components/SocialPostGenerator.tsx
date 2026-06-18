// components/SocialPostGenerator.tsx
'use client';

import { useState } from 'react';

interface Props {
  report: any;
  topAirport: any;
  date: string;
}

export default function SocialPostGenerator({ report, topAirport, date }: Props) {
  const [copied, setCopied] = useState<number | null>(null);

  const total = report.total_arrivals + report.total_departures;
  const dateFormatted = new Date(date).toLocaleDateString('pl-PL', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const posts = [
    {
      label: '📊 Post dzienny — ogólny',
      emoji: '📊',
      content: `✈️ RAPORT LOTNICZY POLSKA — ${dateFormatted}

🛬 Przyloty do Polski: ${report.total_arrivals}
🛫 Odloty z Polski: ${report.total_departures}
📊 Łączna liczba operacji: ${total}

🗺️ Najczęstsza trasa: ${report.top_route ?? '—'}
🏆 Największy przewoźnik: ${report.top_airline ?? '—'}

📡 Dane: OpenSky Network
#LotnictwoPolska #Avgeek #Aviation #Polska`
    },
    {
      label: '🏢 Post — top lotnisko',
      emoji: '🏢',
      content: `🏢 NAJBARDZIEJ RUCHLIWE LOTNISKO W POLSCE — ${dateFormatted}

🥇 ${topAirport?.airport_name} (${topAirport?.airport_icao})
🛬 Przylotów: ${topAirport?.arrivals}
🛫 Odlotów: ${topAirport?.departures}
📊 Łącznie: ${(topAirport?.arrivals ?? 0) + (topAirport?.departures ?? 0)} operacji

📡 Dane: OpenSky Network
#${topAirport?.airport_icao} #LotnictwoPolska #Airport`
    },
    {
      label: '🔢 Post — liczby dnia',
      emoji: '🔢',
      content: `📈 POLSKA Z POWIETRZA — ${dateFormatted}

Dziś nad Polską:
→ ${report.total_arrivals} samolotów wylądowało 🛬
→ ${report.total_departures} samolotów wystartowało 🛫
→ Monitorowaliśmy ${total} operacji lotniczych

Twój ulubiony lot to...? Napisz w komentarzu! 👇

#Lotnictwo #Polska #AviationDaily #FlightTracker`
    }
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-1">
        📱 Generator postów — Social Media
      </h2>
      <p className="text-gray-400 text-sm mb-5">
        Gotowe posty do skopiowania na Instagram, Facebook, Twitter/X
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {posts.map((post, i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-4 flex flex-col">
            <div className="text-sm font-medium text-gray-300 mb-3">
              {post.label}
            </div>
            <pre className="text-xs text-green-300 whitespace-pre-wrap flex-1 mb-4 font-mono leading-relaxed">
              {post.content}
            </pre>
            <button
              onClick={() => handleCopy(post.content, i)}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                copied === i
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {copied === i ? '✅ Skopiowano!' : '📋 Kopiuj post'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}