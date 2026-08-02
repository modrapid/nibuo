import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { storageService } from "@/lib/storage/storageService";
import { validateFile, generateSecureFilename } from "@/lib/security/fileValidation";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/getClientIp";
import { generateShortCode } from "@/lib/utils/shortCode";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const ip = await getClientIp();
  const { allowed } = checkRateLimit(`upload:${ip}`, { limit: 10, windowMs: 60_000 });

  if (!allowed) {
    return NextResponse.json({ error: "Too many uploads. Please slow down." }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const expiresIn = formData.get("expiresIn") as string | null;
  const password = formData.get("password") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const validation = validateFile({ type: file.type, size: file.size, name: file.name });
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const secureFileName = generateSecureFilename(file.name);

  try {
    const uploadResult = await storageService.upload(buffer, secureFileName, file.type);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let expiresAt: string | null = null;
    const now = new Date();
    if (expiresIn === "1d") expiresAt = new Date(now.setDate(now.getDate() + 1)).toISOString();
    if (expiresIn === "3d") expiresAt = new Date(now.setDate(now.getDate() + 3)).toISOString();
    if (expiresIn === "7d") expiresAt = new Date(now.setDate(now.getDate() + 7)).toISOString();
    if (expiresIn === "14d") expiresAt = new Date(now.setDate(now.getDate() + 14)).toISOString();

    const shortCode = generateShortCode();

    const { data: fileRecord, error } = await supabase
      .from("files")
      .insert({
        user_id: user?.id ?? null,
        short_code: shortCode,
        original_name: file.name,
        stored_name: secureFileName,
        mime_type: file.type,
        size_bytes: file.size,
        download_url: uploadResult.downloadUrl,
        expires_at: expiresAt,
        password_hash: password ?? null,
      })
      .select()
      .single();

    if (error) {
      await storageService.delete(secureFileName);
      return NextResponse.json({ error: "Failed to save file record." }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        shareUrl: `/f/${shortCode}`,
        fileName: file.name,
        size: file.size,
      },
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
