interface UploadOptions {
  expiresIn?: "1d" | "3d" | "7d" | "14d";
  password?: string;
  onProgress?: (percent: number) => void;
}

interface UploadResponse {
  shareUrl: string;
  fileName: string;
  size: number;
}

function putToSignedUrl(uploadUrl: string, file: File, onProgress?: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error("Upload to storage failed. Please try again."));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(file);
  });
}

export async function uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResponse> {
  // Step 1: ask our server for a presigned upload URL + reserved short code
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

  // Step 2: upload the file bytes directly to storage — no server-side size limit
  await putToSignedUrl(initData.uploadUrl, file, options.onProgress);

  // Step 3: confirm completion and create the database record
  const completeRes = await fetch("/api/upload/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      storedName: initData.storedName,
      shortCode: initData.shortCode,
      originalName: file.name,
      mimeType: file.type,
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
