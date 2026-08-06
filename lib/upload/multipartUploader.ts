"use client";

import type { UploadErrorCode, UploadSettings } from "@/types/upload";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** How many parts to upload at once, per file. */
const DEFAULT_PART_CONCURRENCY = 4;
/** How many times a single failed part (or single-shot upload) is retried. */
const MAX_RETRIES = 5;
/** Base delay for exponential backoff between retries. */
const RETRY_BASE_DELAY_MS = 1000;
/** Cap on the backoff delay so a flaky connection doesn't wait forever. */
const RETRY_MAX_DELAY_MS = 30_000;
/** If a PUT receives no upload progress for this long, treat it as stalled. */
const STALL_TIMEOUT_MS = 30_000;

const RESUME_STORE_PREFIX = "nibuo:upload-session:";
/** How long a resumable session is trusted before we start over from scratch. */
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
// Files at/below this size never use multipart, so persisting/looking up a
// resume session for them would be pointless overhead.
const MULTIPART_SESSION_MIN_SIZE = 8 * 1024 * 1024;

const RETRYABLE_CODES: UploadErrorCode[] = [
  "network",
  "timeout",
  "b2-rejection",
  "expired-url",
  "signature",
  "missing-etag",
];

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class UploadError extends Error {
  code: UploadErrorCode;

  constructor(code: UploadErrorCode, message: string) {
    super(message);
    this.name = "UploadError";
    this.code = code;
  }
}

function classifyXhrFailure(xhr: XMLHttpRequest): UploadError {
  const status = xhr.status;
  const text = xhr.responseText || "";

  if (status === 0) {
    return new UploadError(
      "network",
      "Network error — the connection was interrupted, or the request was blocked (check CORS settings or browser extensions)."
    );
  }
  if (status === 403) {
    if (/expired/i.test(text)) {
      return new UploadError("expired-url", "The upload URL expired before the request finished.");
    }
    return new UploadError("signature", "Backblaze B2 rejected the request signature.");
  }
  if (status === 404 || /NoSuchUpload/i.test(text)) {
    return new UploadError("invalid-upload-id", "This upload session no longer exists on the server.");
  }
  if (status === 400 && /EntityTooSmall/i.test(text)) {
    return new UploadError("b2-rejection", "A part was smaller than Backblaze B2's minimum allowed part size.");
  }
  if (status >= 500) {
    return new UploadError("b2-rejection", `Backblaze B2 returned a server error (${status}).`);
  }
  return new UploadError("b2-rejection", `Upload rejected by Backblaze B2 (status ${status}).`);
}

// ---------------------------------------------------------------------------
// API helpers — these are the only calls that hit our own Next.js server.
// File bytes are never sent to these endpoints; only metadata/signatures.
// ---------------------------------------------------------------------------

async function apiCall<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new UploadError("network", "Could not reach the server. Check your internet connection.");
  }

  let json: { data?: T; error?: string } | null = null;
  try {
    json = await res.json();
  } catch {
    // non-JSON response, fall through to status-based handling below
  }

  if (!res.ok) {
    const message = json?.error || `Request to ${url} failed (${res.status}).`;
    if (res.status === 429) {
      throw new UploadError("network", "Too many requests — please wait a moment and try again.");
    }
    if (res.status >= 500) {
      throw new UploadError("b2-rejection", message);
    }
    throw new UploadError("validation", message);
  }

  return json?.data as T;
}

interface InitResponseSingle {
  mode: "single";
  uploadUrl: string;
  storedName: string;
  shortCode: string;
}

interface InitResponseMultipart {
  mode: "multipart";
  uploadId: string;
  storedName: string;
  shortCode: string;
  partSize: number;
  partCount: number;
}

type InitResponse = InitResponseSingle | InitResponseMultipart;

function initUpload(file: File, mimeType: string): Promise<InitResponse> {
  return apiCall<InitResponse>("/api/upload/init", {
    fileName: file.name,
    mimeType,
    size: file.size,
  });
}

function signPart(storedName: string, uploadId: string, partNumber: number): Promise<{ url: string }> {
  return apiCall<{ url: string }>("/api/upload/sign-part", { storedName, uploadId, partNumber });
}

