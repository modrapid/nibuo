"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/features/auth/AuthCard";
import { signIn } from "@/actions/auth.actions";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    const res = await signIn(email, password);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <AuthCard title="Welcome back" subtitle="Log in to manage your links.">
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
          placeholder="Password"
          className="rounded-lg border border-slate-200 dark:border-slate-700
                     bg-white/70 dark:bg-slate-800/60 px-4 py-2.5 text-sm outline-none
                     focus:ring-2 focus:ring-brand"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-brand hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-brand hover:bg-brand-light text-white font-semibold
                     rounded-xl px-6 py-2.5 transition disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-2">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-brand font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
