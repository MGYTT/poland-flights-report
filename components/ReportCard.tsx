// components/ReportCard.tsx
interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: 'green' | 'blue' | 'purple' | 'yellow';
}

const styles = {
  green: { border: 'border-green-500/40', bg: 'bg-green-950/30', text: 'text-green-400' },
  blue: { border: 'border-blue-500/40', bg: 'bg-blue-950/30', text: 'text-blue-400' },
  purple: { border: 'border-purple-500/40', bg: 'bg-purple-950/30', text: 'text-purple-400' },
  yellow: { border: 'border-yellow-500/40', bg: 'bg-yellow-950/30', text: 'text-yellow-400' },
};

export default function ReportCard({ title, value, subtitle, icon, color }: Props) {
  const s = styles[color];
  return (
    <div className={`border rounded-xl p-5 ${s.border} ${s.bg}`}>
      <div className="text-3xl mb-3">{icon}</div>
      <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">{title}</div>
      <div className={`text-3xl font-bold ${s.text}`}>{value}</div>
      {subtitle && <div className="text-gray-500 text-xs mt-1">{subtitle}</div>}
    </div>
  );
}