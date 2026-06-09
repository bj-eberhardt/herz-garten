<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, CheckCheck } from '@lucide/vue';
import { useNotificationStore } from '@/stores/notificationStore';
import type { NotificationItem } from '@/types/domain';

const router = useRouter();
const notificationStore = useNotificationStore();

onMounted(() => {
  notificationStore.loadNotifications();
});

async function openNotification(notification: NotificationItem) {
  if (!notification.readAt) {
    await notificationStore.markRead(notification.id);
  }
  await router.push(notificationStore.targetRoute(notification));
}
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">Benachrichtigungen</p>
      <h1>Kleine Hinweise aus eurem Herzgarten.</h1>
    </section>

    <section class="panel notification-toolbar">
      <div>
        <h2>{{ notificationStore.unreadCount }} ungelesen</h2>
        <p class="muted">Hier landen nur sanfte In-App-Hinweise, keine Push-Nachrichten.</p>
      </div>
      <button
        class="secondary-button inline-button"
        type="button"
        :disabled="notificationStore.loading || notificationStore.unreadCount === 0"
        data-testid="notifications-read-all"
        @click="notificationStore.markAllRead"
      >
        <CheckCheck :size="18" aria-hidden="true" />
        Alle gelesen
      </button>
    </section>

    <p v-if="notificationStore.error" class="form-error">{{ notificationStore.error }}</p>
    <p v-if="notificationStore.loading" class="muted">Benachrichtigungen werden geladen...</p>

    <section v-if="!notificationStore.loading && notificationStore.notifications.length === 0" class="empty-state" data-testid="notifications-empty">
      Noch keine Hinweise. Sobald im Paarraum etwas auf dich wartet, erscheint es hier.
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
          <strong>{{ notification.title }}</strong>
          <small>{{ notification.body }}</small>
        </span>
      </button>
    </section>
  </div>
</template>
