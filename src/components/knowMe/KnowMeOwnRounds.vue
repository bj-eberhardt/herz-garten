<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useKnowMeStore } from '@/stores/knowMeStore';

const knowMeStore = useKnowMeStore();
const { t } = useI18n();
</script>

<template>
  <section v-if="knowMeStore.ownOpen.length" class="quest-section" data-testid="know-me-own-section">
    <div class="section-heading">
      <p class="eyebrow">{{ t('knowMe.ownEyebrow') }}</p>
      <h2>{{ t('knowMe.ownTitle') }}</h2>
    </div>
    <article v-for="round in knowMeStore.ownOpen" :key="round.id" class="quest-card" data-testid="know-me-own-card">
      <h2>{{ round.questionText }}</h2>
      <p class="muted">{{ t('knowMe.ownHint') }}</p>
    </article>
  </section>
</template>
