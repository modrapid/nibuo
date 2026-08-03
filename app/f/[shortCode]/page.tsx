import { getFileByShortCode, registerFileView } from "@/actions/file.actions";
import { FilePageClient } from "@/components/features/file/FilePageClient";
import { notFound } from "next/navigation";

export default async function FilePage({
  params,
}: {
  params: Promise<{ shortCode: string }>;
}) {
  const { shortCode } = await params;
  const result = await getFileByShortCode(shortCode);

  if (result.error === "expired") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card rounded-xl2 shadow-soft p-8 text-center max-w-sm">
          <h1 className="font-bold text-slate-900 dark:text-white mb-2">
            This file is no longer available.
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            The upload has expired and was automatically removed.
          </p>
        </div>
      </main>
    );
  }

  if (result.error || !result.data) notFound();

  await registerFileView(shortCode);

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/f/${shortCode}`;

  return <FilePageClient file={result.data} shareUrl={shareUrl} />;
}
