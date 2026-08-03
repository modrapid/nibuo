"use client";

import { getPreviewKind } from "@/lib/utils/fileType";

interface FilePreviewProps {
  mimeType: string;
  downloadUrl: string;
  fileName: string;
}

export function FilePreview({ mimeType, downloadUrl, fileName }: FilePreviewProps) {
  const kind = getPreviewKind(mimeType);

  if (kind === "image") {
    return (
      <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center max-h-96">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={downloadUrl} alt={fileName} className="max-h-96 w-auto object-contain" />
      </div>
    );
  }

  if (kind === "video") {
    return (
      <video controls className="w-full rounded-xl max-h-96 bg-black">
        <source src={downloadUrl} type={mimeType} />
        Your browser does not support video playback.
      </video>
    );
  }

  if (kind === "pdf") {
    return (
      <iframe
        src={downloadUrl}
        className="w-full h-96 rounded-xl border border-slate-200 dark:border-slate-700"
        title={fileName}
      />
    );
  }

  return (
    <div className="rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center py-16">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Preview not available for this file type.
      </p>
    </div>
  );
}
