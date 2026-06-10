import { defineStore } from 'pinia';
import { apiRequest } from '@/services/api';
import { i18n } from '@/i18n';
import { localizeApiError } from '@/services/errorMessages';
import type { Couple, Quest } from '@/types/domain';
import { useAuthStore } from './authStore';
import { useCoupleStore } from './coupleStore';
import { useGardenStore } from './gardenStore';
import { useNotificationStore } from './notificationStore';

export interface QuestProgress {
  id: string;
  status: 'available' | 'accepted' | 'completed';
  completedByUserIds: string[];
  completedAt?: string;
  rewardAppliedAt?: string;
}

export type QuestWithProgress = Quest & {
  coupleQuest: QuestProgress | null;
};

export interface QuestFilters {
  category: Quest['category'] | 'all';
  effortLevel: Quest['effortLevel'] | 'all';
  maxMinutes: 'all' | '5' | '10' | '15' | '30';
  mode: 'all' | 'solo' | 'together' | 'long_distance';
}

const defaultFilters: QuestFilters = {
  category: 'all',
  effortLevel: 'all',
  maxMinutes: 'all',
  mode: 'all',
};

export const useQuestStore = defineStore('quests', {
  state: () => ({
    quests: [] as QuestWithProgress[],
    filters: { ...defaultFilters },
    loading: false,
    error: '',
  }),
  actions: {
    applyQuestPayload(payload: { couple: Couple; quests: QuestWithProgress[] }) {
      this.quests = payload.quests;
      useCoupleStore().setCouple(payload.couple);
      useAuthStore().couple = payload.couple;
    },
    async loadQuests(filters: Partial<QuestFilters> = {}) {
      this.filters = { ...this.filters, ...filters };
      this.loading = true;
      this.error = '';
      try {
        const params = new URLSearchParams();
        Object.entries(this.filters).forEach(([key, value]) => {
          if (value !== 'all') params.set(key, value);
        });
        const query = params.toString();
        const payload = await apiRequest<{ couple: Couple; quests: QuestWithProgress[] }>(
          `/api/quests${query ? `?${query}` : ''}`,
        );
        this.applyQuestPayload(payload);
      } catch (error) {
        this.error = localizeApiError(error, 'errors.fallback.questsLoad');
      } finally {
        this.loading = false;
      }
    },
    async acceptQuest(questId: string) {
      await this.sendQuestAction(`/api/quests/${questId}/accept`);
    },
    async completeQuest(questId: string) {
      await this.sendQuestAction(`/api/quests/${questId}/complete`);
      await useGardenStore().loadGarden();
    },
    async sendQuestAction(path: string) {
      this.loading = true;
      this.error = '';
      try {
        const payload = await apiRequest<{ couple: Couple; quests: QuestWithProgress[] }>(path, {
          method: 'POST',
        });
        this.applyQuestPayload(payload);
        await useNotificationStore().loadNotifications();
      } catch (error) {
        this.error = localizeApiError(error, 'errors.fallback.questUpdate');
        throw error;
      } finally {
        this.loading = false;
      }
    },
    statusFor(quest: QuestWithProgress) {
      return quest.coupleQuest?.status ?? 'available';
    },
    completedByCurrentUser(quest: QuestWithProgress, currentUserId?: string) {
      return Boolean(currentUserId && quest.coupleQuest?.completedByUserIds.includes(currentUserId));
    },
    buttonLabel(quest: QuestWithProgress, currentUserId?: string) {
      const status = this.statusFor(quest);
      if (status === 'completed') return i18n.global.t('quests.actions.completed');
      if (this.completedByCurrentUser(quest, currentUserId)) return i18n.global.t('quests.actions.waitingPartner');
      if (status === 'accepted') return i18n.global.t('quests.actions.confirmComplete');
      return i18n.global.t('quests.actions.accept');
    },
    buttonDisabled(quest: QuestWithProgress, currentUserId?: string) {
      return this.statusFor(quest) === 'completed' || this.completedByCurrentUser(quest, currentUserId) || this.loading;
    },
    async primaryAction(quest: QuestWithProgress) {
      const status = this.statusFor(quest);

      if (status === 'available') {
        await this.acceptQuest(quest.id);
        return;
      }

      if (status === 'accepted') {
        await this.completeQuest(quest.id);
      }
    },
  },
});
