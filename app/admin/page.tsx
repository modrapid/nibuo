import { getAdminOverview } from "@/actions/admin.actions";
import { Users, Link2, Flag } from "lucide-react";

export default async function AdminOverviewPage() {
  const { data } = await getAdminOverview();

  const cards = [
    { label: "Total Users", value: data?.totalUsers ?? 0, icon: Users },
    { label: "Total Links", value: data?.totalLinks ?? 0, icon: Link2 },
    { label: "Pending Reports", value: data?.pendingReports ?? 0, icon: Flag },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-8">
        Overview
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {cards.map(({ label, value, icon: Icon }) => (
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

      <h2 className="font-bold text-slate-900 dark:text-white mb-4">Recent Links</h2>
      <div className="flex flex-col gap-2">
        {data?.recentLinks.map((link: any) => (
          <div
            key={link.id}
            className="glass-card rounded-xl px-4 py-3 flex items-center justify-between text-sm"
          >
            <span className="font-medium text-slate-800 dark:text-slate-100">
              /{link.short_code}
            </span>
            <span className="text-slate-400 truncate max-w-[300px]">{link.original_url}</span>
            <span className="text-slate-500">{link.clicks} clicks</span>
          </div>
        ))}
      </div>
    </div>
  );
}
