"use client";

import { useState } from "react";
import { Flag, ExternalLink } from "lucide-react";
import { ReportAbuseModal } from "./ReportAbuseModal";

interface LinkPreviewClientProps {
  link: {
    short_code: string;
    original_url: string;
    clicks: number;
    created_at: string;
    password_hash: string | null;
  };
}

export function LinkPreviewClient({ link }: LinkPreviewClientProps) {
  const [showReport, setShowReport] = useState(false);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card rounded-xl2 shadow-soft p-8 w-full max-w-md text-center">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          This link redirects to:
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate mb-6">
          {link.original_url}
        </p>

        <a
          href={link.original_url}
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-light
                     text-white font-semibold rounded-xl px-6 py-2.5 transition"
        >
          Continue <ExternalLink size={16} />
        </a>

        <div className="flex justify-center gap-6 mt-6 text-xs text-slate-400">
          <span>{link.clicks} clicks</span>
          <span>{new Date(link.created_at).toLocaleDateString()}</span>
        </div>

        <button
          onClick={() => setShowReport(true)}
          className="flex items-center gap-1 justify-center mx-auto mt-6 text-xs
                     text-slate-400 hover:text-red-500 transition"
        >
          <Flag size={14} /> Report Abuse
        </button>
      </div>

      {showReport && (
        <ReportAbuseModal shortCode={link.short_code} onClose={() => setShowReport(false)} />
      )}
    </main>
  );
}
