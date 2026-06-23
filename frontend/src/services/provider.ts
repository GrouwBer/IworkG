import api from './api';

export interface ProviderProfile {
  id: string;
  userId: string;
  categoryId: string;
  description: string | null;
  rating: number;
  reviewCount: number;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StatusResponse {
  active: boolean;
  message: string;
}

export const providerService = {
  /** Obtém o perfil do prestador logado */
  async getMyProfile(): Promise<ProviderProfile> {
    const { data } = await api.get<ProviderProfile>('/api/providers/me');
    return data;
  },

  /** Alterna o status de disponibilidade (toggle) */
  async toggleStatus(): Promise<StatusResponse> {
    const { data } = await api.patch<StatusResponse>('/api/providers/me/status');
    return data;
  },

  /** Define o status de disponibilidade diretamente */
  async setStatus(active: boolean): Promise<StatusResponse> {
    const { data } = await api.patch<StatusResponse>('/api/providers/me/status', { active });
    return data;
  },
};
