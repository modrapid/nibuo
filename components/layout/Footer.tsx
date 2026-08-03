import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 py-10 px-4 mt-10">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="font-extrabold text-slate-900 dark:text-white">xbare.top</p>
          <p className="text-sm text-slate-400 mt-1">Fast, secure file sharing.</p>
        </div>

        <div className="flex flex-wrap gap-6 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/#pricing" className="hover:text-brand transition">Pricing</Link>
          <Link href="/#faq" className="hover:text-brand transition">FAQ</Link>
          <Link href="/terms" className="hover:text-brand transition">Terms</Link>
          <Link href="/privacy" className="hover:text-brand transition">Privacy</Link>
        </div>

        <p className="text-xs text-slate-400">© {new Date().getFullYear()} xbare.top</p>
      </div>
    </footer>
  );
}
