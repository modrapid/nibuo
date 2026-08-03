"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud } from "lucide-react";

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export function DropZone({ onFilesSelected }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFilesSelected(files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFilesSelected(files);
    e.target.value = "";
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`glass-card rounded-xl2 shadow-soft p-10 md:p-16 max-w-2xl mx-auto
                  flex flex-col items-center justify-center gap-4 cursor-pointer
                  border-2 border-dashed transition
                  ${isDragging
                    ? "border-brand bg-brand/5 scale-[1.01]"
                    : "border-slate-300 dark:border-slate-700"}`}
    >
      <div className="bg-brand/10 text-brand rounded-full p-4">
        <UploadCloud size={32} />
      </div>
      <p className="font-semibold text-slate-800 dark:text-slate-100">
        Drag & drop files here
      </p>
      <p className="text-sm text-slate-400">or click to browse from your device</p>

      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleChange}
        className="hidden"
        accept="image/*,video/*,application/pdf,application/zip,application/x-rar-compressed,.doc,.docx"
      />
    </div>
  );
                    }
