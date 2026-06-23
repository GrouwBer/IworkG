// ── Auth (existing) ──

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  google_id: string | null;
  role: 'client' | 'provider' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface TokenPayload {
  sub: string;
  role: string;
  jti: string;
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface OTPRequest {
  phone: string;
}

export interface OTPVerify {
  phone: string;
  code: string;
}

export interface GoogleUserInfo {
  googleId: string;
  name: string;
  email: string;
  avatarUrl: string;
}

// ── Categories ──

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  created_at: string;
}

// ── Provider ──

export interface ProviderProfile {
  id: string;
  user_id: string;
  description: string | null;
  experience_years: number;
  service_radius_km: number;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  review_count: number;
  active: number; // SQLite INTEGER: 0 ou 1
  created_at: string;
  updated_at: string;
  // joined fields
  name?: string;
  avatar_url?: string;
  phone?: string;
  categories?: Category[];
}

// ── Provider ↔ Category (N:M) ──

export interface ProviderCategory {
  provider_id: string;
  category_id: string;
}

// ── Reviews ──

export interface Review {
  id: string;
  reviewer_id: string;
  provider_id: string;
  rating: number; // 1-5
  comment: string | null;
  response: string | null;
  created_at: string;
  // joined
  reviewer_name?: string;
}

// ── Service Requests ──

export type UrgencyLevel = 'baixa' | 'media' | 'alta';
export type RequestStatus = 'aberto' | 'em_andamento' | 'concluido' | 'cancelado';

export interface ServiceRequest {
  id: string;
  client_id: string;
  category_id: string;
  description: string;
  photo_url: string | null;
  urgency: UrgencyLevel;
  status: RequestStatus;
  latitude: number;
  longitude: number;
  created_at: string;
  // joined
  category_name?: string;
  category_icon?: string;
  client_name?: string;
  interest_count?: number;
}

export interface Interest {
  id: string;
  service_request_id: string;
  provider_id: string;
  created_at: string;
  // joined
  provider_name?: string;
}

// ── Reports ──

export type ReportReason = 'perfil_falso' | 'comportamento_inadequado' | 'golpe' | 'outro';
export type ReportStatus = 'pendente' | 'analisada' | 'resolvida';

export interface Report {
  id: string;
  reporter_id: string;
  reported_provider_id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  created_at: string;
}

// ── Portfolio ──

export type PhotoTag = 'Antes' | 'Depois' | 'Geral';

export interface PortfolioPhoto {
  id: string;
  provider_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  tag: PhotoTag;
  sort_order: number;
  created_at: string;
}

// ── Favorites ──

export interface Favorite {
  user_id: string;
  provider_id: string;
}

// ── Contact History ──

export interface ContactHistory {
  id: string;
  user_id: string;
  provider_id: string;
  created_at: string;
  // joined
  provider_name?: string;
  provider_category?: string;
}

// ── Search (existing + enhanced) ──

export interface SearchFilters {
  category_id?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  query?: string;
  limit?: number;
  offset?: number;
}

export interface ProviderSearchResult {
  id: string;
  name: string;
  avatar_url: string | null;
  description: string | null;
  rating: number;
  review_count: number;
  experience_years: number;
  service_radius_km: number;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  category_name: string;
  category_slug: string;
  category_icon: string;
  distance_km?: number;
  score?: number;
}

// ── Express augmentation ──

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        jti: string;
      };
    }
  }
}
