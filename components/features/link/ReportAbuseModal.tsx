"use client";

import { useState } from "react";
import { X, Flag } from "lucide-react";

interface ReportAbuseModalProps {
  shortCode: string;
  onClose: () => void;
}

export function ReportAbuseModal({ shortCode, onClose }: ReportAbuseModalProps) {
  const [reason, setReason] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Please describe the issue.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/files/report/${shortCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to submit report.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="glass-card rounded-xl2 shadow-soft p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Flag size={18} /> Report Abuse
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <p className="text-sm text-center text-slate-500 dark:text-slate-400 py-4">
            Thank you. Our team will review this file shortly.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the issue (spam, copyright, illegal content...)"
              rows={4}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700
                         bg-white/70 dark:bg-slate-800/60 px-3 py-2 text-sm outline-none
                         focus:ring-2 focus:ring-brand resize-none"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email (optional)"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700
                         bg-white/70 dark:bg-slate-800/60 px-3 py-2 text-sm outline-none
                         focus:ring-2 focus:ring-brand"
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading || !reason.trim()}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold
                         rounded-xl px-6 py-2.5 transition disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
