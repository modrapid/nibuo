"use client";

import { useCallback, useRef, useState } from "react";
import { uploadFile, type UploadHandle } from "@/lib/upload/multipartUploader";
import type { UploadItem, UploadSettings } from "@/types/upload";

/** How many files upload at once. Bump this up/down as needed. */
const MAX_CONCURRENT_UPLOADS = 3;

export function useUploadQueue() {
  const [items, setItems] = useState<UploadItem[]>([]);

  // Mirrors `items` synchronously so processQueue can read the latest state
  // without going through React's async setState — avoids stale closures
  // and the impure "read state inside a setState updater" pattern.
  const itemsRef = useRef<Map<string, UploadItem>>(new Map());
  const handles = useRef<Map<string, UploadHandle>>(new Map());
  const activeUploads = useRef(0);
  const pendingQueue = useRef<string[]>([]);

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        itemsRef.current.set(id, next);
        return next;
      })
    );
  }, []);

  const processQueue = useCallback(
    (settings: UploadSettings) => {
      while (activeUploads.current < MAX_CONCURRENT_UPLOADS && pendingQueue.current.length > 0) {
        const nextId = pendingQueue.current.shift();
        if (!nextId) break;

        const item = itemsRef.current.get(nextId);
        if (!item) continue;

        activeUploads.current++;
        updateItem(nextId, { status: "uploading", progress: 0, bytesUploaded: 0 });

        const handle = uploadFile(item.file, {
          expiresIn: settings.expiresIn,
          password: settings.password,
          onProgress: (percent, bytesUploaded, totalBytes) =>
            updateItem(nextId, { progress: percent, bytesUploaded, totalBytes }),
        });
        handles.current.set(nextId, handle);

        handle.promise
          .then((res) => {
            updateItem(nextId, { status: "success", progress: 100, shareUrl: res.shareUrl });
          })
          .catch((err: { code?: string; message?: string }) => {
            const cancelled = err?.code === "cancelled";
            updateItem(nextId, {
              status: cancelled ? "cancelled" : "error",
              error: cancelled ? undefined : err?.message || "Upload failed.",
              errorCode: err?.code as UploadItem["errorCode"],
            });
          })
          .finally(() => {
            handles.current.delete(nextId);
            activeUploads.current--;
            processQueue(settings);
          });
      }
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
        bytesUploaded: 0,
        totalBytes: file.size,
      }));

      newItems.forEach((item) => itemsRef.current.set(item.id, item));
      setItems((prev) => [...prev, ...newItems]);
      pendingQueue.current.push(...newItems.map((i) => i.id));

      processQueue(settings);
    },
    [processQueue]
  );

  /** Cancels an in-flight or queued upload. The item stays in the list as "cancelled". */
  const cancelItem = useCallback((id: string) => {
    handles.current.get(id)?.cancel();
    pendingQueue.current = pendingQueue.current.filter((queueId) => queueId !== id);
  }, []);

  const removeItem = useCallback(
    (id: string) => {
      cancelItem(id);
      itemsRef.current.delete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [cancelItem]
  );

  const retryItem = useCallback(
    (id: string, settings: UploadSettings = {}) => {
      const item = itemsRef.current.get(id);
      if (!item || item.status === "uploading") return;

      pendingQueue.current.push(id);
      updateItem(id, { status: "queued", progress: 0, error: undefined, errorCode: undefined });
      processQueue(settings);
    },
    [processQueue, updateItem]
  );

  return { items, addFiles, removeItem, retryItem, cancelItem };
}
