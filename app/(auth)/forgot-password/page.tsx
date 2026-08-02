"use client";

import { useState } from "react";
import { AuthCard } from "@/components/features/auth/AuthCard";
import { requestPasswordReset } from "@/actions/auth.actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    const res = await requestPasswordReset(email);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthCard title="Check your email" subtitle="We've sent a password reset link.">
        <p className="text-sm text-center text-slate-500 dark:text-slate-400">
          Follow the link in your inbox to reset your password.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset your password" subtitle="Enter your email to receive a reset link.">
      <div className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="rounded-lg border border-slate-200 dark:border-slate-700
                     bg-white/70 dark:bg-slate-800/60 px-4 py-2.5 text-sm outline-none
                     focus:ring-2 focus:ring-brand"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-brand hover:bg-brand-light text-white font-semibold
                     rounded-xl px-6 py-2.5 transition disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </div>
    </AuthCard>
  );
}
