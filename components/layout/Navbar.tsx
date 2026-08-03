"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/actions/auth.actions";
import type { User } from "@supabase/supabase-js";

interface NavbarProps {
  user: User | null;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
      <Link href="/" className="font-extrabold text-lg text-slate-900 dark:text-white">
        Nibuo.com
      </Link>

      <div className="flex items-center gap-4 text-sm font-medium">
        {user ? (
          <>
            <Link href="/dashboard" className="text-slate-600 dark:text-slate-300 hover:text-brand">
              Dashboard
            </Link>
            <button onClick={handleLogout} className="text-slate-600 dark:text-slate-300 hover:text-red-500">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-slate-600 dark:text-slate-300 hover:text-brand">
              Log In
            </Link>
            <Link
              href="/register"
              className="bg-brand text-white rounded-lg px-4 py-2 hover:bg-brand-light transition"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
