"use server";

import { createClient } from "@/lib/supabase/server";
import { storageService } from "@/lib/storage/storageService";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/getClientIp";
import { revalidatePath } from "next/cache";

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

  // Generate a fresh signed URL valid for 1 hour, since the bucket is private.
  const signedUrl = await storageService.getSignedDownloadUrl(file.stored_name, 3600);

  return { data: { ...file, download_url: signedUrl } };
}

export async function registerFileView(shortCode: string) {
  const supabase = await createClient();
  const { data: file } = await supabase
    .from("files")
    .select("id, views")
    .eq("short_code", shortCode)
    .single();

  if (!file) return;

  await supabase.from("files").update({ views: file.views + 1 }).eq("id", file.id);
}

export async function verifyFilePassword(shortCode: string, password: string) {
  const ip = await getClientIp();
  const { allowed } = checkRateLimit(`file_pw:${ip}:${shortCode}`, { limit: 8, windowMs: 60_000 });
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

export async function registerFileDownload(shortCode: string) {
  const supabase = await createClient();
  const { data: file } = await supabase
    .from("files")
    .select("id, downloads")
    .eq("short_code", shortCode)
    .single();

  if (!file) return { error: "File not found." };

  await supabase.from("files").update({ downloads: file.downloads + 1 }).eq("id", file.id);
  revalidatePath(`/f/${shortCode}`);
  return { success: true };
}
