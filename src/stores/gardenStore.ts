import { defineStore } from 'pinia';
import { apiRequest } from '@/services/api';
import { localizeApiError } from '@/services/errorMessages';
import type {
  Couple,
  GardenArea,
  GardenAreaKey,
  GardenAsset,
  GardenNextUnlock,
  GardenObject,
  GardenObjectType,
  GardenSourceType,
  GardenUnlock,
} from '@/types/domain';
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

export interface GardenProgress {
  answeredQuestionCount: number;
  completedQuestCount: number;
  loveJarNoteCount: number;
  drawnLoveJarNoteCount: number;
  memoryCount: number;
  knowMeRoundCount: number;
  knowMeHitCount: number;
  gardenObjectCount: number;
  lastGardenMomentAt?: string | null;
}

export const useGardenStore = defineStore('garden', {
  state: () => ({
    objects: [] as GardenObject[],
    areas: [] as GardenArea[],
    unlocks: [] as GardenUnlock[],
    availableAssets: [] as GardenAsset[],
    assetCatalog: [] as GardenAsset[],
    nextUnlock: null as GardenNextUnlock | null,
    progress: {
      answeredQuestionCount: 0,
      completedQuestCount: 0,
      loveJarNoteCount: 0,
      drawnLoveJarNoteCount: 0,
      memoryCount: 0,
      knowMeRoundCount: 0,
      knowMeHitCount: 0,
      gardenObjectCount: 0,
      lastGardenMomentAt: null,
    } as GardenProgress,
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
        const payload = await apiRequest<{
          couple: Couple;
          objects: GardenObject[];
          areas?: GardenArea[];
          unlocks?: GardenUnlock[];
          availableAssets?: GardenAsset[];
          assetCatalog?: GardenAsset[];
          nextUnlock?: GardenNextUnlock | null;
          progress: GardenProgress;
        }>('/api/garden');
        this.objects = payload.objects;
        this.areas = payload.areas ?? [];
        this.unlocks = payload.unlocks ?? [];
        this.availableAssets = payload.availableAssets ?? [];
        this.assetCatalog = payload.assetCatalog ?? payload.availableAssets ?? [];
        this.nextUnlock = payload.nextUnlock ?? null;
        this.progress = payload.progress;
        useCoupleStore().setCouple(payload.couple);
        useAuthStore().couple = payload.couple;
      } catch (error) {
        this.error = localizeApiError(error, 'errors.fallback.gardenLoad');
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
        this.error = localizeApiError(error, 'errors.fallback.gardenObject');
      } finally {
        this.loading = false;
      }
    },
    clearDetail() {
      this.selectedDetail = null;
    },
    async updatePlacement(
      objectId: string,
      placement: {
        areaKey: GardenAreaKey;
        positionX: number;
        positionY: number;
        zIndex: number;
        scale?: number;
        rotation?: number;
      },
    ) {
      this.error = '';
      try {
        const payload = await apiRequest<{ couple: Couple; object: GardenObject }>(
          `/api/garden/objects/${objectId}/placement`,
          {
            method: 'PATCH',
            body: JSON.stringify(placement),
          },
        );
        const index = this.objects.findIndex((object) => object.id === objectId);
        if (index >= 0) this.objects[index] = payload.object;
        if (this.selectedDetail?.object.id === objectId) this.selectedDetail.object = payload.object;
        useCoupleStore().setCouple(payload.couple);
        useAuthStore().couple = payload.couple;
      } catch (error) {
        this.error = localizeApiError(error, 'errors.fallback.gardenObject');
        throw error;
      }
    },
    addObject(input: GardenObjectInput) {
      const couple = useCoupleStore().couple;
      const [positionX, positionY] = fallbackPositions[this.objects.length % fallbackPositions.length];
      this.objects.push({
        id: crypto.randomUUID(),
        coupleId: couple.id,
        areaKey: 'heart_bed',
        assetKey: input.type === 'light' ? 'warm_lantern' : input.type === 'stone' ? 'memory_stone' : 'conversation_flower',
        positionX,
        positionY,
        zIndex: 1,
        scale: 1,
        rotation: 0,
        placedByUser: false,
        rewardPoints: 0,
        level: 1,
        createdAt: new Date().toISOString(),
        ...input,
      });
    },
  },
});
