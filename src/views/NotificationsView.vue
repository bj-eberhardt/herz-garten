<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Bell } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import FeatureExplainer from '@/components/common/FeatureExplainer.vue';
import NotificationList from '@/components/notifications/NotificationList.vue';
import NotificationToolbar from '@/components/notifications/NotificationToolbar.vue';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { usePushStore } from '@/stores/pushStore';
import type { NotificationItem } from '@/types/domain';

const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();
const pushStore = usePushStore();
const authStore = useAuthStore();
const { t } = useI18n();
const activeNotificationId = ref('');
const requestedNotificationId = computed(() => (typeof route.query.notification === 'string' ? route.query.notification : ''));

onMounted(async () => {
  await Promise.all([notificationStore.loadNotifications(), pushStore.loadStatus()]);
  if (requestedNotificationId.value) {
    const notification = notificationStore.notifications.find((item) => item.id === requestedNotificationId.value);
    if (notification) {
      await toggleNotification(notification);
    }
  }
});

async function toggleNotification(notification: NotificationItem) {
  if (activeNotificationId.value === notification.id) {
    activeNotificationId.value = '';
    return;
  }

  activeNotificationId.value = notification.id;
  await notificationStore.loadDetail(notification.id);

  if (!notification.readAt) {
    await notificationStore.markRead(notification.id);
  }
  if (notification.sourceType === 'account_deletion' || notification.type === 'couple_joined') {
    await authStore.refreshMe();
  }
}

async function navigateToNotification(notification: NotificationItem) {
  const targetRoute = notificationStore.details[notification.id]?.targetRoute ?? notificationStore.targetRoute(notification);
  await router.push(targetRoute);
}
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">{{ t('notifications.eyebrow') }}</p>
      <h1>{{ t('notifications.title') }}</h1>
    </section>

    <FeatureExplainer feature-key="notifications" :icon="Bell" :title="t('notifications.howTitle')" :text="t('notifications.howText')" />

    <section v-if="pushStore.shouldShowOptInHint" class="push-opt-in" data-testid="notifications-push-opt-in">
      <div>
        <p class="eyebrow">{{ t('notifications.push.eyebrow') }}</p>
        <p>{{ t('notifications.push.text') }}</p>
      </div>
      <button class="secondary-button" type="button" data-testid="notifications-push-enable" :disabled="pushStore.saving" @click="pushStore.enable">
        {{ pushStore.saving ? t('notifications.push.enabling') : t('notifications.push.enable') }}
      </button>
    </section>

    <NotificationToolbar
      :unread-count="notificationStore.unreadCount"
      :loading="notificationStore.loading"
      @read-all="notificationStore.markAllRead"
    />

    <p v-if="notificationStore.error" class="form-error">{{ notificationStore.error }}</p>
    <p v-if="notificationStore.loading" class="muted">{{ t('notifications.loading') }}</p>

    <section v-if="!notificationStore.loading && notificationStore.notifications.length === 0" class="empty-state" data-testid="notifications-empty">
      {{ t('notifications.empty') }}
    </section>

    <NotificationList
      v-else
      :notifications="notificationStore.notifications"
      :active-notification-id="activeNotificationId"
      :details="notificationStore.details"
      :detail-loading-id="notificationStore.detailLoadingId"
      :detail-error="notificationStore.detailError"
      @toggle="toggleNotification"
      @navigate="navigateToNotification"
    />
  </div>
</template>
