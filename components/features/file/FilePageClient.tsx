"use client";

import { useState } from "react";
import { Download, Copy, Flag, Calendar, Eye, DownloadCloud } from "lucide-react";
import { FilePreview } from "./FilePreview";
import { QrCodeDisplay } from "./QrCodeDisplay";
import { PasswordGate } from "./PasswordGate";
import { ReportAbuseModal } from "@/components/features/link/ReportAbuseModal";
import { registerFileDownload } from "@/actions/file.actions";
import { formatBytes } from "@/lib/utils/formatBytes";
import { getFileIcon } from "@/lib/utils/fileType";

interface FilePageClientProps {
  file: {
    short_code: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    download_url: string;
    expires_at: string | null;
    views: number;
    downloads: number;
    password_hash: string | null;
    created_at: string;
  };
  shareUrl: string;
}

export function FilePageClient({ file, shareUrl }: FilePageClientProps) {
  const [unlocked, setUnlocked] = useState(!file.password_hash);
  const [showReport, setShowReport] = useState(false);
  const [downloads, setDownloads] = useState(file.downloads);

  if (!unlocked) {
    return <PasswordGate shortCode={file.short_code} onUnlocked={() => setUnlocked(true)} />;
  }

  const handleDownload = async () => {
    setDownloads((d) => d + 1);
    await registerFileDownload(file.short_code);
    window.open(file.download_url, "_blank");
  };

  const copyLink = () => navigator.clipboard.writeText(shareUrl);

  return (
    <main className="min-h-screen py-16 px-4">
      <div className="glass-card rounded-xl2 shadow-soft p-6 md:p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{getFileIcon(file.mime_type)}</span>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-900 dark:text-white truncate">
              {file.original_name}
            </h1>
            <p className="text-sm text-slate-400">{formatBytes(file.size_bytes)}</p>
          </div>
        </div>

        <FilePreview
          mimeType={file.mime_type}
          downloadUrl={file.download_url}
          fileName={file.original_name}
        />

        <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar size={14} /> Uploaded {new Date(file.created_at).toLocaleDateString()}
          </span>
          {file.expires_at && (
            <span className="flex items-center gap-1">
              <Calendar size={14} /> Expires {new Date(file.expires_at).toLocaleDateString()}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye size={14} /> {file.views} views
          </span>
          <span className="flex items-center gap-1">
            <DownloadCloud size={14} /> {downloads} downloads
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-6">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-brand hover:bg-brand-light text-white
                       font-semibold rounded-xl px-6 py-2.5 transition"
          >
            <Download size={16} /> Download
          </button>

          <button
            onClick={copyLink}
            className="flex items-center gap-2 border border-slate-200 dark:border-slate-700
                       rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-slate-50
                       dark:hover:bg-slate-800 transition"
          >
            <Copy size={16} /> Copy Link
          </button>

          <QrCodeDisplay value={shareUrl} size={56} />
        </div>

        <button
          onClick={() => setShowReport(true)}
          className="flex items-center gap-1 mt-6 text-xs text-slate-400 hover:text-red-500 transition"
        >
          <Flag size={14} /> Report Abuse
        </button>
      </div>

      {showReport && (
        <ReportAbuseModal shortCode={file.short_code} onClose={() => setShowReport(false)} />
      )}
    </main>
  );
}
