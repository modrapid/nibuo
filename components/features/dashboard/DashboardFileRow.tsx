"use client";

import { useState } from "react";
import { Copy, Trash2, Eye, DownloadCloud, ExternalLink, Pencil } from "lucide-react";
import { formatBytes } from "@/lib/utils/formatBytes";
import { getFileIcon } from "@/lib/utils/fileType";
import type { DashboardFile } from "@/types/dashboard";

interface DashboardFileRowProps {
  file: DashboardFile;
  siteUrl: string;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function DashboardFileRow({ file, siteUrl, onDelete, onRefresh }: DashboardFileRowProps) {
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(file.original_name);
  const isExpired = file.expires_at && new Date(file.expires_at) < new Date();
  const shareUrl = `${siteUrl}/f/${file.short_code}`;

  const copyLink = async () => {
    navigator.clipboard.writeText(shareUrl);
    fetch(`/api/files/copy-link/${file.short_code}`, { method: "POST" }).catch(() => {});
  };

  const saveRename = async () => {
    if (newName.trim() && newName !== file.original_name) {
      await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalName: newName.trim() }),
      });
      onRefresh();
    }
    setRenaming(false);
  };

  return (
    <div className="glass-card rounded-xl2 shadow-soft px-4 py-3 flex flex-wrap items-center gap-3">
      <span className="text-xl shrink-0">{getFileIcon(file.mime_type)}</span>

      <div className="flex-1 min-w-[160px]">
        {renaming ? (
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={saveRename}
            onKeyDown={(e) => e.key === "Enter" && saveRename()}
            className="w-full rounded border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm bg-white dark:bg-slate-800"
          />
        ) : (
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
              {file.original_name}
            </p>
            {isExpired && (
              <span className="text-[10px] bg-red-100 text-red-600 rounded px-1.5 py-0.5">Expired</span>
            )}
          </div>
        )}
        <p className="text-xs text-slate-400">{formatBytes(file.size_bytes)}</p>
      </div>

      <span className="flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap">
        <Eye size={14} /> {file.views}
      </span>
      <span className="flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap">
        <DownloadCloud size={14} /> {file.downloads}
      </span>

      <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-brand transition">
        <ExternalLink size={18} />
      </a>
      <button onClick={() => setRenaming(true)} className="text-slate-400 hover:text-brand transition">
        <Pencil size={18} />
      </button>
      <button onClick={copyLink} className="text-slate-400 hover:text-brand transition">
        <Copy size={18} />
      </button>
      <button onClick={() => onDelete(file.id)} className="text-slate-400 hover:text-red-500 transition">
        <Trash2 size={18} />
      </button>
    </div>
  );
}
