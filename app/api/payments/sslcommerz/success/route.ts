import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const tranId = formData.get("tran_id") as string;
  const status = formData.get("status") as string;

  const supabase = getServiceClient();

  if (status !== "VALID") {
    await supabase.from("payments").update({ status: "failed" }).eq("id", tranId);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/pricing?error=payment_failed`);
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("id", tranId)
    .single();

  if (payment) {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await supabase
      .from("users")
      .update({ plan_id: payment.plan_id, plan_expires_at: expiresAt.toISOString() })
      .eq("id", payment.user_id);

    await supabase.from("payments").update({ status: "completed" }).eq("id", tranId);
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?upgraded=true`);
}
