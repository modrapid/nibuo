import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/payments/stripeClient";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const { user_id, plan_id } = session.metadata;

    const supabase = getServiceClient();

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await supabase
      .from("users")
      .update({ plan_id, plan_expires_at: expiresAt.toISOString() })
      .eq("id", user_id);

    await supabase.from("payments").insert({
      user_id,
      plan_id,
      provider: "stripe",
      provider_ref: session.id,
      amount: session.amount_total / 100,
      currency: session.currency,
      status: "completed",
    });
  }

  return NextResponse.json({ received: true });
}
