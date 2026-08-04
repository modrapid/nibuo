"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { storageService } from "@/lib/storage/storageService";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/getClientIp";

export async function getFileByShortCode(shortCode: string) {
  const supabase = await createClient();

  const { data: file, error } = await supabase
    .from("files")
    .select("*")
    .eq("short_code", shortCode)
    .eq("is_active", true)
    .single();

  if (error || !file) return { error: "File not found." };

  const isExpired = file.expires_at && new Date(file.expires_at) < new Date();
  if (isExpired) return { error: "expired" };

  // Signed, time-limited URL — used for preview only (<img>/<video>/<iframe>).
  const previewUrl = await storageService.getSignedDownloadUrl(file.stored_name, 3600);

  return { data: { ...file, download_url: previewUrl } };
}

export async function registerFileView(shortCode: string) {
  const supabase = createServiceClient();

  const { data: file } = await supabase
    .from("files")
    .select("id")
    .eq("short_code", shortCode)
    .single();

  if (!file) return;

  const { error } = await supabase.rpc("increment_file_views", { p_file_id: file.id });
  if (error) console.error("Failed to increment view count:", error);
}

export async function verifyFilePassword(shortCode: string, password: string) {
  const ip = await getClientIp();
  const { allowed } = checkRateLimit(`file_pw:${ip}:${shortCode}`, {
    limit: 8,
    windowMs: 60_000,
  });
  if (!allowed) return { error: "Too many attempts. Try again shortly." };

  const supabase = await createClient();
  const { data: file } = await supabase
    .from("files")
    .select("password_hash")
    .eq("short_code", shortCode)
    .single();

  if (!file) return { error: "File not found." };
  if (file.password_hash !== password) return { error: "Incorrect password." };

  return { success: true };
}
