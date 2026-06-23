import api from './api';

export interface ProviderCategory {
  id: string; name: string; slug: string; icon: string;
}
export interface PortfolioItem {
  id: string; imageUrl: string; caption: string | null; sortOrder: number;
}
export interface ProviderProfile {
  id: string; name: string; avatarUrl: string | null; phone: string | null;
  email: string | null; description: string | null; rating: number; reviewCount: number;
  latitude: number | null; longitude: number | null; city: string | null; state: string | null;
  category: ProviderCategory; portfolio: PortfolioItem[];
}
export interface OwnProfile {
  id: string; name: string; email: string | null; phone: string | null;
  avatarUrl: string | null; role: string;
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
export interface ReviewItem {
  id: string; rating: number; comment: string | null; createdAt: string;
  client: { id: string; name: string; avatarUrl: string | null };
}
export interface ReviewResponse { id: string; rating: number; comment: string | null; createdAt: string }

export const providerService = {
  async getProviderProfile(userId: string): Promise<ProviderProfile> {
    const { data } = await api.get<ProviderProfile>(`/api/providers/${userId}`);
    return data;
  },
  async getOwnProfile(): Promise<OwnProfile> {
    const { data } = await api.get<OwnProfile>('/api/providers/profile/mine');
    return data;
  },
  async updateProfile(profileData: {
    name?: string; phone?: string; avatarUrl?: string; description?: string;
    city?: string; state?: string; latitude?: number; longitude?: number;
  }): Promise<{ message: string; user: { id: string; name: string; email: string | null; phone: string | null; avatarUrl: string | null; role: string } }> {
    const { data } = await api.put('/api/providers/profile', profileData);
    return data;
  },
  async addPortfolioImage(imageUrl: string, caption?: string): Promise<{ message: string; portfolioItem: { id: string; imageUrl: string; caption: string | null } }> {
    const { data } = await api.post('/api/providers/portfolio', { imageUrl, caption });
    return data;
  },
  async removePortfolioImage(id: string): Promise<void> {
    await api.delete(`/api/providers/portfolio/${id}`);
  },

  // ── Reviews (issue #17) ──
  async getReviews(providerId: string): Promise<ReviewItem[]> {
    const { data } = await api.get<ReviewItem[]>(`/api/providers/${providerId}/reviews`);
    return data;
  },
  async submitReview(providerId: string, payload: { rating: number; comment?: string; contactId?: string }): Promise<ReviewResponse> {
    const { data } = await api.post<ReviewResponse>(`/api/providers/${providerId}/reviews`, payload);
    return data;
  },

  // ── Reports (issue #18) ──
  async submitReport(providerId: string, payload: { reason: string; description?: string }): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(`/api/providers/${providerId}/report`, payload);
    return data;
  },
};
