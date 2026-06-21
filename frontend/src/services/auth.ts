import api from './api';

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: 'client' | 'provider' | 'admin';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  /** Login with Google ID token */
  async loginWithGoogle(credential: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/google', { credential });
    return data;
  },

  /** Get Google OAuth URL */
  async getGoogleAuthUrl(): Promise<string> {
    const { data } = await api.get<{ url: string }>('/api/auth/google/url');
    return data.url;
  },

  /** Send OTP to phone */
  async sendOTP(phone: string): Promise<{ message: string; expiresAt: string }> {
    const { data } = await api.post('/api/auth/otp/send', { phone });
    return data;
  },

  /** Verify OTP and login */
  async verifyOTP(phone: string, code: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/otp/verify', { phone, code });
    return data;
  },

  /** Refresh access token */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const { data } = await api.post('/api/auth/refresh', { refreshToken });
    return data;
  },

  /** Logout */
  async logout(allDevices = false): Promise<void> {
    await api.post('/api/auth/logout', { all: allDevices });
  },

  /** Get current user */
  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/api/auth/me');
    return data;
  },
};
