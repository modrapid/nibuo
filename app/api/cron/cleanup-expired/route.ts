import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { storageService } from "@/lib/storage/storageService";

// Uses the service role client since this runs outside a user session (cron context)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const BATCH_SIZE = 100;

export async function GET(req: NextRequest) {
  // Protect the cron endpoint so it can't be triggered by anyone else
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const now = new Date().toISOString();

  const results = {
    filesDeleted: 0,
    linksDeleted: 0,
    storageErrors: [] as string[],
  };

  // ---- Clean up expired FILES ----
  const { data: expiredFiles, error: filesError } = await supabase
    .from("files")
    .select("id, stored_name, short_code")
    .lt("expires_at", now)
    .eq("is_active", true)
    .limit(BATCH_SIZE);

  if (filesError) {
    return NextResponse.json({ error: "Failed to fetch expired files." }, { status: 500 });
  }

  for (const file of expiredFiles ?? []) {
    try {
      await storageService.delete(file.stored_name);
    } catch (err) {
      results.storageErrors.push(`file:${file.short_code}`);
    }

    const { error: deleteError } = await supabase.from("files").delete().eq("id", file.id);
    if (!deleteError) results.filesDeleted++;
  }

  // ---- Clean up expired LINKS (no storage, just DB records) ----
  const { data: expiredLinks, error: linksError } = await supabase
    .from("links")
    .select("id")
    .lt("expires_at", now)
    .eq("is_active", true)
    .limit(BATCH_SIZE);

  if (!linksError && expiredLinks) {
    for (const link of expiredLinks) {
      const { error: deleteError } = await supabase.from("links").delete().eq("id", link.id);
      if (!deleteError) results.linksDeleted++;
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: now,
    ...results,
  });
}
