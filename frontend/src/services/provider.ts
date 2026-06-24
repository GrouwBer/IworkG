import api from './api';

export interface Category { id: string; name: string; slug: string; icon: string }
export interface WizardState { currentStep: number; stepData: Record<string, any>; prefill: { name: string; phone: string; email: string }; categories: Category[] }
export interface ProviderProfile { id: string; description: string; experienceYears: number; serviceRadiusKm: number; address: string; city: string; state: string; rating: number; reviewCount: number; active: boolean; categories: Category[]; createdAt: string }
export interface PortfolioPhoto { id: string; tag: string; mimeType: string; sizeBytes: number; originalName: string; url: string; createdAt: string; sortOrder: number }
export interface PortfolioResponse { providerId: string; photos: PortfolioPhoto[] }

export const providerService = {
  // Wizard
  async getWizard(): Promise<WizardState> { const { data } = await api.get('/api/provider/wizard'); return data; },
  async saveWizard(step: number, data: Record<string, any>) { const { data: res } = await api.put('/api/provider/wizard', { step, data }); return res; },
  async completeWizard(p: { categories: string[]; description: string; experience_years: number; service_radius_km: number; address: string; city: string; state: string }) { const { data } = await api.post('/api/provider/wizard/complete', p); return data; },
  // Profile
  async getMyProfile(): Promise<ProviderProfile> { const { data } = await api.get('/api/providers/me'); return data; },
  // Portfolio
  async uploadPhoto(file: File, tag: string): Promise<PortfolioPhoto> { const fd = new FormData(); fd.append('photo', file); const { data } = await api.post(`/api/providers/portfolio/upload?tag=${encodeURIComponent(tag)}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); return data; },
  async getMyPortfolio(): Promise<PortfolioResponse> { const { data } = await api.get('/api/providers/me/portfolio'); return data; },
  async getPortfolio(providerId: string): Promise<PortfolioResponse> { const { data } = await api.get(`/api/providers/${providerId}/portfolio`); return data; },
  async deletePhoto(photoId: string): Promise<void> { await api.delete(`/api/providers/portfolio/${photoId}`); },
};
