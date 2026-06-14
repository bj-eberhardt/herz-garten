<script setup lang="ts">
import { computed } from 'vue';
import { ChevronDown, Mail, MailOpen } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import type { NotificationItem } from '@/types/domain';
import { notificationMeta } from './notificationMeta';

interface Props {
  notification: NotificationItem;
  open: boolean;
}

const props = defineProps<Props>();

defineEmits<{
  toggle: [notification: NotificationItem];
}>();

const { t, d } = useI18n();

const meta = computed(() => notificationMeta(props.notification));
const isUnread = computed(() => !props.notification.readAt);
const stateLabel = computed(() => (isUnread.value ? t('notifications.states.unread') : t('notifications.states.read')));
const priorityLabel = computed(() =>
  meta.value.needsAction ? t('notifications.states.actionNeeded') : t('notifications.states.informational'),
);
const title = computed(() =>
  props.notification.titleKey ? t(props.notification.titleKey, props.notification.params ?? {}) : props.notification.title,
);
const body = computed(() =>
  props.notification.bodyKey ? t(props.notification.bodyKey, props.notification.params ?? {}) : props.notification.body,
);
const createdAt = computed(() => d(new Date(props.notification.createdAt), 'shortDateTime'));
const knowMeAnswerDetail = computed(() => {
  const params = props.notification.params ?? {};
  if (props.notification.type !== 'know_me_answered') return null;
  if (
    typeof params.questionText !== 'string' ||
    typeof params.correctAnswer !== 'string' ||
    typeof params.guessedAnswer !== 'string'
  ) {
    return null;
  }

  return {
    questionText: params.questionText,
    correctAnswer: params.correctAnswer,
    guessedAnswer: params.guessedAnswer,
  };
});
</script>

<template>
  <button
    class="notification-item"
    :class="[`tone-${meta.tone}`, { unread: isUnread, open }]"
    type="button"
    :aria-expanded="open"
    data-testid="notification-item"
    @click="$emit('toggle', notification)"
  >
    <span class="notification-read-icon" aria-hidden="true">
      <Mail v-if="isUnread" :size="19" />
      <MailOpen v-else :size="19" />
    </span>

    <span class="notification-copy">
      <span class="notification-kicker">
        <span class="notification-feature">
          <component :is="meta.icon" :size="14" aria-hidden="true" />
          {{ t(meta.featureKey) }}
        </span>
        <span class="notification-state" :class="{ unread: isUnread }">{{ stateLabel }}</span>
        <span class="notification-priority" :class="{ action: meta.needsAction }">{{ priorityLabel }}</span>
      </span>
      <strong>{{ title }}</strong>
      <small>{{ body }}</small>
      <span v-if="knowMeAnswerDetail" class="notification-knowme-inline" data-testid="notification-knowme-inline">
        <span>
          <b>{{ t('garden.detail.questionLabel') }}:</b>
          {{ knowMeAnswerDetail.questionText }}
        </span>
        <span>
          <b>{{ t('garden.correct') }}</b>
          {{ knowMeAnswerDetail.correctAnswer }}
        </span>
        <span>
          <b>{{ t('garden.guessed') }}</b>
          {{ knowMeAnswerDetail.guessedAnswer }}
        </span>
      </span>
      <time>{{ createdAt }}</time>
    </span>

    <ChevronDown class="notification-chevron" :class="{ open }" :size="18" aria-hidden="true" />
  </button>
</template>
