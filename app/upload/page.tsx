"use client";

import { useState } from "react";
import { DropZone } from "@/components/features/upload/DropZone";
import { UploadQueueList } from "@/components/features/upload/UploadQueueList";
import { UploadSettings } from "@/components/features/upload/UploadSettings";
import { useUploadQueue } from "@/hooks/useUploadQueue";

export default function UploadPage() {
  const { items, addFiles, removeItem, retryItem, cancelItem } = useUploadQueue();
  const [expiresIn, setExpiresIn] = useState<"1d" | "3d" | "7d" | "14d">("7d");
  const [password, setPassword] = useState("");

  const currentSettings = { expiresIn, password: password.trim() || undefined };

  const handleFilesSelected = (files: File[]) => {
    addFiles(files, currentSettings);
  };

  const handleRetry = (id: string) => {
    retryItem(id, currentSettings);
  };

  return (
    <main className="min-h-screen py-16 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
          Send Files
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-3">
          Fast, secure, and simple file sharing.
        </p>
      </div>

      <DropZone onFilesSelected={handleFilesSelected} />
      <UploadSettings
        expiresIn={expiresIn}
        password={password}
        onExpiryChange={setExpiresIn}
        onPasswordChange={setPassword}
      />
      <UploadQueueList items={items} onRemove={removeItem} onRetry={handleRetry} onCancel={cancelItem} />
    </main>
  );
}
