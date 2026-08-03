"use server";

import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/getClientIp";
import { sanitizeText } from "@/lib/security/sanitize";
import { notifyAdminsOfReport } from "./notification.actions";

export async function submitReport(shortCode: string, reason: string, reporterEmail?: string) {
  const ip = await getClientIp();
  const { allowed } = checkRateLimit(`report:${ip}`, { limit: 5, windowMs: 60_000 });

  if (!allowed) {
    return { error: "Too many reports submitted. Please try again later." };
  }

  const cleanReason = sanitizeText(reason);
  if (!cleanReason) return { error: "Please provide a reason." };

  const supabase = await createClient();

  const { data: link } = await supabase
    .from("links")
    .select("id")
    .eq("short_code", shortCode)
    .single();

  if (!link) return { error: "Link not found." };

  const { error } = await supabase.from("reports").insert({
    link_id: link.id,
    reason: cleanReason,
    reporter_email: reporterEmail ? sanitizeText(reporterEmail) : null,
  });

  if (error) return { error: "Failed to submit report." };

  await notifyAdminsOfReport(shortCode, cleanReason);
  return { success: true };
}
