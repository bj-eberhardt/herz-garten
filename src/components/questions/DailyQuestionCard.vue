<script setup lang="ts">
import { ref } from 'vue';
import { Send } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { useDailyQuestionStore } from '@/stores/dailyQuestionStore';

const dailyQuestionStore = useDailyQuestionStore();
const answer = ref('');
const submitAttempted = ref(false);
const { t } = useI18n();

async function submitAnswer() {
  await dailyQuestionStore.submitAnswer(answer.value);
  answer.value = '';
  submitAttempted.value = false;
}
</script>

<template>
  <article class="panel daily-card" data-testid="today-card">
    <div v-if="dailyQuestionStore.question">
      <p class="eyebrow">{{ t('today.dailyQuestion') }}</p>
      <h1>{{ dailyQuestionStore.question.text }}</h1>
    </div>
    <p v-else>{{ t('today.noQuestion') }}</p>

    <p v-if="dailyQuestionStore.error" class="form-error">{{ dailyQuestionStore.error }}</p>

    <div v-if="dailyQuestionStore.hasBothAnswers" class="answers" data-testid="today-reveal-answers">
      <p v-for="item in dailyQuestionStore.answers" :key="item.id" data-testid="today-reveal-answer">
        <strong>{{ item.displayName }}:</strong> {{ item.answerText }}
      </p>
    </div>

    <p v-else-if="dailyQuestionStore.answeredByCurrentUser" class="success-note" data-testid="today-waiting-status">
      {{ t('today.waitingStatus') }}
    </p>

    <form v-else class="answer-form" :class="{ 'form-submitted': submitAttempted }" data-testid="today-answer-form" @submit.prevent="submitAnswer">
      <textarea v-model="answer" rows="4" :placeholder="t('today.answerPlaceholder')" data-testid="today-answer-input" required />
      <button class="primary-button" type="submit" :disabled="dailyQuestionStore.loading" data-testid="today-answer-submit" @click="submitAttempted = true">
        <Send :size="18" aria-hidden="true" />
        {{ dailyQuestionStore.loading ? t('common.saving') : t('today.sendAnswer') }}
      </button>
    </form>
  </article>
</template>
