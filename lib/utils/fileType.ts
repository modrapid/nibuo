export type FilePreviewKind = "image" | "video" | "audio" | "pdf" | "text" | "none";

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "json", "csv", "log", "xml", "html", "css", "js", "jsx",
  "ts", "tsx", "php", "py", "java", "c", "cpp", "cs", "go", "rb", "rs",
  "sql", "yaml", "yml", "sh", "svg",
]);

export function getPreviewKind(mimeType: string, fileName: string): FilePreviewKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (mimeType.startsWith("text/") || TEXT_EXTENSIONS.has(ext)) return "text";

  return "none";
}

const CATEGORY_ICON: Record<string, string> = {
  image: "🖼️",
  video: "🎬",
  audio: "🎵",
  pdf: "📄",
  text: "📝",
  archive: "🗜️",
  document: "📘",
  spreadsheet: "📊",
  none: "📦",
};

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return CATEGORY_ICON.image;
  if (mimeType.startsWith("video/")) return CATEGORY_ICON.video;
  if (mimeType.startsWith("audio/")) return CATEGORY_ICON.audio;
  if (mimeType === "application/pdf") return CATEGORY_ICON.pdf;
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("compressed"))
    return CATEGORY_ICON.archive;
  if (mimeType.includes("word") || mimeType.includes("document")) return CATEGORY_ICON.document;
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return CATEGORY_ICON.spreadsheet;
  return CATEGORY_ICON.none;
}
