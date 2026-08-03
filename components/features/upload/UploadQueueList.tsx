"use client";

import { X, RotateCcw, CheckCircle2, AlertCircle, Copy, FileIcon } from "lucide-react";
import { formatBytes } from "@/lib/utils/formatBytes";
import type { UploadItem } from "@/types/upload";

interface UploadQueueListProps {
  items: UploadItem[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

export function UploadQueueList({ items, onRemove, onRetry }: UploadQueueListProps) {
  if (items.length === 0) return null;

  const copyLink = (shareUrl: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${shareUrl}`);
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.id} className="glass-card rounded-xl2 shadow-soft p-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-2 shrink-0">
              <FileIcon size={18} className="text-slate-500" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                {item.file.name}
              </p>
              <p className="text-xs text-slate-400">{formatBytes(item.file.size)}</p>
            </div>

            {item.status === "uploading" && (
              <span className="text-xs text-slate-500 whitespace-nowrap">{item.progress}%</span>
            )}
            {item.status === "success" && (
              <button onClick={() => copyLink(item.shareUrl!)} className="text-slate-400 hover:text-brand">
                <Copy size={16} />
              </button>
            )}
            {item.status === "success" && <CheckCircle2 size={18} className="text-green-500" />}
            {item.status === "error" && (
              <button onClick={() => onRetry(item.id)} className="text-slate-400 hover:text-brand">
                <RotateCcw size={16} />
              </button>
            )}
            {item.status === "error" && <AlertCircle size={18} className="text-red-500" />}

            <button onClick={() => onRemove(item.id)} className="text-slate-400 hover:text-red-500">
              <X size={16} />
            </button>
          </div>

          {(item.status === "uploading" || item.status === "queued") && (
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-brand transition-all duration-200"
                style={{ width: `${item.status === "queued" ? 0 : item.progress}%` }}
              />
            </div>
          )}

          {item.status === "error" && (
            <p className="text-xs text-red-500 mt-2">{item.error}</p>
          )}

          {item.status === "success" && (
            <p className="text-xs text-brand mt-2 truncate">
              {window.location.origin}
              {item.shareUrl}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
