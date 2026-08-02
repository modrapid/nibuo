"use client";

import { useEffect, useState, useCallback } from "react";
import { getDashboardStats } from "@/actions/dashboard.actions";
import { deleteLink } from "@/actions/link.actions";
import { StatsCards } from "@/components/features/dashboard/StatsCards";
import { DashboardLinkRow } from "@/components/features/dashboard/DashboardLinkRow";
import type { DashboardStats } from "@/types/dashboard";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const res = await getDashboardStats();
    if (res.data) setStats(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleDelete = async (id: string) => {
    setStats((prev) =>
      prev ? { ...prev, links: prev.links.filter((l) => l.id !== id) } : prev
    );
    await deleteLink(id);
  };

  if (loading) {
    return <p className="text-center text-slate-400 py-20">Loading dashboard...</p>;
  }

  if (!stats) {
    return <p className="text-center text-slate-400 py-20">No data available.</p>;
  }

  return (
    <main className="min-h-screen py-16 px-4">
      <h1 className="text-3xl font-extrabold text-center text-slate-900 dark:text-white mb-10">
        My Dashboard
      </h1>

      <StatsCards
        totalLinks={stats.totalLinks}
        totalClicks={stats.totalClicks}
        activeLinks={stats.activeLinks}
      />

      <div className="max-w-4xl mx-auto flex flex-col gap-3">
        {stats.links.length === 0 ? (
          <p className="text-center text-slate-400">You haven&apos;t created any links yet.</p>
        ) : (
          stats.links.map((link) => (
            <DashboardLinkRow
              key={link.id}
              link={link}
              domain={process.env.NEXT_PUBLIC_DOMAIN ?? "xbare.top"}
              onDelete={handleDelete}
              onRefresh={fetchStats}
            />
          ))
        )}
      </div>
    </main>
  );
}
