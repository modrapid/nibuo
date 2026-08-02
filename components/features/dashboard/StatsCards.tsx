import { Link2, MousePointerClick, Zap } from "lucide-react";

interface StatsCardsProps {
  totalLinks: number;
  totalClicks: number;
  activeLinks: number;
}

export function StatsCards({ totalLinks, totalClicks, activeLinks }: StatsCardsProps) {
  const stats = [
    { label: "Total Links", value: totalLinks, icon: Link2 },
    { label: "Total Clicks", value: totalClicks, icon: MousePointerClick },
    { label: "Active Links", value: activeLinks, icon: Zap },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-10">
      {stats.map(({ label, value, icon: Icon }) => (
        <div key={label} className="glass-card rounded-xl2 shadow-soft p-5 flex items-center gap-4">
          <div className="bg-brand/10 text-brand rounded-xl p-3">
            <Icon size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
