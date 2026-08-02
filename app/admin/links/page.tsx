"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllLinksAdmin, deleteLinkAdmin } from "@/actions/admin.actions";
import { Search, Trash2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

export default function AdminLinksPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 10;

  const fetchLinks = useCallback(async () => {
    const res = await getAllLinksAdmin(page, pageSize, search);
    if (res.data) {
      setLinks(res.data);
      setCount(res.count ?? 0);
    }
  }, [page, search]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleDelete = async (id: string) => {
    await deleteLinkAdmin(id);
    fetchLinks();
  };

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">Links</h1>

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by short code..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700
                     bg-white/70 dark:bg-slate-800/60 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="flex flex-col gap-2">
        {links.map((link) => (
          <div
            key={link.id}
            className="glass-card rounded-xl px-4 py-3 flex items-center justify-between text-sm gap-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-800 dark:text-slate-100">/{link.short_code}</p>
              <p className="text-xs text-slate-400 truncate">{link.original_url}</p>
            </div>
            <span className="text-slate-500 whitespace-nowrap">{link.clicks} clicks</span>
            <a href={`/${link.short_code}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-brand">
              <ExternalLink size={16} />
            </a>
            <button onClick={() => handleDelete(link.id)} className="text-slate-400 hover:text-red-500">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm text-slate-500">
          Page {page} of {totalPages || 1}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
