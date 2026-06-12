import {
  fallbackAreaKey,
  gardenAreas,
  gardenAssets,
  gardenStagePointStep,
  gardenUnlocks,
} from './catalog.js';
import { listGardenObjects, updateGardenObjectPlacement, type GardenPlacementUpdate } from './garden.repository.js';
import { mapGardenObject } from './garden.mapper.js';
import { buildGardenObjectDetail, buildGardenProgress, type CurrentCouple } from '../support.repository.js';

export const gardenObjectIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function areaForStage(stage: number) {
  return gardenAreas.filter((area) => area.stageUnlock <= Math.max(1, stage));
}

export function gardenStageForPoints(points: number) {
  return Math.max(1, Math.floor(points / gardenStagePointStep) + 1);
}

export function areaKeyForSource(sourceType: string, questCategory = '') {
  if (sourceType === 'love_jar') return 'light_meadow';
  if (sourceType === 'memory') return 'memory_tree';
  if (sourceType === 'know_me') return 'flower_meadow';
  if (sourceType === 'quest') {
    if (questCategory === 'date' || questCategory === 'romance') return 'picnic';
    if (questCategory === 'memory') return 'memory_tree';
    if (questCategory === 'teamwork') return 'bench_grove';
    if (questCategory === 'long_distance') return 'star_meadow';
    return 'flower_meadow';
  }
  if (sourceType === 'milestone') return 'wishing_well';
  return fallbackAreaKey;
}

export function highestUnlockedAreaForReward(coupleStage: number, sourceType: string, questCategory = '') {
  const targetAreaKey = areaKeyForSource(sourceType, questCategory);
  const unlockedAreas = areaForStage(coupleStage);
  const targetArea = unlockedAreas.find((area) => area.key === targetAreaKey);
  return targetArea?.key ?? unlockedAreas[unlockedAreas.length - 1]?.key ?? fallbackAreaKey;
}

export function nextGardenUnlock(heartPoints: number) {
  const currentStage = gardenStageForPoints(heartPoints);
  const nextUnlock = gardenUnlocks.find((unlock) => unlock.stage > currentStage);
  return nextUnlock
    ? {
        ...nextUnlock,
        pointsRemaining: Math.max(0, nextUnlock.points - heartPoints),
      }
    : null;
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export interface GardenPlacementBody {
  areaKey?: unknown;
  positionX?: unknown;
  positionY?: unknown;
  zIndex?: unknown;
  scale?: unknown;
  rotation?: unknown;
}

export async function buildGardenPayload(couple: CurrentCouple) {
  const objects = await listGardenObjects(couple.id);
  return {
    couple,
    objects: objects.map(mapGardenObject),
    areas: gardenAreas,
    unlocks: gardenUnlocks,
    availableAssets: gardenAssets.filter((asset) => asset.stageUnlock <= Math.max(1, couple.gardenStage)),
    assetCatalog: gardenAssets,
    nextUnlock: nextGardenUnlock(couple.heartPoints),
    progress: await buildGardenProgress(couple.id),
  };
}

export function normalizeGardenPlacement(body: GardenPlacementBody) {
  const positionY = Math.round(clampNumber(body.positionY, 28, 88, 64));
  return {
    areaKey: typeof body.areaKey === 'string' ? body.areaKey.trim() : '',
    positionX: Math.round(clampNumber(body.positionX, 4, 96, 50)),
    positionY,
    zIndex: Math.round(clampNumber(body.zIndex, 1, 99, 1 + positionY / 10)),
    scale: clampNumber(body.scale, 0.7, 1.35, 1),
    rotation: Math.round(clampNumber(body.rotation, -12, 12, 0)),
  };
}

export function isUnlockedGardenArea(areaKey: string, gardenStage: number) {
  return gardenAreas.some((area) => area.key === areaKey && area.stageUnlock <= Math.max(1, gardenStage));
}

export async function placeGardenObject(couple: CurrentCouple, objectId: string, placement: GardenPlacementUpdate) {
  const updated = await updateGardenObjectPlacement(couple.id, objectId, placement);
  return updated ? { couple, object: mapGardenObject(updated) } : null;
}

export async function getGardenObjectDetail(userId: string, objectId: string, locale: string) {
  return buildGardenObjectDetail(userId, objectId, locale);
}
