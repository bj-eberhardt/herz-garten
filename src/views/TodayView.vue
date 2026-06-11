<script setup lang="ts">
import { onMounted } from 'vue';
import { Heart, Sparkles } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import FeatureExplainer from '@/components/common/FeatureExplainer.vue';
import DailyQuestionCard from '@/components/questions/DailyQuestionCard.vue';
import { useCoupleStore } from '@/stores/coupleStore';
import { useDailyQuestionStore } from '@/stores/dailyQuestionStore';

const coupleStore = useCoupleStore();
const dailyQuestionStore = useDailyQuestionStore();
const { t } = useI18n();

onMounted(() => {
  dailyQuestionStore.loadToday();
});
</script>

<template>
  <div class="view-grid">
    <section class="hero-panel">
      <p class="eyebrow">{{ t('today.eyebrow') }}</p>
      <h1>{{ t('today.title') }}</h1>
      <div class="stats-row">
        <span><Heart :size="18" />{{ t('today.heartPoints', coupleStore.couple.heartPoints, { named: { count: coupleStore.couple.heartPoints } }) }}</span>
        <span><Sparkles :size="18" />{{ t('today.gardenStage', { stage: coupleStore.couple.gardenStage }) }}</span>
      </div>
    </section>

    <FeatureExplainer feature-key="today" :icon="Heart" :title="t('today.howTitle')" :text="t('today.howText')" />

    <DailyQuestionCard />
  </div>
</template>
