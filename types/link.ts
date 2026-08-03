export interface ShortLink {
  id: string;
  slug: string;
  original_url: string;
  clicks: number;
  created_at: string;
  expires_at?: string | null;
  user_id?: string;
  is_active?: boolean;
}
