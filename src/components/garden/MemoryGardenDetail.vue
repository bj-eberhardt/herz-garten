<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface MemoryDetail {
  description: string;
  category: string;
  authorName: string;
}

interface Props {
  source: Record<string, unknown>;
}

const props = defineProps<Props>();
const { t } = useI18n();

const memoryDetail = computed<MemoryDetail | null>(() => {
  if (props.source.type !== 'memory') return null;

  const description = typeof props.source.description === 'string' ? props.source.description : '';
  const category =
    typeof props.source.categoryLabel === 'string'
      ? props.source.categoryLabel
      : typeof props.source.category === 'string'
        ? props.source.category
        : '';
  const authorName = typeof props.source.authorName === 'string' ? props.source.authorName : '';

  if (!description && !category && !authorName) return null;

  return {
    description,
    category,
    authorName,
  };
});

const memorySubtitle = computed(() => {
  const detail = memoryDetail.value;
  if (!detail) return '';
  return [detail.category, detail.authorName ? t('garden.detail.authorValue', { name: detail.authorName }) : '']
    .filter(Boolean)
    .join(' · ');
});
</script>

<template>
  <div v-if="memoryDetail" class="question-detail">
    <section class="question-card memory-detail-card">
      <p class="detail-label">{{ t('garden.detail.descriptionLabel') }}</p>
      <p v-if="memorySubtitle" class="detail-card-subtitle">{{ memorySubtitle }}</p>
      <p v-if="memoryDetail.description">{{ memoryDetail.description }}</p>
    </section>
  </div>

  <p v-else class="muted">{{ t('garden.noDetails') }}</p>
</template>
