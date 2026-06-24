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

  // ── Reports & Bans (issue #19) ──

  async getReports(): Promise<any[]> {
    const { data } = await api.get('/api/admin/reports');
    return data;
  },

  async getReport(id: string): Promise<any> {
    const { data } = await api.get(`/api/admin/reports/${id}`);
    return data;
  },

  async resolveReport(id: string, body: { action: string; justification?: string }): Promise<any> {
    const { data } = await api.post(`/api/admin/reports/${id}/resolve`, body);
    return data;
  },

  async banUser(userId: string, reason: string): Promise<any> {
    const { data } = await api.post(`/api/admin/users/${userId}/ban`, { reason });
    return data;
  },

  async unbanUser(userId: string): Promise<any> {
    const { data } = await api.post(`/api/admin/users/${userId}/unban`);
    return data;
  },

  async getBans(): Promise<any[]> {
    const { data } = await api.get('/api/admin/bans');
    return data;
  },
};
