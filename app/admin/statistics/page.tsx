"use client";

import { useEffect, useState } from "react";
import { getClicksOverTime, getSignupsOverTime } from "@/actions/statistics.actions";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminStatisticsPage() {
  const [clickData, setClickData] = useState<{ date: string; count: number }[]>([]);
  const [signupData, setSignupData] = useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getClicksOverTime(14), getSignupsOverTime(14)]).then(([clicks, signups]) => {
      if (clicks.data) setClickData(clicks.data);
      if (signups.data) setSignupData(signups.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-slate-400">Loading statistics...</p>;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
        Statistics
      </h1>

      <div className="glass-card rounded-xl2 shadow-soft p-6 mb-8">
        <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4">
          Clicks (Last 14 Days)
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={clickData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#0F172A" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card rounded-xl2 shadow-soft p-6">
        <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4">
          New Signups (Last 14 Days)
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={signupData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
