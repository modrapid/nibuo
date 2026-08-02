"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/adminGuard";

export async function getClicksOverTime(days = 14) {
  await requireAdmin();
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("link_clicks")
    .select("clicked_at")
    .gte("clicked_at", since.toISOString());

  if (error) return { error: "Failed to load click stats." };

  const grouped: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    grouped[key] = 0;
  }

  (data ?? []).forEach((row) => {
    const key = row.clicked_at.slice(0, 10);
    if (grouped[key] !== undefined) grouped[key]++;
  });

  const series = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return { data: series };
}

export async function getSignupsOverTime(days = 14) {
  await requireAdmin();
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("users")
    .select("created_at")
    .gte("created_at", since.toISOString());

  if (error) return { error: "Failed to load signup stats." };

  const grouped: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    grouped[key] = 0;
  }

  (data ?? []).forEach((row) => {
    const key = row.created_at.slice(0, 10);
    if (grouped[key] !== undefined) grouped[key]++;
  });

  const series = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return { data: series };
}
