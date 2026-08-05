import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { storageService } from "@/lib/storage/storageService";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/getClientIp";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params;

  const ip = await getClientIp();

  const { allowed } = checkRateLimit(
    `download_url:${ip}:${shortCode}`,
    {
      limit: 20,
      windowMs: 60_000,
    }
  );

  if (!allowed) {
    return NextResponse.json(
      {
        error: "Too many attempts. Please try again shortly.",
      },
      {
        status: 429,
      }
    );
  }

  const body = await req.json().catch(() => ({}));

  const supabase = createServiceClient();

  const { data: file, error } = await supabase
    .from("files")
    .select("*")
    .eq("short_code", shortCode)
    .eq("is_active", true)
    .single();

  if (error || !file) {
    return NextResponse.json(
      {
        error: "File not found.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    file.expires_at &&
    new Date(file.expires_at) < new Date()
  ) {
    return NextResponse.json(
      {
        error: "This file is no longer available.",
      },
      {
        status: 410,
      }
    );
  }

  if (
    file.password_hash &&
    file.password_hash !== body.password
  ) {
    return NextResponse.json(
      {
        error: "Incorrect password.",
      },
      {
        status: 401,
      }
    );
  }

  const signedUrl =
    await storageService.getSignedDownloadUrl(
      file.stored_name,
      {
        expiresInSeconds: 300,
        forceDownloadFilename: file.original_name,
        contentType: file.mime_type,
      }
    );

  supabase
    .rpc("increment_file_downloads", {
      p_file_id: file.id,
    })
    .then(
      () => {},
      (err) =>
        console.error(
          "Failed to increment download count:",
          err
        )
    );

  return NextResponse.json({
    data: {
      url: signedUrl,
    },
  });
}
