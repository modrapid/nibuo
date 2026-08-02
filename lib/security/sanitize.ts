// Strips HTML tags and dangerous characters to prevent XSS in user-supplied text
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>"'`]/g, "")
    .trim()
    .slice(0, 1000);
}

export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;

    // Block common malicious/internal targets
    const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
    if (blockedHosts.includes(parsed.hostname)) return null;

    return parsed.toString();
  } catch {
    return null;
  }
}
