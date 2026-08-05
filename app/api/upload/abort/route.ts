import { NextRequest, NextResponse } from "next/server";
import { storageService } from "@/lib/storage/storageService";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.storedName || !body?.uploadId) {
    return NextResponse.json({ error: "Invalid abort request." }, { status: 400 });
  }
  await storageService.abortMultipartUpload(body.storedName, body.uploadId).catch(() => {});
  return NextResponse.json({ data: { aborted: true } });
}
