import { defineStore } from 'pinia';
import { apiRequest } from '@/services/api';
import type { Couple, KnowMeCatalogQuestion, KnowMeRound } from '@/types/domain';
import { useAuthStore } from './authStore';
import { useCoupleStore } from './coupleStore';
import { useGardenStore } from './gardenStore';
import { useNotificationStore } from './notificationStore';

interface KnowMePayload {
  couple: Couple;
  rounds: KnowMeRound[];
  catalogQuestions: KnowMeCatalogQuestion[];
}

export const useKnowMeStore = defineStore('knowMe', {
  state: () => ({
    rounds: [] as KnowMeRound[],
    catalogQuestions: [] as KnowMeCatalogQuestion[],
    loading: false,
    error: '',
  }),
  getters: {
    openForMe: (state) => {
      const userId = useAuthStore().user?.id;
      return state.rounds.filter((round) => round.status === 'open' && round.authorId !== userId);
    },
    ownOpen: (state) => {
      const userId = useAuthStore().user?.id;
      return state.rounds.filter((round) => round.status === 'open' && round.authorId === userId);
    },
    answeredRounds: (state) => state.rounds.filter((round) => round.status === 'answered'),
  },
  actions: {
    applyPayload(payload: KnowMePayload) {
      this.rounds = payload.rounds;
      this.catalogQuestions = payload.catalogQuestions;
      useCoupleStore().setCouple(payload.couple);
      useAuthStore().couple = payload.couple;
    },
    async loadRounds() {
      this.loading = true;
      this.error = '';
      try {
        this.applyPayload(await apiRequest<KnowMePayload>('/api/know-me'));
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Spiel konnte nicht geladen werden';
      } finally {
        this.loading = false;
      }
    },
    async createRound(input: {
      questionText: string;
      options: string[];
      correctOptionIndex: number;
      catalogQuestionId?: string | null;
    }) {
      this.loading = true;
      this.error = '';
      try {
        this.applyPayload(
          await apiRequest<KnowMePayload>('/api/know-me', {
            method: 'POST',
            body: JSON.stringify(input),
          }),
        );
        await useNotificationStore().loadNotifications();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Frage konnte nicht erstellt werden';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async guess(questionId: string, selectedOptionIndex: number) {
      this.loading = true;
      this.error = '';
      try {
        this.applyPayload(
          await apiRequest<KnowMePayload>(`/api/know-me/${questionId}/guess`, {
            method: 'POST',
            body: JSON.stringify({ selectedOptionIndex }),
          }),
        );
        await useGardenStore().loadGarden();
        await useNotificationStore().loadNotifications();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Antwort konnte nicht gespeichert werden';
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
