<script setup lang="ts">
import { Sparkles } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { useKnowMeStore } from '@/stores/knowMeStore';
import type { KnowMeRound } from '@/types/domain';

const knowMeStore = useKnowMeStore();
const { t } = useI18n();

function optionLabel(round: KnowMeRound, index?: number | null) {
  return typeof index === 'number' ? round.options[index] : '';
}
</script>

<template>
  <section v-if="knowMeStore.answeredRounds.length" class="quest-section" data-testid="know-me-history-section">
    <div class="section-heading">
      <p class="eyebrow">{{ t('knowMe.playedEyebrow') }}</p>
      <h2>{{ t('knowMe.playedTitle') }}</h2>
    </div>
    <article v-for="round in knowMeStore.answeredRounds" :key="round.id" class="quest-card know-me-history-card" data-testid="know-me-history-card">
      <p class="eyebrow">{{ round.guess?.isCorrect ? t('knowMe.hit') : t('knowMe.resolved') }}</p>
      <h2>{{ round.questionText }}</h2>
      <dl class="know-me-history-details">
        <div>
          <dt>{{ t('knowMe.correct') }}</dt>
          <dd>{{ optionLabel(round, round.correctOptionIndex) }}</dd>
        </div>
        <div v-if="round.guess">
          <dt>{{ t('knowMe.guessed') }}</dt>
          <dd>{{ optionLabel(round, round.guess.selectedOptionIndex) }}</dd>
        </div>
      </dl>
      <p class="success-note" v-if="round.guess?.isCorrect">
        <Sparkles :size="18" aria-hidden="true" />
        {{ t('knowMe.success') }}
      </p>
      <p v-else class="muted">{{ t('knowMe.miss') }}</p>
    </article>
  </section>
</template>
