<script setup lang="ts">
import { ref } from 'vue';
import { HelpCircle } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { useKnowMeStore } from '@/stores/knowMeStore';
import type { KnowMeRound } from '@/types/domain';

const knowMeStore = useKnowMeStore();
const { t } = useI18n();
const selectedGuesses = ref<Record<string, number>>({});

async function submitGuess(round: KnowMeRound) {
  const selectedOptionIndex = selectedGuesses.value[round.id];
  if (typeof selectedOptionIndex !== 'number') return;
  await knowMeStore.guess(round.id, selectedOptionIndex);
}
</script>

<template>
  <section class="quest-section" data-testid="know-me-open-section">
    <div class="section-heading">
      <p class="eyebrow">{{ t('knowMe.toGuessEyebrow') }}</p>
      <h2>{{ t('knowMe.toGuessTitle') }}</h2>
    </div>
    <p v-if="!knowMeStore.openForMe.length" class="empty-state" data-testid="know-me-open-empty">
      {{ t('knowMe.noOpen') }}
    </p>
    <article v-for="round in knowMeStore.openForMe" :key="round.id" class="quest-card" data-testid="know-me-open-card">
      <p class="eyebrow">{{ t('knowMe.fromAuthor', { name: round.authorName }) }}</p>
      <h2>{{ round.questionText }}</h2>
      <div class="answer-options">
        <label v-for="(option, index) in round.options" :key="option" class="answer-option" data-testid="know-me-answer-option">
          <input v-model="selectedGuesses[round.id]" type="radio" :value="index" />
          {{ option }}
        </label>
      </div>
      <button
        class="secondary-button"
        type="button"
        data-testid="know-me-guess-submit"
        :disabled="typeof selectedGuesses[round.id] !== 'number' || knowMeStore.loading"
        @click="submitGuess(round)"
      >
        <HelpCircle :size="18" aria-hidden="true" />
        {{ t('knowMe.lockAnswer') }}
      </button>
    </article>
  </section>
</template>
