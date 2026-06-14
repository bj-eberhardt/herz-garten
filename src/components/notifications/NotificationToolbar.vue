<script setup lang="ts">
import { CheckCheck } from '@lucide/vue';
import { useI18n } from 'vue-i18n';

interface Props {
  unreadCount: number;
  loading: boolean;
}

defineProps<Props>();

defineEmits<{
  readAll: [];
}>();

const { t } = useI18n();
</script>

<template>
  <section class="panel notification-toolbar">
    <div>
      <h2>{{ t('notifications.unread', unreadCount, { named: { count: unreadCount } }) }}</h2>
      <p class="muted">{{ t('notifications.hint') }}</p>
    </div>
    <button
      class="secondary-button inline-button"
      type="button"
      :disabled="loading || unreadCount === 0"
      data-testid="notifications-read-all"
      @click="$emit('readAll')"
    >
      <CheckCheck :size="18" aria-hidden="true" />
      {{ t('notifications.readAll') }}
    </button>
  </section>
</template>
