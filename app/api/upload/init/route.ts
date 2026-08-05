import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { storageService } from "@/lib/storage/storageService";
import { validateFile, generateSecureFilename } from "@/lib/security/fileValidation";
import { generateShortCode } from "@/lib/utils/shortCode";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/getClientIp";
import { getPlanLimits } from "@/lib/plans/getPlanLimits";

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

  const validation = validateFile({ type: body.mimeType, size: body.size, name: body.fileName });
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const planLimits = await getPlanLimits(user?.id ?? null);
  if (body.size > planLimits.maxFileSizeBytes) {
    return NextResponse.json(
      { error: `File exceeds your plan's ${planLimits.maxFileSizeLabel} limit.` },
      { status: 413 }
    );
  }

  const storedName = generateSecureFilename(body.fileName);
  const shortCode = generateShortCode();
  const { usesMultipart, partSize, partCount } = storageService.getPartPlan(body.size);

  if (!usesMultipart) {
    const uploadUrl = await storageService.getSignedUploadUrl(storedName, body.mimeType, 900);
    return NextResponse.json({
      data: { mode: "single", uploadUrl, storedName, shortCode },
    });
  }

  const { uploadId } = await storageService.initMultipartUpload(storedName, body.mimeType, body.size);
  return NextResponse.json({
    data: { mode: "multipart", uploadId, storedName, shortCode, partSize, partCount },
  });
}
