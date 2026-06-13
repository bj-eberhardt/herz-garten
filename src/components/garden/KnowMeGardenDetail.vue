<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface KnowMeDetail {
  questionText: string;
  correctAnswer: string;
  guessedAnswer: string;
}

interface Props {
  source: Record<string, unknown>;
}

const props = defineProps<Props>();
const { t } = useI18n();

const knowMeDetail = computed<KnowMeDetail | null>(() => {
  if (
    props.source.type !== 'know_me' ||
    typeof props.source.questionText !== 'string' ||
    !Array.isArray(props.source.options) ||
    typeof props.source.correctOptionIndex !== 'number' ||
    typeof props.source.selectedOptionIndex !== 'number'
  ) {
    return null;
  }

  const options = props.source.options.filter((option): option is string => typeof option === 'string');
  const correctAnswer = options[props.source.correctOptionIndex];
  const guessedAnswer = options[props.source.selectedOptionIndex];
  if (typeof correctAnswer !== 'string' || typeof guessedAnswer !== 'string') return null;

  return {
    questionText: props.source.questionText,
    correctAnswer,
    guessedAnswer,
  };
});
</script>

<template>
  <div v-if="knowMeDetail" class="question-detail">
    <section class="question-card">
      <p class="detail-label">{{ t('garden.detail.questionLabel') }}</p>
      <p>{{ knowMeDetail.questionText }}</p>
    </section>

    <section class="question-card">
      <p class="detail-label">{{ t('garden.detail.answersLabel') }}</p>
      <div class="question-answer-grid">
        <article class="question-answer-card">
          <strong>{{ t('garden.correct') }}</strong>
          <p>{{ knowMeDetail.correctAnswer }}</p>
        </article>

        <article class="question-answer-card">
          <strong>{{ t('garden.guessed') }}</strong>
          <p>{{ knowMeDetail.guessedAnswer }}</p>
        </article>
      </div>
    </section>
  </div>

  <p v-else class="muted">{{ t('garden.noDetails') }}</p>
</template>
