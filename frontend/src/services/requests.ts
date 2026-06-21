import api from './api';

export interface ServiceRequest {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  city: string | null;
  state: string | null;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  client?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface InterestedProvider {
  interestId: string;
  interestDate: string;
  provider: {
    id: string;
    name: string;
    avatarUrl: string | null;
    description: string | null;
    rating: number;
    reviewCount: number;
    latitude: number | null;
    longitude: number | null;
    city: string | null;
    state: string | null;
    category: {
      name: string;
      icon: string;
    } | null;
  };
}

export interface InterestResponse {
  request: ServiceRequest;
  interests: InterestedProvider[];
}

export const requestService = {
  async expressInterest(requestId: string): Promise<{ message: string; interestId: string }> {
    const { data } = await api.post(`/api/requests/${requestId}/interest`);
    return data;
  },

  async getInterests(requestId: string): Promise<InterestResponse> {
    const { data } = await api.get(`/api/requests/${requestId}/interests`);
    return data;
  },
};
