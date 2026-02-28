import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

// ── Types ─────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ── API calls ─────────────────────────────────────────

export const getNotifications = async (
  page = 1,
  limit = 20,
  unreadOnly = false,
): Promise<NotificationsResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (unreadOnly) params.set('unreadOnly', 'true');

  const { data } = await api.get(
    `${API_ENDPOINTS.NOTIFICATIONS.LIST}?${params.toString()}`,
  );
  return data.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const { data } = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
  return data.data.unreadCount;
};

export const markAsRead = async (id: string): Promise<void> => {
  await api.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
};

export const markAllAsRead = async (): Promise<void> => {
  await api.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
};
