import api from './api';

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  deleted_at: string | null;
  provider_count: number;
}

export interface AdminStats {
  totalClients: number;
  totalProviders: number;
  totalRequests: number;
  totalContacts: number;
  contactsByDay: { date: string; count: number }[];
  topCategories: { name: string; icon: string; count: number }[];
  conversionRate: { total: number; withInterest: number; rate: number };
}

export const adminService = {
  async getCategories(): Promise<AdminCategory[]> {
    const { data } = await api.get('/api/admin/categories');
    return data;
  },

  async createCategory(name: string, slug: string, icon: string): Promise<AdminCategory> {
    const { data } = await api.post('/api/admin/categories', { name, slug, icon });
    return data;
  },

  async updateCategory(id: string, updates: { name?: string; slug?: string; icon?: string }): Promise<AdminCategory> {
    const { data } = await api.put(`/api/admin/categories/${id}`, updates);
    return data;
  },

  async deleteCategory(id: string): Promise<{ message: string }> {
    const { data } = await api.delete(`/api/admin/categories/${id}`);
    return data;
  },

  async getStats(periodDays: number = 30): Promise<AdminStats> {
    const { data } = await api.get('/api/admin/stats', { params: { period: periodDays } });
    return data;
  },
};
