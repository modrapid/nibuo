export interface DashboardLink {
  id: string;
  short_code: string;
  original_url: string;
  clicks: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface DashboardStats {
  links: DashboardLink[];
  totalClicks: number;
  totalLinks: number;
  activeLinks: number;
}
