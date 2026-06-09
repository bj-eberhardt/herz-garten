import { defineStore } from 'pinia';
import { ApiError, apiRequest } from '@/services/api';
import type { Couple, LoveJarCategory, LoveJarNote } from '@/types/domain';
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
    async loadNotes() {
      this.loading = true;
      this.error = '';
      try {
        const payload = await apiRequest<LoveJarPayload>('/api/love-jar');
        this.applyLoveJarPayload(payload);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Love Jar konnte nicht geladen werden';
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
        this.error = error instanceof Error ? error.message : 'Zettel konnte nicht gespeichert werden';
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
        if (error instanceof ApiError && error.status === 409) {
          this.error = 'Du hast heute schon einen Zettel gezogen. Morgen wartet wieder einer auf dich.';
          return;
        }
        if (error instanceof ApiError && error.status === 404) {
          this.error = 'Gerade ist kein ungelesener Zettel im Glas. Schreibt euch neue kleine Botschaften.';
          return;
        }
        this.error = error instanceof Error ? error.message : 'Zettel konnte nicht gezogen werden';
      } finally {
        this.loading = false;
      }
    },
  },
});
