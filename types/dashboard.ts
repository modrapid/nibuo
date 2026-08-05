export interface DashboardFile {
  id: string;
  short_code: string;
  original_name: string;
  stored_name: string;
  mime_type: string;
  size_bytes: number;
  views: number;
  downloads: number;
  copies: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface DashboardStats {
  files: DashboardFile[];
  totalFiles: number;
  totalDownloads: number;
  totalViews: number;
  activeFiles: number;
  totalStorageBytes: number;
}
