"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface EditExpiryModalProps {
  fileId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditExpiryModal({ fileId, onClose, onUpdated }: EditExpiryModalProps) {
  const [expiry, setExpiry] = useState<"1d" | "3d" | "7d" | "14d" | "never">("never");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresIn: expiry }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update expiry.");
      }

      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update expiry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="glass-card rounded-xl2 shadow-soft p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white">Edit Expiry</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <select
          value={expiry}
          onChange={(e) => setExpiry(e.target.value as typeof expiry)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700
                     bg-white/70 dark:bg-slate-800/60 px-3 py-2 text-sm outline-none
                     focus:ring-2 focus:ring-brand mb-4"
        >
          <option value="never">Never expire</option>
          <option value="1d">1 Day</option>
          <option value="3d">3 Days</option>
          <option value="7d">7 Days</option>
          <option value="14d">14 Days</option>
        </select>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-brand hover:bg-brand-light text-white font-semibold
                     rounded-xl px-6 py-2.5 transition disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
