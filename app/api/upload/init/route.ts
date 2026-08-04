import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { storageService } from "@/lib/storage/storageService";
import { validateFile, generateSecureFilename } from "@/lib/security/fileValidation";
import { generateShortCode } from "@/lib/utils/shortCode";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/getClientIp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = await getClientIp();
  const { allowed } = checkRateLimit(`upload_init:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ error: "Too many uploads. Please slow down." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.fileName || !body?.mimeType || typeof body?.size !== "number") {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const validation = validateFile({
    type: body.mimeType,
    size: body.size,
    name: body.fileName,
  });
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const storedName = generateSecureFilename(body.fileName);
  const shortCode = generateShortCode();

  const uploadUrl = await storageService.getSignedUploadUrl(storedName, body.mimeType, 600);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return NextResponse.json({
    data: {
      uploadUrl,
      storedName,
      shortCode,
      userId: user?.id ?? null,
    },
  });
}
