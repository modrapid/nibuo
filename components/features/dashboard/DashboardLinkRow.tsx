"use client";

import { useState } from "react";
import { Copy, Trash2, Calendar, ExternalLink } from "lucide-react";
import { EditExpiryModal } from "./EditExpiryModal";
import type { DashboardLink } from "@/types/dashboard";

interface DashboardLinkRowProps {
  link: DashboardLink;
  domain: string;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function DashboardLinkRow({ link, domain, onDelete, onRefresh }: DashboardLinkRowProps) {
  const [showExpiryModal, setShowExpiryModal] = useState(false);

  const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
  const shortUrl = `https://${domain}/${link.short_code}`;

  const copyLink = () => navigator.clipboard.writeText(shortUrl);

  return (
    <>
      <div className="glass-card rounded-xl2 shadow-soft px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[180px]">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
              {domain}/{link.short_code}
            </p>
            {isExpired && (
              <span className="text-[10px] bg-red-100 text-red-600 rounded px-1.5 py-0.5">
                Expired
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 truncate">{link.original_url}</p>
        </div>

        <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600
                         dark:text-slate-300 rounded-md px-2 py-1 whitespace-nowrap">
          {link.clicks} clicks
        </span>

        <a
          href={shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-brand transition"
        >
          <ExternalLink size={18} />
        </a>

        <button onClick={copyLink} className="text-slate-400 hover:text-brand transition">
          <Copy size={18} />
        </button>

        <button
          onClick={() => setShowExpiryModal(true)}
          className="text-slate-400 hover:text-brand transition"
        >
          <Calendar size={18} />
        </button>

        <button
          onClick={() => onDelete(link.id)}
          className="text-slate-400 hover:text-red-500 transition"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {showExpiryModal && (
        <EditExpiryModal
          linkId={link.id}
          onClose={() => setShowExpiryModal(false)}
          onUpdated={onRefresh}
        />
      )}
    </>
  );
}
