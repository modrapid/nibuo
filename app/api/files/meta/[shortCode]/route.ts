import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params;
  const supabase = createServiceClient();

  const { data: file, error } = await supabase
    .from("files")
    .select("original_name, mime_type, size_bytes, expires_at, created_at, views, downloads, short_code, password_hash")
    .eq("short_code", shortCode)
    .eq("is_active", true)
    .single();

  if (error || !file) return NextResponse.json({ error: "File not found." }, { status: 404 });

  if (file.expires_at && new Date(file.expires_at) < new Date()) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  return NextResponse.json({
    data: {
      original_name: file.original_name,
      mime_type: file.mime_type,
      size_bytes: file.size_bytes,
      expires_at: file.expires_at,
      created_at: file.created_at,
      views: file.views,
      downloads: file.downloads,
      short_code: file.short_code,
      passwordProtected: !!file.password_hash,
    },
  });
}
