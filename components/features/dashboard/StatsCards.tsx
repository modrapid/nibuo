import { FileText, DownloadCloud, Eye, Zap } from "lucide-react";

interface StatsCardsProps {
  totalFiles: number;
  totalDownloads: number;
  totalViews: number;
  activeFiles: number;
}

export function StatsCards({ totalFiles, totalDownloads, totalViews, activeFiles }: StatsCardsProps) {
  const stats = [
    { label: "Total Files", value: totalFiles, icon: FileText },
    { label: "Total Downloads", value: totalDownloads, icon: DownloadCloud },
    { label: "Total Views", value: totalViews, icon: Eye },
    { label: "Active Files", value: activeFiles, icon: Zap },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-10">
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
