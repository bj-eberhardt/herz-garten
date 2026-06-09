import { defineStore } from 'pinia';
import { apiRequest } from '@/services/api';
import type { NotificationItem } from '@/types/domain';

interface NotificationPayload {
  notifications: NotificationItem[];
  unreadCount: number;
}

function routeForNotification(notification: NotificationItem) {
  if (notification.sourceType === 'today') return '/today';
  if (notification.sourceType === 'quest') return '/quests';
  if (notification.sourceType === 'love_jar') return '/love-jar';
  if (notification.sourceType === 'memory') return '/memories';
  return '/garden';
}

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: [] as NotificationItem[],
    unreadCount: 0,
    loading: false,
    error: '',
  }),
  getters: {
    unreadNotifications: (state) => state.notifications.filter((notification) => !notification.readAt),
  },
  actions: {
    applyPayload(payload: NotificationPayload) {
      this.notifications = payload.notifications;
      this.unreadCount = payload.unreadCount;
    },
    async loadNotifications() {
      this.loading = true;
      this.error = '';
      try {
        this.applyPayload(await apiRequest<NotificationPayload>('/api/notifications'));
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Benachrichtigungen konnten nicht geladen werden';
      } finally {
        this.loading = false;
      }
    },
    async markRead(notificationId: string) {
      this.applyPayload(
        await apiRequest<NotificationPayload>(`/api/notifications/${notificationId}/read`, {
          method: 'POST',
        }),
      );
    },
    async markAllRead() {
      this.applyPayload(
        await apiRequest<NotificationPayload>('/api/notifications/read-all', {
          method: 'POST',
        }),
      );
    },
    targetRoute(notification: NotificationItem) {
      return routeForNotification(notification);
    },
  },
});
