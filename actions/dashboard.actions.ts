"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getDashboardStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { data: links, error } = await supabase
    .from("links")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: "Failed to load dashboard data." };

  const totalClicks = (links ?? []).reduce((sum, l) => sum + (l.clicks ?? 0), 0);
  const totalLinks = links?.length ?? 0;
  const activeLinks = (links ?? []).filter(
    (l) => l.is_active && (!l.expires_at || new Date(l.expires_at) > new Date())
  ).length;

  return {
    data: {
      links,
      totalClicks,
      totalLinks,
      activeLinks,
    },
  };
}

export async function updateLinkExpiry(id: string, expiresIn: "1d" | "7d" | "30d" | "never") {
  const supabase = await createClient();

  let expiresAt: string | null = null;
  const now = new Date();
  if (expiresIn === "1d") expiresAt = new Date(now.setDate(now.getDate() + 1)).toISOString();
  if (expiresIn === "7d") expiresAt = new Date(now.setDate(now.getDate() + 7)).toISOString();
  if (expiresIn === "30d") expiresAt = new Date(now.setDate(now.getDate() + 30)).toISOString();

  const { error } = await supabase
    .from("links")
    .update({ expires_at: expiresAt })
    .eq("id", id);

  if (error) return { error: "Failed to update expiry." };
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getLinkClickHistory(linkId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("link_clicks")
    .select("*")
    .eq("link_id", linkId)
    .order("clicked_at", { ascending: false })
    .limit(50);

  if (error) return { error: "Failed to load click history." };
  return { data };
}
