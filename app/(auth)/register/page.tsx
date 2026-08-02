"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/features/auth/AuthCard";
import { signUp } from "@/actions/auth.actions";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    const res = await signUp(email, password);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <AuthCard title="Check your email" subtitle="We've sent you a verification link.">
        <p className="text-sm text-center text-slate-500 dark:text-slate-400">
          Click the link in the email to activate your account.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create an account" subtitle="Start shortening links in seconds.">
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
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 8 characters)"
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
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-2">
          Already have an account?{" "}
          <Link href="/login" className="text-brand font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
