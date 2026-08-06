import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/getClientIp";

export const runtime = "nodejs";

function sanitizeText(input: string): string {
  return input.replace(/<[^>]*>/g, "").replace(/[<>"'`]/g, "").trim().slice(0, 1000);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params;

  const ip = await getClientIp();
  const { allowed } = checkRateLimit(`report:${ip}:${shortCode}`, { limit: 5, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many reports submitted. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? sanitizeText(body.reason) : "";
  const email = typeof body?.email === "string" ? sanitizeText(body.email) : null;

  if (!reason) {
    return NextResponse.json({ error: "Please provide a reason." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: file } = await supabase
    .from("files")
    .select("id")
    .eq("short_code", shortCode)
    .single();

  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const { error } = await supabase.from("reports").insert({
    file_id: file.id,
    reason,
    reporter_email: email,
  });

  if (error) {
    console.error("Failed to submit report:", error);
    return NextResponse.json({ error: "Failed to submit report." }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true } });
}
