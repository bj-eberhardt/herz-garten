<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface QuestionAnswer {
  displayName: string;
  answerText: string;
  createdAt: string;
}

interface QuestionDetail {
  question: string;
  answers: QuestionAnswer[];
}

interface Props {
  source: Record<string, unknown>;
}

const props = defineProps<Props>();
const { t } = useI18n();

function isQuestionAnswer(value: unknown): value is QuestionAnswer {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.displayName === 'string' &&
    typeof candidate.answerText === 'string' &&
    typeof candidate.createdAt === 'string'
  );
}

const questionDetail = computed<QuestionDetail | null>(() => {
  if (props.source.type !== 'question' || typeof props.source.question !== 'string' || !Array.isArray(props.source.answers)) {
    return null;
  }

  return {
    question: props.source.question,
    answers: props.source.answers.filter(isQuestionAnswer),
  };
});
</script>

<template>
  <div v-if="questionDetail" class="question-detail">
    <section class="question-card">
      <p class="detail-label">{{ t('garden.detail.questionLabel') }}</p>
      <p>{{ questionDetail.question }}</p>
    </section>

    <section class="question-card">
      <p class="detail-label">{{ t('garden.detail.answersLabel') }}</p>
      <div class="question-answer-grid">
        <article v-for="answer in questionDetail.answers" :key="answer.createdAt" class="question-answer-card">
          <strong>{{ answer.displayName }}</strong>
          <p>{{ answer.answerText }}</p>
        </article>
      </div>
    </section>
  </div>

  <p v-else class="muted">{{ t('garden.noDetails') }}</p>
</template>
