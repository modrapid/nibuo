"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/adminGuard";
import { revalidatePath } from "next/cache";

export async function getAdminOverview() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ count: totalUsers }, { count: totalLinks }, { count: pendingReports }] =
    await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("links").select("*", { count: "exact", head: true }),
      supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);

  const { data: recentLinks } = await supabase
    .from("links")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    data: {
      totalUsers: totalUsers ?? 0,
      totalLinks: totalLinks ?? 0,
      pendingReports: pendingReports ?? 0,
      recentLinks: recentLinks ?? [],
    },
  };
}

export async function getAllUsers(page = 1, pageSize = 20, search = "") {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase.from("users").select("*", { count: "exact" });
  if (search) query = query.ilike("email", `%${search}%`);

  const from = (page - 1) * pageSize;
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) return { error: "Failed to fetch users." };
  return { data, count: count ?? 0 };
}

export async function banUser(userId: string, banned: boolean) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("users").update({ is_banned: banned }).eq("id", userId);
  if (error) return { error: "Failed to update user." };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUserAdmin(userId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("users").delete().eq("id", userId);
  if (error) return { error: "Failed to delete user." };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function getAllLinksAdmin(page = 1, pageSize = 20, search = "") {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase.from("links").select("*", { count: "exact" });
  if (search) query = query.ilike("short_code", `%${search}%`);

  const from = (page - 1) * pageSize;
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) return { error: "Failed to fetch links." };
  return { data, count: count ?? 0 };
}

export async function deleteLinkAdmin(linkId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("links").delete().eq("id", linkId);
  if (error) return { error: "Failed to delete link." };

  revalidatePath("/admin/links");
  return { success: true };
}

export async function getReports(status?: string) {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase.from("reports").select("*, links(short_code, original_url)");
  if (status) query = query.eq("status", status);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return { error: "Failed to fetch reports." };
  return { data };
}

export async function resolveReport(reportId: string, action: "resolved" | "reviewed") {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("reports").update({ status: action }).eq("id", reportId);
  if (error) return { error: "Failed to update report." };

  revalidatePath("/admin/reports");
  return { success: true };
}

export async function updateSiteSettings(settings: Record<string, string>) {
  await requireAdmin();
  const supabase = await createClient();

  const updates = Object.entries(settings).map(([key, value]) => ({ key, value }));
  const { error } = await supabase.from("settings").upsert(updates);

  if (error) return { error: "Failed to update settings." };
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function getSiteSettings() {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("*");

  const settings: Record<string, string> = {};
  (data ?? []).forEach((s) => (settings[s.key] = s.value));
  return settings;
}
