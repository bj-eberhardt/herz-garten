import { defineStore } from 'pinia';
import { apiRequest } from '@/services/api';
import type { Couple, LoveJarCategory, LoveJarNote } from '@/types/domain';
import { useAuthStore } from './authStore';
import { useCoupleStore } from './coupleStore';
import { useGardenStore } from './gardenStore';

export type LoveJarNoteView = Omit<LoveJarNote, 'text'> & {
  text: string | null;
  authorName?: string;
};

export const useLoveJarStore = defineStore('loveJar', {
  state: () => ({
    notes: [] as LoveJarNoteView[],
    loading: false,
    error: '',
  }),
  actions: {
    applyLoveJarPayload(payload: { couple: Couple; notes: LoveJarNoteView[] }) {
      this.notes = payload.notes;
      useCoupleStore().setCouple(payload.couple);
      useAuthStore().couple = payload.couple;
    },
    async loadNotes() {
      this.loading = true;
      this.error = '';
      try {
        const payload = await apiRequest<{ couple: Couple; notes: LoveJarNoteView[] }>('/api/love-jar');
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
        const payload = await apiRequest<{ couple: Couple; notes: LoveJarNoteView[] }>('/api/love-jar', {
          method: 'POST',
          body: JSON.stringify({
            text: text.trim(),
            category,
          }),
        });
        this.applyLoveJarPayload(payload);
        await useGardenStore().loadGarden();
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
        const payload = await apiRequest<{ couple: Couple; notes: LoveJarNoteView[] }>('/api/love-jar/draw', {
          method: 'POST',
        });
        this.applyLoveJarPayload(payload);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Kein ungelesener Partner-Zettel verfuegbar';
      } finally {
        this.loading = false;
      }
    },
  },
});
