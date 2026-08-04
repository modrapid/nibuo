import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { storageService } from "@/lib/storage/storageService";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/getClientIp";

export const runtime = "nodejs";

interface CompleteBody {
  storedName: string;
  shortCode: string;
  originalName: string;
  mimeType: string;
  expiresIn?: "1d" | "3d" | "7d" | "14d";
  password?: string;
}

export async function POST(req: NextRequest) {
  const ip = await getClientIp();
  const { allowed } = checkRateLimit(`upload_complete:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ error: "Too many uploads. Please slow down." }, { status: 429 });
  }

  const body: CompleteBody = await req.json().catch(() => null);
  if (!body?.storedName || !body?.shortCode || !body?.originalName || !body?.mimeType) {
    return NextResponse.json({ error: "Invalid completion request." }, { status: 400 });
  }

  // Verify the object actually landed in the bucket — never trust the client blindly.
  const check = await storageService.objectExists(body.storedName);
  if (!check.exists) {
    return NextResponse.json(
      { error: "Upload could not be verified. Please try again." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let expiresAt: string | null = null;
  const now = new Date();
  if (body.expiresIn === "1d") expiresAt = new Date(now.setDate(now.getDate() + 1)).toISOString();
  if (body.expiresIn === "3d") expiresAt = new Date(now.setDate(now.getDate() + 3)).toISOString();
  if (body.expiresIn === "7d") expiresAt = new Date(now.setDate(now.getDate() + 7)).toISOString();
  if (body.expiresIn === "14d") expiresAt = new Date(now.setDate(now.getDate() + 14)).toISOString();

  const { data: fileRecord, error } = await supabase
    .from("files")
    .insert({
      user_id: user?.id ?? null,
      short_code: body.shortCode,
      original_name: body.originalName,
      stored_name: body.storedName,
      mime_type: body.mimeType,
      size_bytes: check.size ?? 0,
      download_url: "",
      expires_at: expiresAt,
      password_hash: body.password ?? null,
    })
    .select()
    .single();

  if (error) {
    await storageService.delete(body.storedName);
    return NextResponse.json({ error: "Failed to save file record." }, { status: 500 });
  }

  return NextResponse.json({
    data: { shareUrl: `/f/${fileRecord.short_code}`, fileName: body.originalName },
  });
}
