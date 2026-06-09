<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { HelpCircle, Plus, Sparkles } from '@lucide/vue';
import { useKnowMeStore } from '@/stores/knowMeStore';
import type { KnowMeRound } from '@/types/domain';

const knowMeStore = useKnowMeStore();
const questionText = ref('');
const selectedCatalogQuestionId = ref<string | null>(null);
const isCatalogOpen = ref(false);
const options = ref(['', '', '', '']);
const correctOptionIndex = ref(0);
const selectedGuesses = ref<Record<string, number>>({});

const filledOptions = computed(() => options.value.map((option) => option.trim()).filter(Boolean));
const selectedCatalogQuestion = computed(() =>
  knowMeStore.catalogQuestions.find((question) => question.id === selectedCatalogQuestionId.value),
);
const filteredCatalogQuestions = computed(() => {
  const search = questionText.value.trim().toLowerCase();
  const questions = knowMeStore.catalogQuestions.filter((question) => {
    if (!search) return true;
    return (
      question.questionText.toLowerCase().includes(search) ||
      question.category.toLowerCase().includes(search)
    );
  });
  return questions.slice(0, 6);
});
const questionSourceLabel = computed(() =>
  selectedCatalogQuestion.value ? 'Vorschlag aus dem Katalog' : 'Eigene Frage',
);
const showCatalogDropdown = computed(() => isCatalogOpen.value && questionText.value.trim().length > 0);
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

function selectCatalogQuestion(question: { id: string; questionText: string }) {
  selectedCatalogQuestionId.value = question.id;
  questionText.value = question.questionText;
  isCatalogOpen.value = false;
}

function handleQuestionInput() {
  isCatalogOpen.value = true;
  if (selectedCatalogQuestion.value && questionText.value !== selectedCatalogQuestion.value.questionText) {
    selectedCatalogQuestionId.value = null;
  }
}

function openCatalog() {
  isCatalogOpen.value = true;
}

function closeCatalogSoon() {
  window.setTimeout(() => {
    isCatalogOpen.value = false;
  }, 120);
}

function selectFirstCatalogQuestion() {
  if (!showCatalogDropdown.value || !filteredCatalogQuestions.value.length) return;
  selectCatalogQuestion(filteredCatalogQuestions.value[0]);
}

async function submitRound() {
  if (!canCreate.value) return;
  await knowMeStore.createRound({
    questionText: questionText.value.trim(),
    options: filledOptions.value,
    correctOptionIndex: correctOptionIndex.value,
    catalogQuestionId: selectedCatalogQuestionId.value,
  });
  questionText.value = '';
  selectedCatalogQuestionId.value = null;
  isCatalogOpen.value = false;
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

      <div class="catalog-combobox">
        <label for="know-me-question">Deine Frage</label>
        <input
          id="know-me-question"
          v-model="questionText"
          data-testid="know-me-question-input"
          placeholder="Was waere mein perfekter Sonntag?"
          autocomplete="off"
          role="combobox"
          aria-autocomplete="list"
          :aria-expanded="showCatalogDropdown"
          aria-controls="know-me-catalog-listbox"
          @focus="openCatalog"
          @blur="closeCatalogSoon"
          @input="handleQuestionInput"
          @keydown.esc.prevent="isCatalogOpen = false"
          @keydown.enter.prevent="selectFirstCatalogQuestion"
        />
        <div
          v-if="showCatalogDropdown"
          id="know-me-catalog-listbox"
          class="catalog-suggestions"
          role="listbox"
          data-testid="know-me-catalog-suggestions"
        >
          <button
            v-for="question in filteredCatalogQuestions"
            :key="question.id"
            class="catalog-suggestion"
            type="button"
            role="option"
            data-testid="know-me-catalog-suggestion"
            @mousedown.prevent="selectCatalogQuestion(question)"
          >
            <span>{{ question.questionText }}</span>
            <small>{{ question.category }}</small>
          </button>
          <p v-if="!filteredCatalogQuestions.length" class="catalog-empty" data-testid="know-me-catalog-empty">
            Du hast alle passenden Vorschlaege schon gestellt. Du kannst jederzeit eine eigene Frage schreiben.
          </p>
        </div>
      </div>
      <p class="question-source" data-testid="know-me-question-source">{{ questionSourceLabel }}</p>

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
