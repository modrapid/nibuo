"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/payments/stripeClient";

export async function createStripeCheckout(planId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please log in to upgrade." };

  const { data: plan } = await supabase.from("plans").select("*").eq("id", planId).single();
  if (!plan) return { error: "Plan not found." };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `${plan.name} Plan — xbare.top` },
          unit_amount: Math.round(plan.price_usd * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
    metadata: { user_id: user.id, plan_id: planId },
  });

  return { url: session.url };
}

export async function createSslcommerzPayment(planId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please log in to upgrade." };

  const { data: plan } = await supabase.from("plans").select("*").eq("id", planId).single();
  if (!plan) return { error: "Plan not found." };

  const { data: paymentRecord } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      plan_id: planId,
      provider: "sslcommerz",
      amount: plan.price_bdt,
      currency: "BDT",
      status: "pending",
    })
    .select()
    .single();

  const payload = {
    store_id: process.env.SSLCOMMERZ_STORE_ID!,
    store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD!,
    total_amount: plan.price_bdt,
    currency: "BDT",
    tran_id: paymentRecord.id,
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/sslcommerz/success`,
    fail_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/sslcommerz/fail`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
    cus_name: user.email,
    cus_email: user.email,
    cus_phone: "N/A",
    product_name: `${plan.name} Plan`,
    product_category: "Subscription",
    product_profile: "general",
  };

  const res = await fetch("https://sandbox.sslcommerz.com/gwprocess/v4/api.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(payload as any).toString(),
  });

  const data = await res.json();

  if (data.status !== "SUCCESS") {
    return { error: "Failed to initiate SSLCommerz payment." };
  }

  return { url: data.GatewayPageURL };
}
