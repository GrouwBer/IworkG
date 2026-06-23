import api from './api';

export interface ServiceRequest {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  category: { name: string; icon: string } | null;
  urgency: string;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  address: string | null;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  interestCount: number;
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

// ── Helper: transform snake_case from backend to camelCase ──
function toCamelCase(r: any): ServiceRequest {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    categoryId: r.categoryId ?? r.category_id ?? null,
    category: r.category || (r.category_name ? { name: r.category_name, icon: r.category_icon } : null),
    urgency: r.urgency,
    photoUrl: r.photoUrl ?? r.photo_url ?? null,
    latitude: r.latitude,
    longitude: r.longitude,
    city: r.city,
    state: r.state,
    address: r.address,
    status: r.status,
    interestCount: r.interestCount ?? r.interest_count ?? 0,
    createdAt: r.createdAt ?? r.created_at,
    client: r.client ? r.client : (r.client_id ? { id: r.client_id, name: r.client_name, avatarUrl: r.client_avatar } : undefined),
  };
}

export const requestService = {
  // ── Issue #13: Mural de Pedidos ──

  async createRequest(data: CreateRequestData): Promise<{ id: string; message: string }> {
    const { data: response } = await api.post('/api/requests', data);
    return response;
  },

  async listRequests(params?: ListRequestsParams): Promise<{ requests: ServiceRequest[]; total?: number; hasMore?: boolean }> {
    const { data } = await api.get('/api/requests', { params });
    return {
      requests: (data.requests || []).map(toCamelCase),
      total: data.total,
      hasMore: data.hasMore,
    };
  },

  async getMyRequests(): Promise<{ requests: ServiceRequest[] }> {
    const { data } = await api.get('/api/requests/mine');
    return {
      requests: (data.requests || []).map(toCamelCase),
    };
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
