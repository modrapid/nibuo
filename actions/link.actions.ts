"use server";

import { createClient } from "@/lib/supabase/server";
import { generateShortCode, isValidUrl } from "@/lib/utils/shortCode";
import { revalidatePath } from "next/cache";

interface CreateLinkInput {
  originalUrl: string;
  customAlias?: string;
  expiresIn?: "1d" | "7d" | "30d" | "never";
  password?: string;
}

export async function createShortLink(input: CreateLinkInput) {
  if (!isValidUrl(input.originalUrl)) {
    return { error: "Invalid URL provided." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const shortCode = input.customAlias?.trim() || generateShortCode();

  let expiresAt: string | null = null;
  const now = new Date();
  if (input.expiresIn === "1d") expiresAt = new Date(now.setDate(now.getDate() + 1)).toISOString();
  if (input.expiresIn === "7d") expiresAt = new Date(now.setDate(now.getDate() + 7)).toISOString();
  if (input.expiresIn === "30d") expiresAt = new Date(now.setDate(now.getDate() + 30)).toISOString();

  const { data, error } = await supabase
    .from("links")
    .insert({
      user_id: user?.id ?? null,
      short_code: shortCode,
      original_url: input.originalUrl,
      expires_at: expiresAt,
      password_hash: input.password ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "This alias is already taken." };
    }
    return { error: "Failed to create short link." };
  }

  revalidatePath("/");
  return { data };
}

export async function getUserLinks() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [] };

  const { data, error } = await supabase
    .from("links")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: "Failed to fetch links." };
  return { data };
}

export async function deleteLink(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("links").delete().eq("id", id);

  if (error) return { error: "Failed to delete link." };
  revalidatePath("/");
  return { success: true };
}
