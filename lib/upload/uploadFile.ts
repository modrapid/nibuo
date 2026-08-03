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

export function uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    if (options.expiresIn) formData.append("expiresIn", options.expiresIn);
    if (options.password) formData.append("password", options.password);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options.onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        options.onProgress(percent);
      }
    };

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(response.data);
        } else {
          reject(new Error(response.error ?? "Upload failed."));
        }
      } catch {
        reject(new Error("Unexpected server response."));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));

    xhr.send(formData);
  });
}
