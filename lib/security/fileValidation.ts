const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "application/zip",
  "application/x-rar-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB

interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(file: { type: string; size: number; name: string }): FileValidationResult {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: "File type not allowed." };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: "File exceeds maximum size of 500MB." };
  }

  // Block double extensions commonly used to disguise executables (e.g. file.jpg.exe)
  const suspiciousPattern = /\.(exe|bat|cmd|sh|php|js|jar|com|scr)(\.[a-z0-9]+)?$/i;
  if (suspiciousPattern.test(file.name)) {
    return { valid: false, error: "File name contains a disallowed extension." };
  }

  return { valid: true };
}

export function generateSecureFilename(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "bin";
  const random = crypto.randomUUID();
  return `${random}.${ext}`;
}
