import { defineStore } from 'pinia';
import type { LoveJarCategory, LoveJarNote } from '@/types/domain';
import { useGardenStore } from './gardenStore';

export const useLoveJarStore = defineStore('loveJar', {
  state: () => ({
    notes: [
      {
        id: 'note-001',
        coupleId: 'demo-couple',
        authorId: 'demo-a',
        text: 'Ich liebe, wie du kleinen Momenten Bedeutung gibst.',
        category: 'compliment',
        isDrawn: false,
        createdAt: new Date().toISOString(),
      },
    ] as LoveJarNote[],
  }),
  actions: {
    addNote(text: string, category: LoveJarCategory = 'compliment') {
      if (!text.trim()) return;
      this.notes.unshift({
        id: crypto.randomUUID(),
        coupleId: 'demo-couple',
        authorId: 'demo-b',
        text: text.trim(),
        category,
        isDrawn: false,
        createdAt: new Date().toISOString(),
      });
      useGardenStore().addObject({
        type: 'light',
        sourceType: 'love_jar',
        label: 'Love-Jar-Licht',
      });
    },
    drawNote() {
      const note = this.notes.find((item) => !item.isDrawn);
      if (!note) return;
      note.isDrawn = true;
      note.drawnAt = new Date().toISOString();
    },
  },
});
