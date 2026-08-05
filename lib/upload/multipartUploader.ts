interface UploadOptions {
  expiresIn?: "1d" | "3d" | "7d" | "14d";
  password?: string;
  onProgress?: (percent: number) => void;
}

interface UploadResponse {
  shareUrl: string;
  fileName: string;
}

interface ResumeState {
  storedName: string;
  shortCode: string;
  uploadId: string;
  partSize: number;
  partCount: number;
  completedParts: { PartNumber: number; ETag: string }[];
}

const MAX_RETRIES = 3;
const MAX_CONCURRENT_PARTS = 4;

function resumeKey(file: File): string {
  return `nibuo_resume_${file.name}_${file.size}_${file.lastModified}`;
}

function saveResumeState(file: File, state: ResumeState) {
  try {
    sessionStorage.setItem(resumeKey(file), JSON.stringify(state));
  } catch {
    // Storage full or unavailable — resumability degrades gracefully to a fresh upload next time.
  }
}

function loadResumeState(file: File): ResumeState | null {
  try {
    const raw = sessionStorage.getItem(resumeKey(file));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearResumeState(file: File) {
  try {
    sessionStorage.removeItem(resumeKey(file));
  } catch {
    /* noop */
  }
}

async function uploadPartWithRetry(
  url: string,
  chunk: Blob,
  attempt = 1
): Promise<string> {
  try {
    const res = await fetch(url, { method: "PUT", body: chunk });
    if (!res.ok) throw new Error(`Part upload failed with status ${res.status}`);
    const etag = res.headers.get("ETag");
    if (!etag) throw new Error("Missing ETag in part upload response.");
    return etag;
  } catch (err) {
    if (attempt >= MAX_RETRIES) throw err;
    await new Promise((r) => setTimeout(r, 500 * attempt));
    return uploadPartWithRetry(url, chunk, attempt + 1);
  }
}

async function putSingleShot(uploadUrl: string, file: File, onProgress?: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed.")));
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(file);
  });
}

export async function uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResponse> {
  const initRes = await fetch("/api/upload/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name, mimeType: file.type, size: file.size }),
  });

  if (!initRes.ok) {
    const data = await initRes.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to start upload.");
  }
  const { data: initData } = await initRes.json();

  if (initData.mode === "single") {
    await putSingleShot(initData.uploadUrl, file, options.onProgress);
    return finalize(initData.storedName, initData.shortCode, "single", file, options);
  }

  // --- Multipart path ---
  const resumed = loadResumeState(file);
  const useResume =
    resumed && resumed.partSize === initData.partSize && resumed.partCount === initData.partCount;

  const storedName = useResume ? resumed!.storedName : initData.storedName;
  const uploadId = useResume ? resumed!.uploadId : initData.uploadId;
  const partSize: number = initData.partSize;
  const partCount: number = initData.partCount;
  const completedParts: { PartNumber: number; ETag: string }[] = useResume ? resumed!.completedParts : [];
  const completedSet = new Set(completedParts.map((p) => p.PartNumber));

  const pending = Array.from({ length: partCount }, (_, i) => i + 1).filter(
    (n) => !completedSet.has(n)
  );

  let uploadedBytes = completedParts.length * partSize;
  const totalBytes = file.size;
  const reportProgress = () => {
    if (options.onProgress) {
      options.onProgress(Math.min(99, Math.round((uploadedBytes / totalBytes) * 100)));
    }
  };
  reportProgress();

  async function uploadOnePart(partNumber: number) {
    const start = (partNumber - 1) * partSize;
    const end = Math.min(start + partSize, file.size);
    const chunk = file.slice(start, end);

    const signRes = await fetch("/api/upload/sign-part", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storedName, uploadId, partNumber }),
    });
    if (!signRes.ok) throw new Error(`Failed to sign part ${partNumber}.`);
    const { data: signData } = await signRes.json();

    const etag = await uploadPartWithRetry(signData.url, chunk);
    completedParts.push({ PartNumber: partNumber, ETag: etag });
    uploadedBytes += chunk.size;
    reportProgress();

    saveResumeState(file, { storedName, shortCode: initData.shortCode ?? resumed?.shortCode, uploadId, partSize, partCount, completedParts });
  }

  // Upload parts with limited concurrency so we don't overwhelm the connection.
  let cursor = 0;
  async function worker() {
    while (cursor < pending.length) {
      const partNumber = pending[cursor++];
      await uploadOnePart(partNumber);
    }
  }
  const workers = Array.from({ length: Math.min(MAX_CONCURRENT_PARTS, pending.length) }, worker);

  try {
    await Promise.all(workers);
  } catch (err) {
    // Resume state remains saved — next call to uploadFile() with the same file will pick up where it left off.
    throw err instanceof Error ? err : new Error("Upload interrupted. You can retry to resume.");
  }

  completedParts.sort((a, b) => a.PartNumber - b.PartNumber);

  const result = await finalize(
    storedName,
    useResume ? resumed!.shortCode : initData.shortCode,
    "multipart",
    file,
    options,
    uploadId,
    completedParts
  );

  clearResumeState(file);
  if (options.onProgress) options.onProgress(100);
  return result;
}

async function finalize(
  storedName: string,
  shortCode: string,
  mode: "single" | "multipart",
  file: File,
  options: UploadOptions,
  uploadId?: string,
  parts?: { PartNumber: number; ETag: string }[]
): Promise<UploadResponse> {
  const completeRes = await fetch("/api/upload/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode,
      storedName,
      shortCode,
      originalName: file.name,
      mimeType: file.type,
      uploadId,
      parts,
      expiresIn: options.expiresIn,
      password: options.password,
    }),
  });

  if (!completeRes.ok) {
    const data = await completeRes.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to save file record.");
  }

  const { data } = await completeRes.json();
  return data;
}
