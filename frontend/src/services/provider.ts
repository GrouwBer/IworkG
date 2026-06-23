import api from './api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface WizardState {
  currentStep: number;
  stepData: Record<string, any>;
  prefill: { name: string; phone: string; email: string };
  categories: Category[];
}

export interface ProviderProfile {
  id: string;
  categoryId: string;
  description: string;
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
  createdAt: string;
}

export const providerService = {
  async getWizard(): Promise<WizardState> {
    const { data } = await api.get<WizardState>('/api/providers/wizard');
    return data;
  },
  async saveWizard(step: number, data: Record<string, any>) {
    const { data: res } = await api.put('/api/providers/wizard', { step, data });
    return res;
  },
  async completeWizard(payload: {
    category_id: string;
    description: string;
    city: string;
    state: string;
  }) {
    const { data } = await api.post('/api/providers/wizard/complete', payload);
    return data;
  },
  async getMyProfile(): Promise<ProviderProfile> {
    const { data } = await api.get<ProviderProfile>('/api/providers/me');
    return data;
  },
};
