import type {
  NotificationsListResponse,
  UnreadCountResponse,
} from '@/types/notifications';
import { apiClient } from './client';

export const notifications = {
  list: (params?: { limit?: number; cursor?: string }) =>
    apiClient.get<NotificationsListResponse>('/notifications', {
      limit: params?.limit,
      cursor: params?.cursor,
    }),

  unreadCount: () =>
    apiClient.get<UnreadCountResponse>('/notifications/unread-count'),

  markRead: (id: string) =>
    apiClient.patch<{ ok: boolean }>(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.patch<{ updated: number }>('/notifications/read-all'),
};
