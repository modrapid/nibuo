import { NextRequest, NextResponse } from "next/server";
import { storageService } from "@/lib/storage/storageService";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/getClientIp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = await getClientIp();

  const { allowed } = checkRateLimit(`upload_part:${ip}`, {
    limit: 300,
    windowMs: 60_000,
  });

  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);

  if (
    !body?.storedName ||
    typeof body.storedName !== "string" ||
    !body?.uploadId ||
    typeof body.uploadId !== "string" ||
    typeof body.partNumber !== "number" ||
    !Number.isInteger(body.partNumber) ||
    body.partNumber < 1 ||
    body.partNumber > 10_000
  ) {
    return NextResponse.json({ error: "Invalid part signing request." }, { status: 400 });
  }

  try {
    const url = await storageService.getSignedPartUrl(body.storedName, body.uploadId, body.partNumber);

    return NextResponse.json({
      data: { url },
    });
  } catch (err) {
    console.error("Part signing error:", err);
    return NextResponse.json({ error: "Failed to sign upload part." }, { status: 500 });
  }
}
