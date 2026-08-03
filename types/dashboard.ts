export interface DashboardLink {
  id: string;
  short_code: string;
  original_name: string;
  original_url: string;
  downloads: number;
  views: number;
  clicks: number;
  expires_at: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalLinks: number;
  totalClicks: number;
  activeLinks: number;
  links: DashboardLink[];
}
