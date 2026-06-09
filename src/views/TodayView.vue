<script setup lang="ts">
import { onMounted } from 'vue';
import { Heart, Sparkles } from '@lucide/vue';
import DailyQuestionCard from '@/components/questions/DailyQuestionCard.vue';
import { useCoupleStore } from '@/stores/coupleStore';
import { useDailyQuestionStore } from '@/stores/dailyQuestionStore';

const coupleStore = useCoupleStore();
const dailyQuestionStore = useDailyQuestionStore();

onMounted(() => {
  dailyQuestionStore.loadToday();
});
</script>

<template>
  <div class="view-grid">
    <section class="hero-panel">
      <p class="eyebrow">Euer Heute</p>
      <h1>Kleine Momente lassen euren Garten weiterbluehen.</h1>
      <div class="stats-row">
        <span><Heart :size="18" />{{ coupleStore.couple.heartPoints }} Herzpunkte</span>
        <span><Sparkles :size="18" />Gartenstufe {{ coupleStore.couple.gardenStage }}</span>
      </div>
    </section>

    <DailyQuestionCard />
  </div>
</template>
