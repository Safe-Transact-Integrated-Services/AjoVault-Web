import type { Notification } from '@/types';
import { apiRequest } from '@/lib/api/http';

interface NotificationItemResponse {
  notificationId: string;
  type: Notification['type'];
  category: NonNullable<Notification['category']>;
  title: string;
  message: string;
  isRead: boolean;
  createdAtUtc: string;
  link?: string | null;
}

interface NotificationsResponse {
  unreadCount: number;
  items: NotificationItemResponse[];
}

export interface NotificationsFeed {
  unreadCount: number;
  items: Notification[];
}

export const notificationKeys = {
  all: ['notifications'] as const,
  feed: ['notifications', 'feed'] as const,
};

const mapNotification = (item: NotificationItemResponse): Notification => ({
  id: item.notificationId,
  type: item.type,
  category: item.category,
  title: item.title,
  message: item.message,
  read: item.isRead,
  date: item.createdAtUtc,
  link: item.link ?? undefined,
});

export const getMyNotifications = async (): Promise<NotificationsFeed> => {
  const response = await apiRequest<NotificationsResponse>('/api/notifications/me');
  return {
    unreadCount: response.unreadCount,
    items: response.items.map(mapNotification),
  };
};

export const markNotificationRead = async (notificationId: string) => {
  await apiRequest<void>(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'POST',
  });
};

export const markAllNotificationsRead = async () => {
  await apiRequest<void>('/api/notifications/me/read-all', {
    method: 'POST',
  });
};
