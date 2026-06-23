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

export interface OpenRequest {
  id: string;
  title: string;
  description: string | null;
  urgency: 'Alta' | 'Media' | 'Baixa';
  status: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  createdAt: string;
  interestCount: number;
  client: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  category: {
    name: string;
    slug: string;
    icon: string;
  } | null;
}

export interface OpenRequestsResponse {
  results: OpenRequest[];
  filters: {
    lat: number | null;
    lng: number | null;
    radius_km: number | null;
    category_id: string | null;
    page: number;
    limit: number;
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

  async getOpenRequests(params: {
    lat?: number;
    lng?: number;
    radius?: number;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<OpenRequestsResponse> {
    const { data } = await api.get<OpenRequestsResponse>('/api/requests/open', { params });
    return data;
  },
};
