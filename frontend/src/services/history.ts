import api from './api';

export interface FavoriteItem {
  favoriteId: string;
  createdAt: string;
  provider: {
    id: string;
    name: string;
    avatarUrl: string | null;
    description: string | null;
    rating: number;
    reviewCount: number;
    city: string | null;
    state: string | null;
    category: { name: string; icon: string } | null;
  };
}

export interface ContactItem {
  contactId: string;
  contactType: string;
  contactDate: string;
  provider: {
    id: string;
    name: string;
    avatarUrl: string | null;
    description: string | null;
    rating: number;
    reviewCount: number;
    city: string | null;
    state: string | null;
    category: { name: string; icon: string } | null;
  };
}

export const favoritesService = {
  async getFavorites(): Promise<FavoriteItem[]> {
    const { data } = await api.get('/api/favorites');
    return data;
  },

  async toggleFavorite(providerId: string): Promise<{ favorited: boolean; message: string }> {
    const { data } = await api.post(`/api/favorites/${providerId}`);
    return data;
  },

  async checkFavorite(providerId: string): Promise<boolean> {
    const { data } = await api.get(`/api/favorites/check/${providerId}`);
    return data.favorited;
  },
};

export const contactsService = {
  async getContacts(): Promise<ContactItem[]> {
    const { data } = await api.get('/api/contacts');
    return data;
  },

  async recordContact(providerId: string, contactType = 'direct'): Promise<void> {
    await api.post('/api/contacts', { provider_id: providerId, contact_type: contactType });
  },
};
