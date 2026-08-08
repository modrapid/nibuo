"use client";

import { useEffect, useState } from "react";
import { getSiteSettings, updateSiteSettings } from "@/actions/admin.actions";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSiteSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await updateSiteSettings(settings);
    setSaving(false);
  };

  if (loading) return <p className="text-slate-400">Loading settings...</p>;

  const fields = [
    { key: "site_name", label: "Website Name" },
    { key: "max_links_per_user", label: "Max Links Per User" },
    { key: "default_expiry", label: "Default Expiry (never, 1d, 7d, 30d)" },
    { key: "token_lifetime_seconds", label: "Password Access Token Lifetime (seconds)" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">Settings</h1>

      <div className="glass-card rounded-xl2 shadow-soft p-6 max-w-lg flex flex-col gap-4">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 block">
              {label}
            </label>
            <input
              value={settings[key] ?? ""}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700
                         bg-white/70 dark:bg-slate-800/60 px-3 py-2 text-sm outline-none
                         focus:ring-2 focus:ring-brand"
            />
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand hover:bg-brand-light text-white font-semibold
                     rounded-xl px-6 py-2.5 transition disabled:opacity-60 mt-2"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
