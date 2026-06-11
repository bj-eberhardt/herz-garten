import { defineStore } from 'pinia';
import { apiRequest } from '@/services/api';
import { localizeApiError } from '@/services/errorMessages';
import type { CategoryOption, Couple, LoveJarCategory, LoveJarNote } from '@/types/domain';
import { useAuthStore } from './authStore';
import { useCoupleStore } from './coupleStore';
import { useGardenStore } from './gardenStore';
import { useNotificationStore } from './notificationStore';

export type LoveJarNoteView = Omit<LoveJarNote, 'text'> & {
  text: string | null;
  authorName?: string;
};

export interface LoveJarDrawStatus {
  drawnToday: boolean;
  canDrawToday: boolean;
  partnerUnreadCount: number;
  ownUnreadCount: number;
}

export interface LoveJarTemplate {
  id: string;
  text: string;
  category: LoveJarCategory;
  categoryLabel?: string;
}

interface LoveJarPayload {
  couple: Couple;
  notes: LoveJarNoteView[];
  drawStatus: LoveJarDrawStatus;
}

export const useLoveJarStore = defineStore('loveJar', {
  state: () => ({
    notes: [] as LoveJarNoteView[],
    drawStatus: {
      drawnToday: false,
      canDrawToday: false,
      partnerUnreadCount: 0,
      ownUnreadCount: 0,
    } as LoveJarDrawStatus,
    templates: [] as LoveJarTemplate[],
    categories: [] as CategoryOption[],
    loading: false,
    error: '',
  }),
  getters: {
    unreadCount: (state) => state.drawStatus.partnerUnreadCount + state.drawStatus.ownUnreadCount,
  },
  actions: {
    applyLoveJarPayload(payload: LoveJarPayload) {
      this.notes = payload.notes;
      this.drawStatus = payload.drawStatus;
      useCoupleStore().setCouple(payload.couple);
      useAuthStore().couple = payload.couple;
    },
    async loadTemplates() {
      try {
        const payload = await apiRequest<{ templates: LoveJarTemplate[]; categories?: CategoryOption[] }>(
          '/api/love-jar/templates',
        );
        this.templates = payload.templates;
        this.categories = payload.categories ?? this.categories;
      } catch (error) {
        this.error = localizeApiError(error, 'errors.fallback.loveJarLoad');
      }
    },
    async loadNotes() {
      this.loading = true;
      this.error = '';
      try {
        const payload = await apiRequest<LoveJarPayload>('/api/love-jar');
        this.applyLoveJarPayload(payload);
      } catch (error) {
        this.error = localizeApiError(error, 'errors.fallback.loveJarLoad');
      } finally {
        this.loading = false;
      }
    },
    async addNote(text: string, category: LoveJarCategory = 'compliment') {
      if (!text.trim()) return;
      this.loading = true;
      this.error = '';
      try {
        const payload = await apiRequest<LoveJarPayload>('/api/love-jar', {
          method: 'POST',
          body: JSON.stringify({
            text: text.trim(),
            category,
          }),
        });
        this.applyLoveJarPayload(payload);
        await useGardenStore().loadGarden();
        await useNotificationStore().loadNotifications();
      } catch (error) {
        this.error = localizeApiError(error, 'errors.fallback.loveJarSave');
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async drawNote() {
      this.loading = true;
      this.error = '';
      try {
        const payload = await apiRequest<LoveJarPayload>('/api/love-jar/draw', {
          method: 'POST',
        });
        this.applyLoveJarPayload(payload);
        await useNotificationStore().loadNotifications();
      } catch (error) {
        this.error = localizeApiError(error, 'errors.fallback.loveJarDraw');
      } finally {
        this.loading = false;
      }
    },
  },
});
