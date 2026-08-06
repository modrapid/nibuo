export type UploadStatus =
  | "queued"
  | "uploading"
  | "success"
  | "error"
  | "cancelled";

export type UploadErrorCode =
  | "network"
  | "timeout"
  | "signature"
  | "expired-url"
  | "invalid-upload-id"
  | "missing-etag"
  | "b2-rejection"
  | "completion-failed"
  | "cancelled"
  | "validation"
  | "unknown";

export interface UploadSettings {
  expiresIn?: "1d" | "3d" | "7d" | "14d";
  password?: string;
}

export interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  /** 0-100, derived from total bytes uploaded (not just completed parts). */
  progress: number;
  bytesUploaded: number;
  totalBytes: number;
  shareUrl?: string;
  error?: string;
  errorCode?: UploadErrorCode;
}
