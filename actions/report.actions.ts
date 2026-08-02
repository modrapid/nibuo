"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitReport(shortCode: string, reason: string, reporterEmail?: string) {
  if (!reason.trim()) return { error: "Please provide a reason." };

  const supabase = await createClient();

  const { data: link } = await supabase
    .from("links")
    .select("id")
    .eq("short_code", shortCode)
    .single();

  if (!link) return { error: "Link not found." };

  const { error } = await supabase.from("reports").insert({
    link_id: link.id,
    reason: reason.trim(),
    reporter_email: reporterEmail?.trim() || null,
  });

  if (error) return { error: "Failed to submit report." };
  return { success: true };
}
