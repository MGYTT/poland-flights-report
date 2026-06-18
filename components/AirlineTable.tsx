interface Airline {
  airline_name: string;
  flight_count: number;
}

export default function AirlineTable({ airlines }: { airlines: Airline[] }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4 text-gray-200">
        🏆 Top 10 linii lotniczych
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 border-b border-gray-700">
            <th className="text-left pb-2">#</th>
            <th className="text-left pb-2">Linia</th>
            <th className="text-right pb-2">Loty</th>
          </tr>
        </thead>
        <tbody>
          {airlines.map((a, i) => (
            <tr key={a.airline_name} className="border-b border-gray-800">
              <td className="py-2 text-gray-500">{i + 1}</td>
              <td className="py-2 text-white">{a.airline_name}</td>
              <td className="text-right text-yellow-400 font-bold">
                {a.flight_count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}