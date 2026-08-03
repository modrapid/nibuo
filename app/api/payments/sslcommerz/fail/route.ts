import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const tranId = formData.get("tran_id") as string;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from("payments").update({ status: "failed" }).eq("id", tranId);

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/pricing?error=payment_failed`);
}
