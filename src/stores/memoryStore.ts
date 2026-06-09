import { defineStore } from 'pinia';
import type { MemoryEntry } from '@/types/domain';
import { useGardenStore } from './gardenStore';

export const useMemoryStore = defineStore('memories', {
  state: () => ({
    memories: [
      {
        id: 'memory-001',
        coupleId: 'demo-couple',
        authorId: 'demo-a',
        title: 'Unser erster Herzgarten-Samen',
        description: 'Der Moment, in dem der Garten gestartet ist.',
        date: new Date().toISOString().slice(0, 10),
        category: 'milestone',
        createdAt: new Date().toISOString(),
      },
    ] as MemoryEntry[],
  }),
  actions: {
    addMemory(title: string, description?: string) {
      if (!title.trim()) return;
      const id = crypto.randomUUID();
      this.memories.unshift({
        id,
        coupleId: 'demo-couple',
        authorId: 'demo-b',
        title: title.trim(),
        description,
        date: new Date().toISOString().slice(0, 10),
        category: 'everyday',
        createdAt: new Date().toISOString(),
      });
      useGardenStore().addObject({
        type: 'stone',
        sourceType: 'memory',
        sourceId: id,
        label: title.trim(),
      });
    },
  },
});
