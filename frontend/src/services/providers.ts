import api from './api';

export interface ProviderCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
}

export interface ProviderProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  rating: number;
  reviewCount: number;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  category: ProviderCategory;
  portfolio: PortfolioItem[];
}

export interface OwnProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  profile: {
    id: string;
    description: string | null;
    rating: number;
    reviewCount: number;
    latitude: number | null;
    longitude: number | null;
    city: string | null;
    state: string | null;
    categoryId: string | null;
    categoryName: string | null;
    categorySlug: string | null;
    categoryIcon: string | null;
    experienceYears: number;
    serviceRadiusKm: number;
    address: string;
  } | null;
  portfolio: PortfolioItem[];
}

export const providerService = {
  /** Get public provider profile by user ID */
  async getProviderProfile(userId: string): Promise<ProviderProfile> {
    const { data } = await api.get<ProviderProfile>(`/api/providers/${userId}`);
    return data;
  },

  /** Get own profile for editing */
  async getOwnProfile(): Promise<OwnProfile> {
    const { data } = await api.get<OwnProfile>('/api/providers/profile/mine');
    return data;
  },

  /** Update own profile */
  async updateProfile(profileData: {
    name?: string;
    phone?: string;
    avatarUrl?: string;
    description?: string;
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<{ message: string; user: { id: string; name: string; email: string | null; phone: string | null; avatarUrl: string | null; role: string } }> {
    const { data } = await api.put('/api/providers/profile', profileData);
    return data;
  },

  /** Add portfolio image */
  async addPortfolioImage(imageUrl: string, caption?: string): Promise<{ message: string; portfolioItem: { id: string; imageUrl: string; caption: string | null } }> {
    const { data } = await api.post('/api/providers/portfolio', { imageUrl, caption });
    return data;
  },

  /** Remove portfolio image */
  async removePortfolioImage(id: string): Promise<void> {
    await api.delete(`/api/providers/portfolio/${id}`);
  },
};
