import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { storageService } from "@/lib/storage/storageService";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/getClientIp";

export const runtime = "nodejs";

interface CompleteBody {
  mode: "single" | "multipart";
  storedName: string;
  shortCode: string;
  originalName: string;
  mimeType: string;
  uploadId?: string;
  parts?: { PartNumber: number; ETag: string }[];
  expiresIn?: "1d" | "3d" | "7d" | "14d";
  password?: string;
}

function computeExpiresAt(expiresIn?: CompleteBody["expiresIn"]): string | null {
  if (!expiresIn) return null;
  const days = { "1d": 1, "3d": 3, "7d": 7, "14d": 14 }[expiresIn];
  if (!days) return null;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export async function POST(req: NextRequest) {
  const ip = await getClientIp();
  const { allowed } = checkRateLimit(`upload_complete:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ error: "Too many uploads. Please slow down." }, { status: 429 });
  }

  const body: CompleteBody | null = await req.json().catch(() => null);
  if (
    !body?.storedName ||
    !body?.shortCode ||
    !body?.originalName ||
    !body?.mimeType ||
    (body.mode !== "single" && body.mode !== "multipart")
  ) {
    return NextResponse.json({ error: "Invalid completion request." }, { status: 400 });
  }

  if (body.mode === "multipart") {
    if (!body.uploadId || !body.parts?.length) {
      return NextResponse.json({ error: "Missing multipart completion data." }, { status: 400 });
    }

    const hasValidParts = body.parts.every(
      (p) => typeof p?.PartNumber === "number" && typeof p?.ETag === "string" && p.ETag.length > 0
    );
    if (!hasValidParts) {
      return NextResponse.json({ error: "One or more parts are missing an ETag." }, { status: 400 });
    }

    try {
      await storageService.completeMultipartUpload(body.storedName, body.uploadId, body.parts);
    } catch (err) {
      console.error("Multipart completion error:", err);
      await storageService.abortMultipartUpload(body.storedName, body.uploadId).catch(() => {});

      const code = (err as { Code?: string; name?: string })?.Code || (err as { name?: string })?.name || "";
      if (/NoSuchUpload/i.test(code)) {
        return NextResponse.json(
          { error: "This upload session expired or was already completed/aborted." },
          { status: 410 }
        );
      }
      if (/InvalidPart/i.test(code)) {
        return NextResponse.json(
          { error: "One or more parts don't match what Backblaze B2 received. Please retry the upload." },
          { status: 409 }
        );
      }
      if (/EntityTooSmall/i.test(code)) {
        return NextResponse.json(
          { error: "A part was smaller than the minimum allowed size." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Failed to finalize upload." }, { status: 500 });
    }
  }

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

  const expiresAt = computeExpiresAt(body.expiresIn);

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
    await storageService.delete(body.storedName).catch(() => {});
    return NextResponse.json({ error: "Failed to save file record." }, { status: 500 });
  }

  return NextResponse.json({
    data: { shareUrl: `/f/${fileRecord.short_code}`, fileName: body.originalName },
  });
}
