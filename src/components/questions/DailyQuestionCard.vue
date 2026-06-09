<script setup lang="ts">
import { ref } from 'vue';
import { Send } from '@lucide/vue';
import { useDailyQuestionStore } from '@/stores/dailyQuestionStore';

const dailyQuestionStore = useDailyQuestionStore();
const answer = ref('');
</script>

<template>
  <article class="panel daily-card">
    <div v-if="dailyQuestionStore.question">
      <p class="eyebrow">Tagesfrage</p>
      <h1>{{ dailyQuestionStore.question.text }}</h1>
    </div>
    <p v-else>Keine Tagesfrage geladen.</p>

    <p v-if="dailyQuestionStore.error" class="form-error">{{ dailyQuestionStore.error }}</p>

    <div v-if="dailyQuestionStore.hasBothAnswers" class="answers">
      <p v-for="item in dailyQuestionStore.answers" :key="item.id">
        <strong>{{ item.displayName }}:</strong> {{ item.answerText }}
      </p>
    </div>

    <p v-else-if="dailyQuestionStore.answeredByCurrentUser" class="muted">
      Deine Antwort ist gespeichert. Sie wird sichtbar, sobald dein Partner geantwortet hat.
    </p>

    <form v-else class="answer-form" @submit.prevent="dailyQuestionStore.submitAnswer(answer).then(() => (answer = ''))">
      <textarea v-model="answer" rows="4" placeholder="Deine Antwort bleibt verborgen, bis beide geantwortet haben." />
      <button class="primary-button" type="submit" :disabled="dailyQuestionStore.loading">
        <Send :size="18" aria-hidden="true" />
        {{ dailyQuestionStore.loading ? 'Speichert...' : 'Antwort senden' }}
      </button>
    </form>
  </article>
</template>
