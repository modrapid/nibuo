"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = document.documentElement.classList.contains("dark");
    setIsDark(stored);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.cookie = `theme=${next ? "dark" : "light"}; path=/; max-age=31536000`;
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700
                 text-slate-500 hover:text-brand transition"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
