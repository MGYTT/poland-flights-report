interface Route {
  origin: string;
  destination: string;
  flight_count: number;
}

export default function RouteTable({ routes }: { routes: Route[] }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4 text-gray-200">
        🗺️ Top 10 najczęstszych tras
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 border-b border-gray-700">
            <th className="text-left pb-2">#</th>
            <th className="text-left pb-2">Skąd</th>
            <th className="text-left pb-2">→ Dokąd</th>
            <th className="text-right pb-2">Loty</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((r, i) => (
            <tr key={`${r.origin}-${r.destination}`} className="border-b border-gray-800">
              <td className="py-2 text-gray-500">{i + 1}</td>
              <td className="py-2 font-mono text-blue-400">{r.origin}</td>
              <td className="py-2 font-mono text-green-400">{r.destination}</td>
              <td className="text-right text-purple-400 font-bold">
                {r.flight_count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}