"use client";

import { useState } from "react";
import { Copy, Trash2, BarChart3 } from "lucide-react";
import type { ShortLink } from "@/types/link";

interface RecentLinksProps {
  links: ShortLink[];
  onDelete: (id: string) => void;
  domain?: string;
}

export function RecentLinks({ links, onDelete, domain = "xbare.top" }: RecentLinksProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
    } else {
      setSelected(new Set(links.map((l) => l.id)));
    }
    setSelectAll(!selectAll);
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const copyLink = (shortCode: string) => {
    navigator.clipboard.writeText(`https://${domain}/${shortCode}`);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold tracking-wide text-slate-500 dark:text-slate-400">
          RECENT LINKS
        </h2>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            className="rounded border-slate-300"
          />
          Select All
        </label>
      </div>

      <div className="flex flex-col gap-3">
        {links.map((link) => (
          <div
            key={link.id}
            className="glass-card rounded-xl2 shadow-soft px-4 py-3 flex items-center gap-3"
          >
            <input
              type="checkbox"
              checked={selected.has(link.id)}
              onChange={() => toggleOne(link.id)}
              className="rounded border-slate-300"
            />

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                {domain}/{link.shortCode}
              </p>
              <p className="text-xs text-slate-400 truncate">{link.originalUrl}</p>
            </div>

            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600
                             dark:text-slate-300 rounded-md px-2 py-1 whitespace-nowrap">
              {link.clicks} clicks
            </span>

            <button
              onClick={() => copyLink(link.shortCode)}
              className="text-sm font-medium border border-slate-200 dark:border-slate-600
                         rounded-md px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Copy
            </button>

            <button className="text-slate-400 hover:text-brand transition">
              <BarChart3 size={18} />
            </button>

            <button
              onClick={() => onDelete(link.id)}
              className="text-slate-400 hover:text-red-500 transition"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
