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
    selectedDetail: null as null | {
      object: GardenObject;
      source: Record<string, unknown> | null;
    },
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
    async loadObjectDetail(objectId: string) {
      this.loading = true;
      this.error = '';
      try {
        const payload = await apiRequest<{
          couple: Couple;
          object: GardenObject;
          source: Record<string, unknown> | null;
        }>(`/api/garden/objects/${objectId}`);
        this.selectedDetail = {
          object: payload.object,
          source: payload.source,
        };
        useCoupleStore().setCouple(payload.couple);
        useAuthStore().couple = payload.couple;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Gartenobjekt konnte nicht geladen werden';
      } finally {
        this.loading = false;
      }
    },
    clearDetail() {
      this.selectedDetail = null;
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
