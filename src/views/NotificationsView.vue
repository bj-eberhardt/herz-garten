<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, CheckCheck } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';
import type { NotificationItem } from '@/types/domain';

const router = useRouter();
const notificationStore = useNotificationStore();
const authStore = useAuthStore();
const { t } = useI18n();

onMounted(() => {
  notificationStore.loadNotifications();
});

async function openNotification(notification: NotificationItem) {
  if (!notification.readAt) {
    await notificationStore.markRead(notification.id);
  }
  if (notification.sourceType === 'account_deletion') {
    await authStore.refreshMe();
  }
  await router.push(notificationStore.targetRoute(notification));
}

function notificationTitle(notification: NotificationItem) {
  return notification.titleKey ? t(notification.titleKey, notification.params ?? {}) : notification.title;
}

function notificationBody(notification: NotificationItem) {
  return notification.bodyKey ? t(notification.bodyKey, notification.params ?? {}) : notification.body;
}
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">{{ t('notifications.eyebrow') }}</p>
      <h1>{{ t('notifications.title') }}</h1>
    </section>

    <section class="panel notification-toolbar">
      <div>
        <h2>{{ t('notifications.unread', notificationStore.unreadCount, { named: { count: notificationStore.unreadCount } }) }}</h2>
        <p class="muted">{{ t('notifications.hint') }}</p>
      </div>
      <button
        class="secondary-button inline-button"
        type="button"
        :disabled="notificationStore.loading || notificationStore.unreadCount === 0"
        data-testid="notifications-read-all"
        @click="notificationStore.markAllRead"
      >
        <CheckCheck :size="18" aria-hidden="true" />
        {{ t('notifications.readAll') }}
      </button>
    </section>

    <p v-if="notificationStore.error" class="form-error">{{ notificationStore.error }}</p>
    <p v-if="notificationStore.loading" class="muted">{{ t('notifications.loading') }}</p>

    <section v-if="!notificationStore.loading && notificationStore.notifications.length === 0" class="empty-state" data-testid="notifications-empty">
      {{ t('notifications.empty') }}
    </section>

    <section v-else class="notification-list">
      <button
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        class="notification-item"
        :class="{ unread: !notification.readAt }"
        type="button"
        data-testid="notification-item"
        @click="openNotification(notification)"
      >
        <Bell :size="18" aria-hidden="true" />
        <span>
          <strong>{{ notificationTitle(notification) }}</strong>
          <small>{{ notificationBody(notification) }}</small>
        </span>
      </button>
    </section>
  </div>
</template>
