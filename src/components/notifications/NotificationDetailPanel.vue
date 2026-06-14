<script setup lang="ts">
import { computed } from 'vue';
import { ArrowRight, Info } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import KnowMeGardenDetail from '@/components/garden/KnowMeGardenDetail.vue';
import LoveJarGardenDetail from '@/components/garden/LoveJarGardenDetail.vue';
import MemoryGardenDetail from '@/components/garden/MemoryGardenDetail.vue';
import QuestionGardenDetail from '@/components/garden/QuestionGardenDetail.vue';
import QuestGardenDetail from '@/components/garden/QuestGardenDetail.vue';
import type { NotificationDetailPayload, NotificationItem } from '@/types/domain';
import { notificationMeta } from './notificationMeta';

interface Props {
  notification: NotificationItem;
  detail?: NotificationDetailPayload;
  loading: boolean;
  error: string;
}

const props = defineProps<Props>();

defineEmits<{
  navigate: [notification: NotificationItem];
}>();

const { t } = useI18n();

const meta = computed(() => notificationMeta(props.notification));
const source = computed(() => props.detail?.gardenDetail?.source ?? null);
const object = computed(() => props.detail?.gardenDetail?.object ?? null);
const hasGardenDetail = computed(() => Boolean(source.value && object.value));
const hasSourceDetail = computed(() => Boolean(source.value));
const sourceType = computed(() => (typeof source.value?.type === 'string' ? source.value.type : ''));
const fallbackText = computed(() =>
  props.notification.bodyKey ? t(props.notification.bodyKey, props.notification.params ?? {}) : props.notification.body,
);
</script>

<template>
  <section class="notification-detail" data-testid="notification-detail">
    <p v-if="loading" class="muted">{{ t('notifications.detail.loading') }}</p>
    <p v-else-if="error" class="form-error">{{ error }}</p>

    <template v-else>
      <div class="notification-detail-summary">
        <span>
          <component :is="meta.icon" :size="16" aria-hidden="true" />
          {{ t(meta.featureKey) }}
        </span>
        <p>{{ hasGardenDetail ? t('notifications.detail.gardenContext') : fallbackText }}</p>
      </div>

      <div v-if="hasSourceDetail && source" class="notification-source-detail">
        <QuestionGardenDetail v-if="sourceType === 'question'" :source="source" />
        <QuestGardenDetail v-else-if="sourceType === 'quest'" :source="source" />
        <LoveJarGardenDetail v-else-if="sourceType === 'love_jar'" :source="source" />
        <MemoryGardenDetail v-else-if="sourceType === 'memory'" :source="source" />
        <KnowMeGardenDetail v-else-if="sourceType === 'know_me'" :source="source" />
        <p v-else class="muted">{{ t('notifications.detail.noSource') }}</p>
      </div>

      <div v-else class="notification-fallback-detail">
        <Info :size="18" aria-hidden="true" />
        <p>{{ t('notifications.detail.noGardenObject') }}</p>
      </div>

      <button class="primary-button notification-detail-action" type="button" data-testid="notification-detail-cta" @click="$emit('navigate', notification)">
        {{ t(meta.actionKey) }}
        <ArrowRight :size="18" aria-hidden="true" />
      </button>
    </template>
  </section>
</template>
