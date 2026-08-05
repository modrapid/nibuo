import { FilePageClient } from "@/components/features/file/FilePageClient";

export default async function FilePage({
  params,
}: {
  params: Promise<{ shortCode: string }>;
}) {
  const { shortCode } = await params;
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/f/${shortCode}`;

  return <FilePageClient shortCode={shortCode} shareUrl={shareUrl} />;
}
