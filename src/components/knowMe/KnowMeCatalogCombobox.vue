<script setup lang="ts">
import { computed, ref } from 'vue';
import { ChevronDown } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import type { KnowMeCatalogQuestion } from '@/types/domain';

const props = defineProps<{
  modelValue: string;
  selectedQuestionId: string | null;
  questions: KnowMeCatalogQuestion[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:selectedQuestionId': [value: string | null];
}>();

const { t } = useI18n();
const isOpen = ref(false);

const selectedCatalogQuestion = computed(() =>
  props.questions.find((question) => question.id === props.selectedQuestionId),
);
const filteredCatalogQuestions = computed(() => {
  const search = props.modelValue.trim().toLowerCase();
  return props.questions.filter((question) => {
    if (!search) return true;
    const categoryLabel = question.categoryLabel ?? question.category;
    return question.questionText.toLowerCase().includes(search) || categoryLabel.toLowerCase().includes(search);
  });
});
const questionSourceLabel = computed(() =>
  selectedCatalogQuestion.value ? t('knowMe.catalogSource') : t('knowMe.ownSource'),
);
const showCatalogDropdown = computed(() => isOpen.value);

function selectCatalogQuestion(question: KnowMeCatalogQuestion) {
  emit('update:selectedQuestionId', question.id);
  emit('update:modelValue', question.questionText);
  isOpen.value = false;
}

function handleQuestionInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  isOpen.value = true;
  emit('update:modelValue', value);
  if (selectedCatalogQuestion.value && value !== selectedCatalogQuestion.value.questionText) {
    emit('update:selectedQuestionId', null);
  }
}

function openCatalog() {
  isOpen.value = true;
}

function closeCatalogSoon() {
  window.setTimeout(() => {
    isOpen.value = false;
  }, 120);
}

function selectFirstCatalogQuestion() {
  if (!showCatalogDropdown.value || !filteredCatalogQuestions.value.length) return;
  selectCatalogQuestion(filteredCatalogQuestions.value[0]);
}
</script>

<template>
  <div class="catalog-combobox">
    <label for="know-me-question">{{ t('knowMe.yourQuestion') }}</label>
    <div class="catalog-input-shell">
      <input
        id="know-me-question"
        :value="modelValue"
        data-testid="know-me-question-input"
        :placeholder="t('knowMe.questionPlaceholder')"
        autocomplete="off"
        required
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="showCatalogDropdown"
        aria-controls="know-me-catalog-listbox"
        @focus="openCatalog"
        @blur="closeCatalogSoon"
        @input="handleQuestionInput"
        @keydown.esc.prevent="isOpen = false"
        @keydown.enter.prevent="selectFirstCatalogQuestion"
      />
      <ChevronDown class="catalog-input-icon" :class="{ open: showCatalogDropdown }" :size="18" aria-hidden="true" />
    </div>
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
        <small>{{ question.categoryLabel ?? question.category }}</small>
      </button>
      <p v-if="!filteredCatalogQuestions.length" class="catalog-empty" data-testid="know-me-catalog-empty">
        {{ t('knowMe.catalogEmpty') }}
      </p>
    </div>
  </div>
  <p class="question-source" data-testid="know-me-question-source">{{ questionSourceLabel }}</p>
</template>
