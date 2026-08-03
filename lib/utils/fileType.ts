export type FilePreviewKind = "image" | "video" | "pdf" | "none";

export function getPreviewKind(mimeType: string): FilePreviewKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  return "none";
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎬";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "🗜️";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  return "📦";
}
