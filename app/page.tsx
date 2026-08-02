"use client";

import { useState } from "react";
import { ShortenerForm } from "@/components/features/shortener/ShortenerForm";
import { RecentLinks } from "@/components/features/shortener/RecentLinks";
import type { ShortLink } from "@/types/link";

export default function HomePage() {
  const [links, setLinks] = useState<ShortLink[]>([]);

  const handleShorten = (url: string) => {
    const newLink: ShortLink = {
      id: crypto.randomUUID(),
      shortCode: Math.random().toString(36).slice(2, 8),
      originalUrl: url,
      clicks: 0,
      createdAt: new Date().toISOString(),
    };
    setLinks((prev) => [newLink, ...prev]);
  };

  const handleDelete = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <main className="min-h-screen py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
          URL Shortener
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-3">
          Create compact, trackable links.
        </p>
      </div>

      <ShortenerForm onShorten={handleShorten} />
      <RecentLinks links={links} onDelete={handleDelete} />
    </main>
  );
}
