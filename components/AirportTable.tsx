interface Airport {
  airport_icao: string;
  airport_name: string;
  arrivals: number;
  departures: number;
}

export default function AirportTable({ airports }: { airports: Airport[] }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4 text-gray-200">
        🏢 Statystyki lotnisk
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 border-b border-gray-700">
            <th className="text-left pb-2">Lotnisko</th>
            <th className="text-right pb-2">🛬 Przyloty</th>
            <th className="text-right pb-2">🛫 Odloty</th>
          </tr>
        </thead>
        <tbody>
          {airports.map((a) => (
            <tr key={a.airport_icao} className="border-b border-gray-800">
              <td className="py-2">
                <span className="text-blue-400 font-mono">{a.airport_icao}</span>
                <span className="text-gray-400 ml-2 text-xs">{a.airport_name}</span>
              </td>
              <td className="text-right text-green-400 font-bold">{a.arrivals}</td>
              <td className="text-right text-blue-400 font-bold">{a.departures}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}