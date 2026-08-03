import Link from "next/link";
import { UploadCloud, Zap, ShieldCheck } from "lucide-react";

export function HeroSection() {
  return (
    <section className="pt-20 pb-16 px-4 text-center">
      <span className="inline-flex items-center gap-2 text-xs font-medium bg-brand/10 text-brand
                       rounded-full px-3 py-1 mb-6">
        <Zap size={14} /> Fast, Secure file sharing
      </span>

      <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight">
        Send files.
        <br />
        <span className="text-brand">No sign-up needed.</span>
      </h1>

      <p className="text-slate-500 dark:text-slate-400 mt-5 max-w-xl mx-auto">
        Drag, drop, and share — up to 14GB free. Password protection, expiry
        control, and download tracking, all built in.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        <Link
          href="/upload"
          className="flex items-center gap-2 bg-brand hover:bg-brand-light text-white
                     font-semibold rounded-xl px-7 py-3 transition"
        >
          <UploadCloud size={18} /> Start Uploading
        </Link>
        <Link
          href="/#pricing"
          className="flex items-center gap-2 border border-slate-200 dark:border-slate-700
                     rounded-xl px-7 py-3 font-medium text-sm hover:bg-slate-50
                     dark:hover:bg-slate-800 transition"
        >
          <ShieldCheck size={18} /> View Plans
        </Link>
      </div>
    </section>
  );
}
