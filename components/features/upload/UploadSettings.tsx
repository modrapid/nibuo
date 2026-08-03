"use client";

interface UploadSettingsProps {
  expiresIn: "1d" | "3d" | "7d" | "14d";
  password: string;
  onExpiryChange: (v: "1d" | "3d" | "7d" | "14d") => void;
  onPasswordChange: (v: string) => void;
}

export function UploadSettings({
  expiresIn,
  password,
  onExpiryChange,
  onPasswordChange,
}: UploadSettingsProps) {
  return (
    <div className="max-w-2xl mx-auto mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <select
        value={expiresIn}
        onChange={(e) => onExpiryChange(e.target.value as typeof expiresIn)}
        className="rounded-lg border border-slate-200 dark:border-slate-700
                   bg-white/70 dark:bg-slate-800/60 px-3 py-2 text-sm outline-none
                   focus:ring-2 focus:ring-brand"
      >
        <option value="1d">Expires in 1 Day</option>
        <option value="3d">Expires in 3 Days</option>
        <option value="7d">Expires in 7 Days</option>
        <option value="14d">Expires in 14 Days</option>
      </select>

      <input
        type="password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        placeholder="Password protect (optional)"
        className="rounded-lg border border-slate-200 dark:border-slate-700
                   bg-white/70 dark:bg-slate-800/60 px-3 py-2 text-sm outline-none
                   focus:ring-2 focus:ring-brand"
      />
    </div>
  );
}
