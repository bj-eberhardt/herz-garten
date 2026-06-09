<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { HelpCircle, Plus, Sparkles } from '@lucide/vue';
import { useKnowMeStore } from '@/stores/knowMeStore';
import type { KnowMeRound } from '@/types/domain';

const knowMeStore = useKnowMeStore();
const questionText = ref('');
const options = ref(['', '', '', '']);
const correctOptionIndex = ref(0);
const selectedGuesses = ref<Record<string, number>>({});

const filledOptions = computed(() => options.value.map((option) => option.trim()).filter(Boolean));
const canCreate = computed(
  () =>
    questionText.value.trim().length > 0 &&
    filledOptions.value.length >= 2 &&
    correctOptionIndex.value >= 0 &&
    correctOptionIndex.value < filledOptions.value.length,
);

function optionLabel(round: KnowMeRound, index?: number | null) {
  return typeof index === 'number' ? round.options[index] : '';
}

async function submitRound() {
  if (!canCreate.value) return;
  await knowMeStore.createRound({
    questionText: questionText.value.trim(),
    options: filledOptions.value,
    correctOptionIndex: correctOptionIndex.value,
  });
  questionText.value = '';
  options.value = ['', '', '', ''];
  correctOptionIndex.value = 0;
}

async function submitGuess(round: KnowMeRound) {
  const selectedOptionIndex = selectedGuesses.value[round.id];
  if (typeof selectedOptionIndex !== 'number') return;
  await knowMeStore.guess(round.id, selectedOptionIndex);
}

onMounted(() => {
  knowMeStore.loadRounds();
});
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">Mini-Game</p>
      <h1>Wie gut kennst du mich?</h1>
      <p class="muted">
        Stellt euch kleine Multiple-Choice-Fragen. Ein Treffer laesst eine besondere Blume im Garten wachsen.
      </p>
    </section>

    <p v-if="knowMeStore.error" class="form-error" data-testid="know-me-error">{{ knowMeStore.error }}</p>
    <p v-if="knowMeStore.loading" class="muted">Spiel wird geladen...</p>

    <section class="panel composer" data-testid="know-me-create-panel">
      <div>
        <p class="eyebrow">Frage stellen</p>
        <h2>Erzaehl etwas ueber dich, das dein Partner einschaetzen darf.</h2>
      </div>

      <label for="know-me-question">Deine Frage</label>
      <input
        id="know-me-question"
        v-model="questionText"
        data-testid="know-me-question-input"
        placeholder="Was waere mein perfekter Sonntag?"
      />

      <div class="option-grid">
        <label v-for="(_, index) in options" :key="index" :for="`know-me-option-${index}`">
          Option {{ index + 1 }}
          <input
            :id="`know-me-option-${index}`"
            v-model="options[index]"
            :data-testid="`know-me-option-${index}`"
            :placeholder="index < 2 ? 'Antwortmoeglichkeit' : 'Optional'"
          />
        </label>
      </div>

      <label for="know-me-correct">Richtige Antwort</label>
      <select id="know-me-correct" v-model.number="correctOptionIndex" data-testid="know-me-correct-select">
        <option v-for="(_, index) in filledOptions" :key="index" :value="index">Option {{ index + 1 }}</option>
      </select>

      <button
        class="primary-button"
        type="button"
        data-testid="know-me-create-submit"
        :disabled="knowMeStore.loading || !canCreate"
        @click="submitRound"
      >
        <Plus :size="18" aria-hidden="true" />
        Frage senden
      </button>
    </section>

    <section class="quest-section" data-testid="know-me-open-section">
      <div class="section-heading">
        <p class="eyebrow">Zum Raten</p>
        <h2>Offene Fragen deines Partners</h2>
      </div>
      <p v-if="!knowMeStore.openForMe.length" class="empty-state" data-testid="know-me-open-empty">
        Gerade wartet keine Frage auf dich.
      </p>
      <article v-for="round in knowMeStore.openForMe" :key="round.id" class="quest-card" data-testid="know-me-open-card">
        <p class="eyebrow">Von {{ round.authorName }}</p>
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
          Antwort einloggen
        </button>
      </article>
    </section>

    <section v-if="knowMeStore.ownOpen.length" class="quest-section" data-testid="know-me-own-section">
      <div class="section-heading">
        <p class="eyebrow">Gestellt</p>
        <h2>Wartet auf deinen Partner</h2>
      </div>
      <article v-for="round in knowMeStore.ownOpen" :key="round.id" class="quest-card" data-testid="know-me-own-card">
        <h2>{{ round.questionText }}</h2>
        <p class="muted">Dein Partner kann diese Frage beantworten. Die richtige Antwort bleibt bis dahin verborgen.</p>
      </article>
    </section>

    <section v-if="knowMeStore.answeredRounds.length" class="quest-section" data-testid="know-me-history-section">
      <div class="section-heading">
        <p class="eyebrow">Gespielt</p>
        <h2>Was ihr schon herausgefunden habt</h2>
      </div>
      <article v-for="round in knowMeStore.answeredRounds" :key="round.id" class="quest-card" data-testid="know-me-history-card">
        <p class="eyebrow">{{ round.guess?.isCorrect ? 'Treffer' : 'Aufgeloest' }}</p>
        <h2>{{ round.questionText }}</h2>
        <p>
          <strong>Richtig:</strong> {{ optionLabel(round, round.correctOptionIndex) }}
        </p>
        <p v-if="round.guess">
          <strong>Geraten:</strong> {{ optionLabel(round, round.guess.selectedOptionIndex) }}
        </p>
        <p class="success-note" v-if="round.guess?.isCorrect">
          <Sparkles :size="18" aria-hidden="true" />
          Ihr kennt euch ein Stueck besser. Im Garten ist eine besondere Blume gewachsen.
        </p>
        <p v-else class="muted">Nicht getroffen, aber ein neuer Gespraechsanlass.</p>
      </article>
    </section>
  </div>
</template>
