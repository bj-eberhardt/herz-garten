<script setup lang="ts">
import { ref } from 'vue';
import { Send } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { useDailyQuestionStore } from '@/stores/dailyQuestionStore';

const dailyQuestionStore = useDailyQuestionStore();
const answer = ref('');
const { t } = useI18n();
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

    <p v-else-if="dailyQuestionStore.answeredByCurrentUser" class="muted" data-testid="today-waiting-status">
      {{ t('today.waitingStatus') }}
    </p>

    <form v-else class="answer-form" data-testid="today-answer-form" @submit.prevent="dailyQuestionStore.submitAnswer(answer).then(() => (answer = ''))">
      <textarea v-model="answer" rows="4" :placeholder="t('today.answerPlaceholder')" data-testid="today-answer-input" />
      <button class="primary-button" type="submit" :disabled="dailyQuestionStore.loading" data-testid="today-answer-submit">
        <Send :size="18" aria-hidden="true" />
        {{ dailyQuestionStore.loading ? t('common.saving') : t('today.sendAnswer') }}
      </button>
    </form>
  </article>
</template>
