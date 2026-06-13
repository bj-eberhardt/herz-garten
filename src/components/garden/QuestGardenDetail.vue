<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface QuestDetail {
  description: string;
}

interface Props {
  source: Record<string, unknown>;
}

const props = defineProps<Props>();
const { t } = useI18n();

const questDetail = computed<QuestDetail | null>(() => {
  if (props.source.type !== 'quest' || typeof props.source.description !== 'string') return null;
  return {
    description: props.source.description,
  };
});
</script>

<template>
  <div v-if="questDetail" class="question-detail">
    <section class="question-card">
      <p class="detail-label">{{ t('garden.detail.descriptionLabel') }}</p>
      <p>{{ questDetail.description }}</p>
    </section>
  </div>

  <p v-else class="muted">{{ t('garden.noDetails') }}</p>
</template>
