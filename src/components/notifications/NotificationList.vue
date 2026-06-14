<script setup lang="ts">
import type { NotificationDetailPayload, NotificationItem } from '@/types/domain';
import NotificationDetailPanel from './NotificationDetailPanel.vue';
import NotificationListItem from './NotificationListItem.vue';

interface Props {
  notifications: NotificationItem[];
  activeNotificationId: string;
  details: Record<string, NotificationDetailPayload>;
  detailLoadingId: string;
  detailError: string;
}

defineProps<Props>();

defineEmits<{
  toggle: [notification: NotificationItem];
  navigate: [notification: NotificationItem];
}>();
</script>

<template>
  <section class="notification-list" data-testid="notification-list">
    <article
      v-for="notification in notifications"
      :key="notification.id"
      class="notification-list-row"
      :class="{ open: activeNotificationId === notification.id }"
    >
      <NotificationListItem
        :notification="notification"
        :open="activeNotificationId === notification.id"
        @toggle="$emit('toggle', notification)"
      />

      <Transition name="notification-expand">
        <NotificationDetailPanel
          v-if="activeNotificationId === notification.id"
          :notification="notification"
          :detail="details[notification.id]"
          :loading="detailLoadingId === notification.id"
          :error="detailError"
          @navigate="$emit('navigate', notification)"
        />
      </Transition>
    </article>
  </section>
</template>
