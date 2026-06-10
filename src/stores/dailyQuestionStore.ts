import { defineStore } from 'pinia';
import { apiRequest } from '@/services/api';
import { localizeApiError } from '@/services/errorMessages';
import type { Couple, DailyQuestion, DailyQuestionAnswer } from '@/types/domain';
import { useAuthStore } from './authStore';
import { useCoupleStore } from './coupleStore';
import { useNotificationStore } from './notificationStore';

type TodayAnswer = Omit<DailyQuestionAnswer, 'answerText'> & {
  displayName?: string;
  answerText: string | null;
};

export const useDailyQuestionStore = defineStore('dailyQuestion', {
  state: () => ({
    question: null as DailyQuestion | null,
    answers: [] as TodayAnswer[],
    answeredByCurrentUser: false,
    revealed: false,
    loading: false,
    error: '',
  }),
  getters: {
    hasBothAnswers: (state) => state.revealed,
  },
  actions: {
    applyToday(payload: {
      couple: Couple;
      question: DailyQuestion;
      answers: TodayAnswer[];
      answeredByCurrentUser: boolean;
      revealed: boolean;
    }) {
      this.question = payload.question;
      this.answers = payload.answers;
      this.answeredByCurrentUser = payload.answeredByCurrentUser;
      this.revealed = payload.revealed;
      const coupleStore = useCoupleStore();
      coupleStore.setCouple(payload.couple);
      useAuthStore().couple = payload.couple;
    },
    async loadToday() {
      this.loading = true;
      this.error = '';
      try {
        const payload = await apiRequest<{
          couple: Couple;
          question: DailyQuestion;
          answers: TodayAnswer[];
          answeredByCurrentUser: boolean;
          revealed: boolean;
        }>('/api/today');
        this.applyToday(payload);
      } catch (error) {
        this.error = localizeApiError(error, 'errors.fallback.todayLoad');
      } finally {
        this.loading = false;
      }
    },
    async submitAnswer(answerText: string) {
      if (!answerText.trim()) return;
      this.loading = true;
      this.error = '';
      try {
        const payload = await apiRequest<{
          couple: Couple;
          question: DailyQuestion;
          answers: TodayAnswer[];
          answeredByCurrentUser: boolean;
          revealed: boolean;
        }>('/api/today/answer', {
          method: 'POST',
          body: JSON.stringify({ answerText }),
        });
        this.applyToday(payload);
        await useNotificationStore().loadNotifications();
      } catch (error) {
        this.error = localizeApiError(error, 'errors.fallback.todayAnswer');
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
