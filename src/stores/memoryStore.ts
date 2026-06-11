import { defineStore } from 'pinia';
import { apiRequest } from '@/services/api';
import { localizeApiError } from '@/services/errorMessages';
import type { CategoryOption, Couple, MemoryCategory, MemoryEntry } from '@/types/domain';
import { useAuthStore } from './authStore';
import { useCoupleStore } from './coupleStore';
import { useGardenStore } from './gardenStore';
import { useNotificationStore } from './notificationStore';

export type MemoryEntryView = MemoryEntry & {
  authorName?: string;
};

export const useMemoryStore = defineStore('memories', {
  state: () => ({
    memories: [] as MemoryEntryView[],
    categories: [] as CategoryOption[],
    loading: false,
    error: '',
  }),
  actions: {
    applyMemoryPayload(payload: { couple: Couple; memories: MemoryEntryView[]; categories?: CategoryOption[] }) {
      this.memories = payload.memories;
      this.categories = payload.categories ?? this.categories;
      useCoupleStore().setCouple(payload.couple);
      useAuthStore().couple = payload.couple;
    },
    async loadMemories() {
      this.loading = true;
      this.error = '';
      try {
        const payload = await apiRequest<{ couple: Couple; memories: MemoryEntryView[]; categories?: CategoryOption[] }>(
          '/api/memories',
        );
        this.applyMemoryPayload(payload);
      } catch (error) {
        this.error = localizeApiError(error, 'errors.fallback.memoriesLoad');
      } finally {
        this.loading = false;
      }
    },
    async addMemory(input: {
      title: string;
      description?: string;
      date: string;
      category: MemoryCategory;
    }) {
      if (!input.title.trim()) return;
      this.loading = true;
      this.error = '';
      try {
        const payload = await apiRequest<{ couple: Couple; memories: MemoryEntryView[]; categories?: CategoryOption[] }>(
          '/api/memories',
          {
          method: 'POST',
          body: JSON.stringify({
            title: input.title.trim(),
            description: input.description?.trim(),
            date: input.date,
            category: input.category,
          }),
          },
        );
        this.applyMemoryPayload(payload);
        await useGardenStore().loadGarden();
        await useNotificationStore().loadNotifications();
      } catch (error) {
        this.error = localizeApiError(error, 'errors.fallback.memorySave');
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