interface CompletePayload {
  mode: "single" | "multipart";
  storedName: string;
  shortCode: string;
  originalName: string;
  mimeType: string;
  uploadId?: string;
  parts?: { PartNumber: number; ETag: string }[];
  expiresIn?: UploadSettings["expiresIn"];
  password?: string;
}

function completeUpload(payload: CompletePayload): Promise<{ shareUrl: string; fileName: string }> {
  return apiCall<{ shareUrl: string; fileName: string }>("/api/upload/complete", payload);
}

function abortUpload(storedName: string, uploadId: string): Promise<void> {
  return apiCall<{ aborted: boolean }>("/api/upload/abort", { storedName, uploadId })
    .then(() => undefined)
    .catch(() => undefined); // best-effort cleanup — never let this block the UI
}

// ---------------------------------------------------------------------------
// Resumable session persistence (survives page refresh, keyed to the exact
// file). Browsers can't reattach a File object across a reload on their own,
// so resume only kicks in once the user re-selects/re-drops the same file —
// at that point we recognize it and skip parts that already succeeded.
// ---------------------------------------------------------------------------

interface PersistedSession {
  storedName: string;
  shortCode: string;
  uploadId: string;
  partSize: number;
  partCount: number;
  mimeType: string;
  completedParts: { PartNumber: number; ETag: string }[];
  createdAt: number;
}

function sessionKey(file: File): string {
  return `${RESUME_STORE_PREFIX}${file.name}::${file.size}::${file.lastModified}`;
}

function loadSession(file: File): PersistedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(sessionKey(file));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSession;
    if (Date.now() - parsed.createdAt > SESSION_TTL_MS) {
      window.localStorage.removeItem(sessionKey(file));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(file: File, session: PersistedSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(sessionKey(file), JSON.stringify(session));
  } catch {
    // localStorage full/unavailable (e.g. private browsing) — resume just
    // won't be available for this upload; not fatal.
  }
}

function clearSession(file: File): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(sessionKey(file));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Low-level PUT with progress + stall detection + ETag extraction
// ---------------------------------------------------------------------------

interface PutBlobOptions {
  contentType?: string;
  onProgress?: (loaded: number) => void;
  registerXhr: (xhr: XMLHttpRequest) => void;
  isCancelled: () => boolean;
}

function putBlob(url: string, blob: Blob, options: PutBlobOptions): Promise<{ etag: string | null }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    options.registerXhr(xhr);
    xhr.open("PUT", url);

    // Backblaze B2's presigned single-object PUT URL signs the Content-Type
    // header, so it must be sent exactly as it was when the URL was signed
    // or the request fails with a signature mismatch. Multipart part URLs
    // don't sign Content-Type, so it's harmless to omit it there.
    if (options.contentType) {
      xhr.setRequestHeader("Content-Type", options.contentType);
    }

    let stallTimer: ReturnType<typeof setTimeout>;
    const resetStallTimer = () => {
      clearTimeout(stallTimer);
      stallTimer = setTimeout(() => xhr.abort(), STALL_TIMEOUT_MS);
    };
    resetStallTimer();

    xhr.upload.onprogress = (e) => {
      resetStallTimer();
      if (e.lengthComputable) options.onProgress?.(e.loaded);
    };

    xhr.onload = () => {
      clearTimeout(stallTimer);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ etag: xhr.getResponseHeader("ETag") });
      } else {
        reject(classifyXhrFailure(xhr));
      }
    };

    xhr.onerror = () => {
      clearTimeout(stallTimer);
      reject(classifyXhrFailure(xhr));
    };

    xhr.onabort = () => {
      clearTimeout(stallTimer);
      if (options.isCancelled()) {
        reject(new UploadError("cancelled", "Upload cancelled."));
      } else {
        reject(new UploadError("timeout", "The upload stalled (no data received) and was aborted."));
      }
    };

    xhr.send(blob);
  });
}

// ---------------------------------------------------------------------------
// Retry with exponential backoff — retries only the failing operation
// (a single part, or the single-shot PUT), never the whole upload.
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: { maxRetries: number; isCancelled: () => boolean }
): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (opts.isCancelled()) throw err;

      const code = err instanceof UploadError ? err.code : "unknown";
      attempt++;

      if (!RETRYABLE_CODES.includes(code) || attempt > opts.maxRetries) {
        throw err;
      }

      const delay = Math.min(RETRY_MAX_DELAY_MS, RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)) + Math.random() * 300;
      await sleep(delay);
    }
  }
}

