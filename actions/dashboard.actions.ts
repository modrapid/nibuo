"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { data: files, error } = await supabase
    .from("files")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: "Failed to load dashboard data." };

  const totalDownloads = (files ?? []).reduce((sum, f) => sum + (f.downloads ?? 0), 0);
  const totalViews = (files ?? []).reduce((sum, f) => sum + (f.views ?? 0), 0);
  const totalStorageBytes = (files ?? []).reduce((sum, f) => sum + (f.size_bytes ?? 0), 0);
  const totalFiles = files?.length ?? 0;
  const activeFiles = (files ?? []).filter(
    (f) => f.is_active && (!f.expires_at || new Date(f.expires_at) > new Date())
  ).length;

  return {
    data: { files: files ?? [], totalFiles, totalDownloads, totalViews, activeFiles, totalStorageBytes },
  };
}
