export interface ShortLink {
  id: string;
  shortCode: string;
  originalUrl: string;
  clicks: number;
  createdAt?: string;
  expiresAt?: string | null;
  userId?: string;
  isActive?: boolean;
}
