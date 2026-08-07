"use client";

import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import { getPreviewKind, getFileIcon } from "@/lib/utils/fileType";

interface FilePreviewProps {
  mimeType: string;
  downloadUrl: string;
  fileName: string;
}

// ফাইল প্রিভিউ কম্পোনেন্ট (ইমেজ, ভিডিও, অডিও, পিডিএফ এবং টেক্সট সাপোর্টেড)
export function FilePreview({ mimeType, downloadUrl, fileName }: FilePreviewProps) {
  const kind = getPreviewKind(mimeType, fileName);
  const [imageFailed, setImageFailed] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textError, setTextError] = useState(false);

  useEffect(() => {
    if (kind !== "text") return;
    let cancelled = false;

    fetch(downloadUrl)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.text();
      })
      .then((text) => {
        if (!cancelled) setTextContent(text.slice(0, 5000));
      })
      .catch(() => {
        if (!cancelled) setTextError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [kind, downloadUrl]);

  // প্রিভিউ অনুপস্থিত থাকলে ফলব্যাক ভিউ
  const Fallback = () => (
    <div className="rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center py-16 gap-3">
      <span className="text-4xl">{getFileIcon(mimeType)}</span>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 px-4 text-center truncate max-w-full">
        {fileName}
      </p>
      <p className="text-xs text-slate-400">Preview not available for this file type.</p>
    </div>
  );

  // ইমেজ ফাইল প্রিভিউ
  if (kind === "image" && !imageFailed) {
    return (
      <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center max-h-96">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={downloadUrl}
          alt={fileName}
          className="max-h-96 w-auto object-contain"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  // ভিডিও ফাইল প্রিভিউ (Cloudflare Worker Stream Compatible)
  if (kind === "video") {
    return (
      <video 
        controls 
        preload="metadata" 
        playsInline
        className="w-full rounded-xl max-h-96 bg-black"
      >
        <source src={downloadUrl} type={mimeType} />
        আপনার ব্রাউজারে ভিডিও চালানো যাচ্ছে না।
      </video>
    );
  }

  // অডিও ফাইল প্রিভিউ
  if (kind === "audio") {
    return (
      <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-6 flex flex-col items-center gap-4">
        <span className="text-4xl">🎵</span>
        <audio controls preload="metadata" className="w-full">
          <source src={downloadUrl} type={mimeType} />
        </audio>
      </div>
    );
  }

  // পিডিএফ ফাইল প্রিভিউ
  if (kind === "pdf") {
    return (
      <iframe
        src={downloadUrl}
        className="w-full h-96 rounded-xl border border-slate-200 dark:border-slate-700"
        title={fileName}
      />
    );
  }

  // টেক্সট/কোড ফাইল প্রিভিউ
  if (kind === "text") {
    if (textError) return <Fallback />;
    return (
      <div className="rounded-xl bg-slate-900 text-slate-100 p-4 max-h-96 overflow-auto">
        <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs">
          <FileText size={14} /> {fileName}
        </div>
        {textContent === null ? (
          <p className="text-xs text-slate-500">Loading preview...</p>
        ) : (
          <pre className="text-xs whitespace-pre-wrap break-words">{textContent}</pre>
        )}
      </div>
    );
  }

  return <Fallback />;
}
