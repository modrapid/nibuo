"use client";

import { useState, useCallback, useRef } from "react";
import { uploadFile } from "@/lib/upload/uploadFile";
import type { UploadItem } from "@/types/upload";

const MAX_CONCURRENT_UPLOADS = 3;

interface UploadSettings {
  expiresIn?: "1d" | "3d" | "7d" | "14d";
  password?: string;
}

export function useUploadQueue() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const activeUploads = useRef(0);
  const pendingQueue = useRef<string[]>([]);

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const processQueue = useCallback(
    async (settings: UploadSettings) => {
      if (activeUploads.current >= MAX_CONCURRENT_UPLOADS) return;
      const nextId = pendingQueue.current.shift();
      if (!nextId) return;

      activeUploads.current++;
      updateItem(nextId, { status: "uploading", progress: 0 });

      setItems((currentItems) => {
        const item = currentItems.find((i) => i.id === nextId);
        if (item) {
          uploadFile(item.file, {
            ...settings,
            onProgress: (percent) => updateItem(nextId, { progress: percent }),
          })
            .then((res) => {
              updateItem(nextId, { status: "success", progress: 100, shareUrl: res.shareUrl });
            })
            .catch((err) => {
              updateItem(nextId, { status: "error", error: err.message });
            })
            .finally(() => {
              activeUploads.current--;
              processQueue(settings);
            });
        }
        return currentItems;
      });
    },
    [updateItem]
  );

  const addFiles = useCallback(
    (files: File[], settings: UploadSettings = {}) => {
      const newItems: UploadItem[] = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "queued",
        progress: 0,
      }));

      setItems((prev) => [...prev, ...newItems]);
      pendingQueue.current.push(...newItems.map((i) => i.id));

      for (let i = 0; i < MAX_CONCURRENT_UPLOADS; i++) {
        processQueue(settings);
      }
    },
    [processQueue]
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    pendingQueue.current = pendingQueue.current.filter((qid) => qid !== id);
  }, []);

  const retryItem = useCallback(
    (id: string, settings: UploadSettings = {}) => {
      pendingQueue.current.push(id);
      updateItem(id, { status: "queued", progress: 0, error: undefined });
      processQueue(settings);
    },
    [processQueue, updateItem]
  );

  return { items, addFiles, removeItem, retryItem };
}
