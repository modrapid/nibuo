"use client";

import { useEffect, useRef } from "react";

interface QrCodeDisplayProps {
  value: string;
  size?: number;
}

// Lightweight QR renderer using the public QR Server image API — no extra deps needed.
export function QrCodeDisplay({ value, size = 140 }: QrCodeDisplayProps) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    value
  )}`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="QR code for this link"
      width={size}
      height={size}
      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-2"
    />
  );
}
