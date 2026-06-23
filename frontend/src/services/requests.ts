import api from './api';

export interface ServiceRequest {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  categoryId: string | null;
  category: { name: string; icon: string } | null;
  urgency: string;
  photoUrl: string | null;
  photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  address: string | null;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  interestCount: number;
  interest_count: number;
  created_at: string;
  createdAt: string;
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

export interface CreateRequestData {
  title: string;
  description?: string;
  category_id: string;
  urgency?: string;
  photo_url?: string;
  lat?: number;
  lng?: number;
  city?: string;
  state?: string;
  address?: string;
}

export interface ListRequestsParams {
  category_id?: string;
  lat?: number;
  lng?: number;
  limit?: number;
  offset?: number;
}

export const requestService = {
  // ── Issue #13: Mural de Pedidos ──

  async createRequest(data: CreateRequestData): Promise<{ id: string; message: string }> {
    const { data: response } = await api.post('/api/requests', data);
    return response;
  },

  async listRequests(params?: ListRequestsParams): Promise<{ requests: ServiceRequest[] }> {
    const { data } = await api.get('/api/requests', { params });
    return data;
  },

  async getMyRequests(): Promise<{ requests: ServiceRequest[] }> {
    const { data } = await api.get('/api/requests/mine');
    return data;
  },

  async updateRequest(id: string, data: { status: string }): Promise<{ message: string; status: string }> {
    const { data: response } = await api.patch(`/api/requests/${id}`, data);
    return response;
  },

  // ── Existing: Interest ──

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
