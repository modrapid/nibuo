export type UploadStatus = "queued" | "uploading" | "success" | "error";

export interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  shareUrl?: string;
  error?: string;
}
