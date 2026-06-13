<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface LoveJarDetail {
  text: string | null;
  category: string;
  authorName: string;
}

interface Props {
  source: Record<string, unknown>;
}

const props = defineProps<Props>();
const { t } = useI18n();

const loveJarDetail = computed<LoveJarDetail | null>(() => {
  if (props.source.type !== 'love_jar') return null;

  const text = typeof props.source.text === 'string' ? props.source.text : null;
  const category =
    typeof props.source.categoryLabel === 'string'
      ? props.source.categoryLabel
      : typeof props.source.category === 'string'
        ? props.source.category
        : '';
  const authorName = typeof props.source.authorName === 'string' ? props.source.authorName : '';

  if (!text && !category && !authorName) return null;

  return {
    text,
    category,
    authorName,
  };
});

const loveJarSubtitle = computed(() => {
  const detail = loveJarDetail.value;
  if (!detail) return '';
  return [detail.category, detail.authorName ? t('garden.detail.authorValue', { name: detail.authorName }) : ''].filter(Boolean).join(' · ');
});
</script>

<template>
  <div v-if="loveJarDetail" class="question-detail">
    <section class="question-card">
      <p class="detail-label">{{ t('garden.detail.noteLabel') }}</p>
      <p v-if="loveJarSubtitle" class="detail-card-subtitle">{{ loveJarSubtitle }}</p>
      <p>{{ loveJarDetail.text ?? t('garden.hiddenLoveJar') }}</p>
    </section>
  </div>

  <p v-else class="muted">{{ t('garden.noDetails') }}</p>
</template>
