import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { storageService } from "@/lib/storage/storageService";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/getClientIp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params;

  const ip = await getClientIp();
  const { allowed } = checkRateLimit(`download:${ip}:${shortCode}`, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many download attempts. Please try again shortly." },
      { status: 429 }
    );
  }

  let password: string | undefined;
  try {
    const body = await req.json();
    password = body?.password;
  } catch {
    password = undefined;
  }

  const supabase = createServiceClient();

  const { data: file, error } = await supabase
    .from("files")
    .select("*")
    .eq("short_code", shortCode)
    .eq("is_active", true)
    .single();

  if (error || !file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  if (file.expires_at && new Date(file.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This file is no longer available." },
      { status: 410 }
    );
  }

  if (file.password_hash && file.password_hash !== password) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  let stream: ReadableStream<Uint8Array>;
  let contentType: string;

  try {
    const objectResult = await storageService.getObjectStream(file.stored_name);
    stream = objectResult.body;
    contentType = objectResult.contentType || file.mime_type || "application/octet-stream";
  } catch (err) {
    console.error("Download stream error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve the file from storage." },
      { status: 502 }
    );
  }

  // Fire-and-forget the counter increment so it doesn't delay the download response.
  supabase.rpc("increment_file_downloads", { p_file_id: file.id }).then(
    () => {},
    (err) => console.error("Failed to increment download count:", err)
  );

  const safeFilename = file.original_name.replace(/["\\]/g, "");

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(
        file.original_name
      )}`,
      "Content-Length": file.size_bytes.toString(),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