// ---------------------------------------------------------------------------
// Upload context shared across a single file's parts
// ---------------------------------------------------------------------------

interface UploadContext {
  cancelled: boolean;
  stopRequested: boolean;
  activeXhrs: Set<XMLHttpRequest>;
}

function createContext(): UploadContext {
  return { cancelled: false, stopRequested: false, activeXhrs: new Set() };
}

async function uploadPart(
  ctx: UploadContext,
  storedName: string,
  uploadId: string,
  partNumber: number,
  blob: Blob,
  onPartProgress: (loaded: number) => void
): Promise<{ PartNumber: number; ETag: string }> {
  return withRetry(
    async () => {
      const { url } = await signPart(storedName, uploadId, partNumber);
      const { etag } = await putBlob(url, blob, {
        onProgress: onPartProgress,
        registerXhr: (xhr) => ctx.activeXhrs.add(xhr),
        isCancelled: () => ctx.cancelled,
      });
      if (!etag) {
        throw new UploadError("missing-etag", "Backblaze B2 did not return an ETag for this part.");
      }
      return { PartNumber: partNumber, ETag: etag };
    },
    { maxRetries: MAX_RETRIES, isCancelled: () => ctx.cancelled }
  );
}

/** Runs `worker` over `parts` with up to `concurrency` running at once. */
async function runPartsPool(
  parts: number[],
  concurrency: number,
  ctx: UploadContext,
  worker: (partNumber: number) => Promise<void>
): Promise<void> {
  let index = 0;
  let firstError: unknown = null;

  async function runner(): Promise<void> {
    while (index < parts.length && !ctx.stopRequested && !ctx.cancelled) {
      const partNumber = parts[index++];
      try {
        await worker(partNumber);
      } catch (err) {
        firstError = firstError ?? err;
        ctx.stopRequested = true;
        return;
      }
    }
  }

  const runnerCount = Math.max(1, Math.min(concurrency, parts.length));
  await Promise.all(Array.from({ length: runnerCount }, () => runner()));

  if (firstError) throw firstError;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface UploadFileOptions extends UploadSettings {
  /** How many parts to upload in parallel for this file. */
  concurrency?: number;
  onProgress?: (percent: number, bytesUploaded: number, totalBytes: number) => void;
}

export interface UploadHandle {
  promise: Promise<{ shareUrl: string; fileName: string }>;
  /** Aborts in-flight requests, best-effort aborts the remote multipart upload, and clears resume state. */
  cancel: () => void;
}

export function uploadFile(file: File, options: UploadFileOptions = {}): UploadHandle {
  const ctx = createContext();
  const concurrency = options.concurrency ?? DEFAULT_PART_CONCURRENCY;

  const cancel = () => {
    if (ctx.cancelled) return;
    ctx.cancelled = true;
    ctx.stopRequested = true;
    for (const xhr of ctx.activeXhrs) {
      xhr.abort();
    }
  };

  const promise = (async () => {
    const mimeType = file.type || "application/octet-stream";
    const totalBytes = file.size;

    const partBytes = new Map<number, number>();
    const reportProgress = () => {
      let bytesUploaded = 0;
      for (const v of partBytes.values()) bytesUploaded += v;
      const percent = totalBytes === 0 ? 100 : Math.min(100, Math.round((bytesUploaded / totalBytes) * 100));
      options.onProgress?.(percent, bytesUploaded, totalBytes);
    };

    let mode: "single" | "multipart";
    let storedName: string;
    let shortCode: string;
    let uploadUrl: string | undefined;
    let uploadId: string | undefined;
    let partSize = 0;
    let partCount = 0;
    let completedParts: { PartNumber: number; ETag: string }[] = [];

    const existingSession = totalBytes > MULTIPART_SESSION_MIN_SIZE ? loadSession(file) : null;

    if (existingSession) {
      mode = "multipart";
      storedName = existingSession.storedName;
      shortCode = existingSession.shortCode;
      uploadId = existingSession.uploadId;
      partSize = existingSession.partSize;
      partCount = existingSession.partCount;
      completedParts = existingSession.completedParts;

      for (const p of completedParts) {
        const isLast = p.PartNumber === partCount;
        const size = isLast ? totalBytes - partSize * (partCount - 1) : partSize;
        partBytes.set(p.PartNumber, size);
      }
      reportProgress();
    } else {
      const init = await initUpload(file, mimeType);
      mode = init.mode;
      storedName = init.storedName;
      shortCode = init.shortCode;

      if (init.mode === "single") {
        uploadUrl = init.uploadUrl;
      } else {
        uploadId = init.uploadId;
        partSize = init.partSize;
        partCount = init.partCount;
        saveSession(file, {
          storedName,
          shortCode,
          uploadId,
          partSize,
          partCount,
          mimeType,
          completedParts: [],
          createdAt: Date.now(),
        });
      }
    }

    try {
      if (mode === "single") {
        if (ctx.cancelled) throw new UploadError("cancelled", "Upload cancelled.");

        await withRetry(
          async () => {
            try {
              return await putBlob(uploadUrl!, file, {
                contentType: mimeType,
                onProgress: (loaded) => {
                  partBytes.set(1, loaded);
                  reportProgress();
                },
                registerXhr: (xhr) => ctx.activeXhrs.add(xhr),
                isCancelled: () => ctx.cancelled,
              });
            } catch (err) {
              // A single-shot URL is only valid for 15 minutes; on the rare
              // chance it expires (very slow connection + retries) get a
              // fresh one instead of failing outright.
              if (err instanceof UploadError && (err.code === "expired-url" || err.code === "signature")) {
                const fresh = await initUpload(file, mimeType);
                if (fresh.mode === "single") uploadUrl = fresh.uploadUrl;
              }
              throw err;
            }
          },
          { maxRetries: MAX_RETRIES, isCancelled: () => ctx.cancelled }
        );
      } else {
        const completedMap = new Map(completedParts.map((p) => [p.PartNumber, p.ETag]));
        const remaining: number[] = [];
        for (let p = 1; p <= partCount; p++) {
          if (!completedMap.has(p)) remaining.push(p);
        }

        const persist = () => {
          saveSession(file, {
            storedName,
            shortCode,
            uploadId: uploadId!,
            partSize,
            partCount,
            mimeType,
            completedParts: Array.from(completedMap.entries()).map(([PartNumber, ETag]) => ({ PartNumber, ETag })),
            createdAt: Date.now(),
          });
        };

        await runPartsPool(remaining, concurrency, ctx, async (partNumber) => {
          const start = (partNumber - 1) * partSize;
          const end = Math.min(start + partSize, totalBytes);
          const blob = file.slice(start, end);

          try {
            const result = await uploadPart(ctx, storedName, uploadId!, partNumber, blob, (loaded) => {
              partBytes.set(partNumber, loaded);
              reportProgress();
            });
            completedMap.set(result.PartNumber, result.ETag);
            partBytes.set(partNumber, end - start);
            reportProgress();
            persist();
          } catch (err) {
            if (err instanceof UploadError && err.code === "invalid-upload-id") {
              // The whole session is dead server-side (e.g. B2 auto-aborted
              // an old incomplete upload) — no point resuming it later.
              clearSession(file);
            }
            throw err;
          }
        });

        if (ctx.cancelled) {
          throw new UploadError("cancelled", "Upload cancelled.");
        }

        completedParts = Array.from(completedMap.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([PartNumber, ETag]) => ({ PartNumber, ETag }));
      }

      let result: { shareUrl: string; fileName: string };
      try {
        result = await completeUpload({
          mode,
          storedName,
          shortCode,
          originalName: file.name,
          mimeType,
          uploadId,
          parts: mode === "multipart" ? completedParts : undefined,
          expiresIn: options.expiresIn,
          password: options.password,
        });
      } catch (err) {
        throw err instanceof UploadError
          ? new UploadError("completion-failed", err.message)
          : new UploadError("completion-failed", "Failed to finalize the upload.");
      }

      clearSession(file);
      return result;
    } catch (err) {
      if (ctx.cancelled && mode === "multipart" && uploadId) {
        await abortUpload(storedName, uploadId);
        clearSession(file);
      }
      throw err;
    }
  })();

  return { promise, cancel };
}
