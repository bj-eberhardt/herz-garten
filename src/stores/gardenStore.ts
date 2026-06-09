import { defineStore } from 'pinia';
import { apiRequest } from '@/services/api';
import type { Couple, GardenObject, GardenObjectType, GardenSourceType } from '@/types/domain';
import { useAuthStore } from './authStore';
import { useCoupleStore } from './coupleStore';

interface GardenObjectInput {
  type: GardenObjectType;
  sourceType: GardenSourceType;
  sourceId?: string;
  label: string;
}

const fallbackPositions = [
  [18, 62],
  [36, 48],
  [55, 66],
  [74, 42],
  [24, 28],
  [64, 24],
];

export const useGardenStore = defineStore('garden', {
  state: () => ({
    objects: [] as GardenObject[],
    loading: false,
    error: '',
  }),
  actions: {
    async loadGarden() {
      this.loading = true;
      this.error = '';
      try {
        const payload = await apiRequest<{ couple: Couple; objects: GardenObject[] }>('/api/garden');
        this.objects = payload.objects;
        useCoupleStore().setCouple(payload.couple);
        useAuthStore().couple = payload.couple;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Garten konnte nicht geladen werden';
      } finally {
        this.loading = false;
      }
    },
    addObject(input: GardenObjectInput) {
      const couple = useCoupleStore().couple;
      const [positionX, positionY] = fallbackPositions[this.objects.length % fallbackPositions.length];
      this.objects.push({
        id: crypto.randomUUID(),
        coupleId: couple.id,
        positionX,
        positionY,
        level: 1,
        createdAt: new Date().toISOString(),
        ...input,
      });
    },
  },
});
