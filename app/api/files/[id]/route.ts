import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { storageService } from "@/lib/storage/storageService";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};

  if (typeof body.originalName === "string" && body.originalName.trim()) {
    updates.original_name = body.originalName.trim().slice(0, 255);
  }

  if (body.expiresIn) {
    const now = new Date();
    const map: Record<string, Date> = {
      "1d": new Date(now.setDate(now.getDate() + 1)),
      "3d": new Date(now.setDate(now.getDate() + 3)),
      "7d": new Date(now.setDate(now.getDate() + 7)),
      "14d": new Date(now.setDate(now.getDate() + 14)),
      never: new Date("2099-01-01"),
    };
    if (map[body.expiresIn]) updates.expires_at = map[body.expiresIn].toISOString();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const { error } = await supabase
    .from("files")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Failed to update file." }, { status: 500 });
  return NextResponse.json({ data: { success: true } });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { data: file, error: fetchError } = await supabase
    .from("files")
    .select("stored_name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !file) return NextResponse.json({ error: "File not found." }, { status: 404 });

  const { error: deleteError } = await supabase
    .from("files")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) return NextResponse.json({ error: "Failed to delete file." }, { status: 500 });

  await storageService.delete(file.stored_name).catch((err) =>
    console.error("Failed to delete object from storage:", err)
  );

  return NextResponse.json({ data: { success: true } });
}
