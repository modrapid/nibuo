"use client";

import { useEffect, useState, useCallback } from "react";
import { getDashboardStats, deleteUserFile } from "@/actions/dashboard.actions";
import { StatsCards } from "@/components/features/dashboard/StatsCards";
import { DashboardFileRow } from "@/components/features/dashboard/DashboardFileRow";
import type { DashboardStats } from "@/types/dashboard";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const res = await getDashboardStats();
    if (res.data) setStats(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleDelete = async (id: string, storedName: string) => {
    setStats((prev) =>
      prev ? { ...prev, files: prev.files.filter((f) => f.id !== id) } : prev
    );
    await deleteUserFile(id, storedName);
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
        totalFiles={stats.totalFiles}
        totalDownloads={stats.totalDownloads}
        totalViews={stats.totalViews}
        activeFiles={stats.activeFiles}
      />

      <div className="max-w-4xl mx-auto flex flex-col gap-3">
        {stats.files.length === 0 ? (
          <p className="text-center text-slate-400">You haven&apos;t uploaded any files yet.</p>
        ) : (
          stats.files.map((file) => (
            <DashboardFileRow
              key={file.id}
              file={file}
              siteUrl={siteUrl}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </main>
  );
}
