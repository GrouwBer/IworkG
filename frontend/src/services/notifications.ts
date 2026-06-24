import api from './api';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, any> | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

export interface NotificationPreferences {
  new_requests: number;
  interests: number;
  reviews: number;
  promotions: number;
}

export const notificationService = {
  async getNotifications(): Promise<NotificationsResponse> {
    const { data } = await api.get<NotificationsResponse>('/api/notifications');
    return data;
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/api/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/api/notifications/read-all');
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const { data } = await api.get<NotificationPreferences>('/api/notifications/preferences');
    return data;
  },

  async updatePreferences(prefs: Partial<NotificationPreferences>): Promise<void> {
    await api.put('/api/notifications/preferences', prefs);
  },
};
