import { createHash } from "crypto";
import { authorizeB2, getUploadUrl } from "./b2Client";

interface UploadResult {
  fileId: string;
  fileName: string;
  downloadUrl: string;
  size: number;
}

interface StorageService {
  upload(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult>;
  delete(fileName: string): Promise<void>;
  getDownloadUrl(fileName: string): string;
}

class BackblazeStorageService implements StorageService {
  async upload(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
    const auth = await authorizeB2();
    const uploadInfo = await getUploadUrl(auth);

    const sha1 = createHash("sha1").update(buffer).digest("hex");

    const res = await fetch(uploadInfo.uploadUrl, {
      method: "POST",
      headers: {
        Authorization: uploadInfo.authorizationToken,
        "X-Bz-File-Name": encodeURIComponent(fileName),
        "Content-Type": mimeType,
        "Content-Length": buffer.length.toString(),
        "X-Bz-Content-Sha1": sha1,
      },
      body: buffer,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Backblaze upload failed: ${errText}`);
    }

    const data = await res.json();

    return {
      fileId: data.fileId,
      fileName: data.fileName,
      downloadUrl: this.getDownloadUrl(fileName),
      size: buffer.length,
    };
  }

  async delete(fileName: string): Promise<void> {
    const auth = await authorizeB2();

    // First, get the fileId (B2 requires fileId + fileName to delete)
    const listRes = await fetch(`${auth.apiUrl}/b2api/v3/b2_list_file_names`, {
      method: "POST",
      headers: {
        Authorization: auth.authorizationToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bucketId: auth.allowed.bucketId,
        startFileName: fileName,
        maxFileCount: 1,
      }),
    });

    const listData = await listRes.json();
    const file = listData.files?.[0];

    if (!file || file.fileName !== fileName) {
      return; // File not found, nothing to delete
    }

    await fetch(`${auth.apiUrl}/b2api/v3/b2_delete_file_version`, {
      method: "POST",
      headers: {
        Authorization: auth.authorizationToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.fileName,
        fileId: file.fileId,
      }),
    });
  }

  getDownloadUrl(fileName: string): string {
    const bucketName = process.env.B2_BUCKET_NAME!;
    return `https://f000.backblazeb2.com/file/${bucketName}/${encodeURIComponent(fileName)}`;
  }
}

// Singleton instance — reusable and future ready (swap implementation without touching callers)
export const storageService: StorageService = new BackblazeStorageService();
export type { StorageService, UploadResult };
