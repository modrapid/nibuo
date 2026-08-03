"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { createStripeCheckout, createSslcommerzPayment } from "@/actions/payment.actions";

interface Plan {
  id: string;
  name: string;
  price_usd: number;
  price_bdt: number;
  features: string[];
}

interface PricingSectionProps {
  plans: Plan[];
}

export function PricingSection({ plans }: PricingSectionProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [currency, setCurrency] = useState<"usd" | "bdt">("bdt");

  const handleUpgrade = async (planId: string, isFree: boolean) => {
    if (isFree) return;
    setLoadingPlan(planId);

    const result =
      currency === "usd"
        ? await createStripeCheckout(planId)
        : await createSslcommerzPayment(planId);

    setLoadingPlan(null);

    if (result.error) {
      alert(result.error);
      return;
    }
    if (result.url) window.location.href = result.url;
  };

  return (
    <section className="py-20 px-4 max-w-5xl mx-auto" id="pricing">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Pricing</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Simple, transparent plans that grow with you.
        </p>

        <div className="inline-flex mt-5 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
          <button
            onClick={() => setCurrency("bdt")}
            className={`px-4 py-1.5 text-sm rounded-md transition ${
              currency === "bdt" ? "bg-brand text-white" : "text-slate-500"
            }`}
          >
            ৳ BDT (bKash/Nagad/Rocket)
          </button>
          <button
            onClick={() => setCurrency("usd")}
            className={`px-4 py-1.5 text-sm rounded-md transition ${
              currency === "usd" ? "bg-brand text-white" : "text-slate-500"
            }`}
          >
            $ USD (Card)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isFree = plan.price_usd === 0;
          return (
            <div key={plan.id} className="glass-card rounded-xl2 shadow-soft p-6 flex flex-col">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{plan.name}</h3>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
                {isFree ? "Free" : currency === "usd" ? `$${plan.price_usd}` : `৳${plan.price_bdt}`}
                {!isFree && <span className="text-sm font-normal text-slate-400">/mo</span>}
              </p>

              <ul className="flex flex-col gap-2 mt-5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Check size={16} className="text-brand shrink-0" /> {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id, isFree)}
                disabled={loadingPlan === plan.id}
                className={`rounded-xl px-6 py-2.5 font-semibold transition disabled:opacity-60
                  ${isFree
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-default"
                    : "bg-brand hover:bg-brand-light text-white"}`}
              >
                {isFree ? "Current Plan" : loadingPlan === plan.id ? "Redirecting..." : "Upgrade"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
