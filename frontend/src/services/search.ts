import api from './api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface Provider {
  id: string;
  name: string;
  avatarUrl: string | null;
  description: string | null;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  serviceRadiusKm: number;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  distanceKm?: number;
  score?: number;
  category: Category;
}

export interface SearchResponse {
  results: Provider[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
  filters: {
    category_id: string | null;
    lat: number | null;
    lng: number | null;
    radius_km: number | null;
  };
}

export const searchService = {
  async getCategories(): Promise<Category[]> {
    const { data } = await api.get<Category[]>('/api/categories');
    return data;
  },

  async searchProviders(params: {
    category_id?: string;
    lat?: number;
    lng?: number;
    radius_km?: number;
    query?: string;
    limit?: number;
    offset?: number;
  }): Promise<SearchResponse> {
    const { data } = await api.get<SearchResponse>('/api/providers/search', { params });
    return data;
  },
};
