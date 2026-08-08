"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

interface PasswordGateProps {
  shortCode: string;
  onUnlocked: (token: string) => void;
}

export function PasswordGate({ shortCode, onUnlocked }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;
      const res = await fetch(`${cdnUrl}/auth/${shortCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setError("Incorrect password.");
        setLoading(false);
        return;
      }
      if (!res.ok || !data.token) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      onUnlocked(data.token);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card rounded-xl2 shadow-soft p-8 w-full max-w-sm text-center">
        <div className="bg-brand/10 text-brand rounded-full p-4 inline-flex mb-4">
          <Lock size={24} />
        </div>
        <h1 className="font-bold text-slate-900 dark:text-white mb-1">Password Protected</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Enter the password to access this file.
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Password"
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700
                     bg-white/70 dark:bg-slate-800/60 px-4 py-2.5 text-sm outline-none
                     focus:ring-2 focus:ring-brand mb-3"
        />

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-brand hover:bg-brand-light text-white font-semibold
                     rounded-xl px-6 py-2.5 transition disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Unlock File"}
        </button>
      </div>
    </main>
  );
}
