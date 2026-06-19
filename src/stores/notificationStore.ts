import { defineStore } from 'pinia';
import type { RouteLocationRaw } from 'vue-router';
import { apiRequest } from '@/services/api';
import { localizeApiError } from '@/services/errorMessages';
import type { NotificationDetailPayload, NotificationItem, NotificationTargetPageId } from '@/types/domain';

interface NotificationPayload {
  notifications: NotificationItem[];
  unreadCount: number;
}

function targetPageForNotification(notification: NotificationItem): NotificationTargetPageId {
  if (notification.sourceType === 'account_deletion') return 'onboarding';
  if (notification.type === 'daily_revealed' || notification.type === 'quest_completed') return 'garden';
  if (notification.sourceType === 'today') return 'today';
  if (notification.sourceType === 'quest') return 'quests';
  if (notification.sourceType === 'love_jar') return 'love_jar';
  if (notification.sourceType === 'know_me') return 'know_me';
  if (notification.sourceType === 'memory') return 'memories';
  return 'garden';
}

function routeForTargetPage(targetPageId: NotificationTargetPageId): RouteLocationRaw {
  const routeNames: Record<NotificationTargetPageId, string> = {
    onboarding: 'onboarding',
    garden: 'garden',
    today: 'today',
    quests: 'quests',
    know_me: 'knowMe',
    love_jar: 'loveJar',
    memories: 'memories',
  };
  return { name: routeNames[targetPageId] };
}

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: [] as NotificationItem[],
    details: {} as Record<string, NotificationDetailPayload>,
    detailLoadingId: '',
    detailError: '',
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
        this.error = localizeApiError(error, 'errors.fallback.notificationsLoad');
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
    async loadDetail(notificationId: string) {
      if (this.details[notificationId]) return this.details[notificationId];

      this.detailLoadingId = notificationId;
      this.detailError = '';
      try {
        const detail = await apiRequest<NotificationDetailPayload>(`/api/notifications/${notificationId}/detail`);
        this.details[notificationId] = detail;
        return detail;
      } catch (error) {
        this.detailError = localizeApiError(error, 'errors.fallback.notificationsLoad');
        throw error;
      } finally {
        if (this.detailLoadingId === notificationId) {
          this.detailLoadingId = '';
        }
      }
    },
    targetLocation(notification: NotificationItem, detail?: NotificationDetailPayload) {
      return routeForTargetPage(detail?.targetPageId ?? targetPageForNotification(notification));
    },
  },
});
