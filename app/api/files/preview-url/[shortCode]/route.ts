import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { storageService } from "@/lib/storage/storageService";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params;
  const body = await req.json().catch(() => ({}));
  const supabase = createServiceClient();

  const { data: file, error } = await supabase
    .from("files")
    .select("*")
    .eq("short_code", shortCode)
    .eq("is_active", true)
    .single();

  if (error || !file) return NextResponse.json({ error: "File not found." }, { status: 404 });
  if (file.expires_at && new Date(file.expires_at) < new Date()) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }
  if (file.password_hash && file.password_hash !== body.password) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const signedUrl = await storageService.getSignedDownloadUrl(file.stored_name, {
    expiresInSeconds: 3600,
  });

  supabase
    .rpc("increment_file_views", { p_file_id: file.id })
    .then(
      () => {},
      (err) => console.error("Failed to increment view count:", err)
    );

  return NextResponse.json({
    data: {
      url: signedUrl,
      original_name: file.original_name,
      mime_type: file.mime_type,
      size_bytes: file.size_bytes,
      expires_at: file.expires_at,
      created_at: file.created_at,
      views: file.views,
      downloads: file.downloads,
      short_code: file.short_code,
      password_hash: file.password_hash,
    },
  });
}
