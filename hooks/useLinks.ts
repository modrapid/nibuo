"use client";

import { useState, useEffect, useCallback } from "react";
import { createShortLink, getUserLinks, deleteLink } from "@/actions/link.actions";
import type { ShortLink } from "@/types/link";

interface UseLinksReturn {
  links: ShortLink[];
  loading: boolean;
  error: string | null;
  shorten: (url: string, options?: ShortenOptions) => Promise<{ success: boolean; error?: string }>;
  remove: (id: string) => Promise<void>;
}

interface ShortenOptions {
  customAlias?: string;
  expiresIn?: "1d" | "7d" | "30d" | "never";
  password?: string;
}

function mapDbLink(row: any): ShortLink {
  return {
    id: row.id,
    shortCode: row.short_code,
    originalUrl: row.original_url,
    clicks: row.clicks,
    createdAt: row.created_at,
  };
}

export function useLinks(): UseLinksReturn {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    const res = await getUserLinks();
    if (res.error) {
      setError(res.error);
    } else {
      setLinks((res.data ?? []).map(mapDbLink));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const shorten = async (url: string, options?: ShortenOptions) => {
    const res = await createShortLink({ originalUrl: url, ...options });
    if (res.error) {
      return { success: false, error: res.error };
    }
    if (res.data) {
      setLinks((prev) => [mapDbLink(res.data), ...prev]);
    }
    return { success: true };
  };

  const remove = async (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
    await deleteLink(id);
  };

  return { links, loading, error, shorten, remove };
}
