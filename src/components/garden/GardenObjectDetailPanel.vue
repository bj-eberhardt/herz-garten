<script setup lang="ts">
import { ref } from 'vue';
import { Sprout } from '@lucide/vue';
import { useI18n } from 'vue-i18n';

interface Props {
  sourceTypeTitle: string;
  title: string;
  date: string;
  celebrationText: string;
  rewardPoints: number;
  compactGrowth?: boolean;
}

defineProps<Props>();

defineEmits<{
  close: [];
}>();

const { t } = useI18n();
const panelElement = ref<HTMLElement | null>(null);

defineExpose({
  scrollIntoView(options?: ScrollIntoViewOptions) {
    panelElement.value?.scrollIntoView(options);
  },
});
</script>

<template>
  <section ref="panelElement" class="panel detail-panel" data-testid="garden-detail">
    <div class="detail-header">
      <div>
        <p class="eyebrow">{{ sourceTypeTitle }}</p>
        <h2>{{ title }}</h2>
        <p class="muted" data-testid="garden-detail-date">{{ date }}</p>
      </div>
      <button class="secondary-button inline-button" type="button" data-testid="garden-detail-close" @click="$emit('close')">
        {{ t('common.close') }}
      </button>
    </div>

    <div v-if="compactGrowth" class="detail-growth-note" data-testid="garden-detail-celebration">
      <slot name="growth-icon">
        <Sprout aria-hidden="true" />
      </slot>
      <p>{{ celebrationText }}</p>
    </div>

    <div v-else class="celebration-panel" data-testid="garden-detail-celebration">
      <span>{{ t('garden.grown') }}</span>
      <p>{{ celebrationText }}</p>
    </div>

    <slot />

    <p class="success-note">{{ t('garden.rewardPoints', { count: rewardPoints }) }}</p>
  </section>
</template>
