import {
  fallbackAreaKey,
  listGardenAreas,
  listGardenAssets,
  type GardenArea,
} from './catalog.js';
import { listGardenObjects, updateGardenObjectPlacement, type GardenPlacementUpdate } from './garden.repository.js';
import { mapGardenObject } from './garden.mapper.js';
import { buildGardenObjectDetail, buildGardenProgress, type CurrentCouple } from '../support.repository.js';
import {
  gardenUnlocksForLocale,
  nextGardenUnlock,
} from './levels.repository.js';

export const gardenObjectIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function areaForStage(stage: number, areas: GardenArea[]) {
  return areas.filter((area) => area.stageUnlock <= Math.max(1, stage));
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

export async function highestUnlockedAreaForReward(coupleStage: number, sourceType: string, questCategory = '') {
  const areas = await listGardenAreas();
  const targetAreaKey = areaKeyForSource(sourceType, questCategory);
  const unlockedAreas = areaForStage(coupleStage, areas);
  const targetArea = unlockedAreas.find((area) => area.key === targetAreaKey);
  return targetArea?.key ?? unlockedAreas[unlockedAreas.length - 1]?.key ?? fallbackAreaKey;
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

export async function buildGardenPayload(couple: CurrentCouple, locale = 'de') {
  const objects = await listGardenObjects(couple.id);
  const areas = await listGardenAreas(locale);
  const assets = await listGardenAssets(undefined, [...new Set(objects.map((object) => object.assetKey).filter(Boolean).map(String))]);
  const unlocks = await gardenUnlocksForLocale(locale);
  return {
    couple,
    objects: objects.map(mapGardenObject),
    areas,
    unlocks,
    availableAssets: assets.filter((asset) => asset.active && asset.stageUnlock <= Math.max(1, couple.gardenStage)),
    assetCatalog: assets,
    nextUnlock: await nextGardenUnlock(couple.heartPoints, locale),
    progress: await buildGardenProgress(couple.id),
  };
}

export function normalizeGardenPlacement(body: GardenPlacementBody) {
  const placement: GardenPlacementUpdate = {};
  if (typeof body.areaKey === 'string') placement.areaKey = body.areaKey.trim();
  if (body.positionX !== undefined) placement.positionX = Math.round(clampNumber(body.positionX, 4, 96, 50));
  if (body.positionY !== undefined) placement.positionY = Math.round(clampNumber(body.positionY, 28, 88, 64));
  if (body.zIndex !== undefined) placement.zIndex = Math.round(clampNumber(body.zIndex, 1, 99, 1));
  if (body.scale !== undefined) placement.scale = clampNumber(body.scale, 0.7, 1.35, 1);
  if (body.rotation !== undefined) placement.rotation = Math.round(clampNumber(body.rotation, -12, 12, 0));
  return placement;
}

export async function isUnlockedGardenArea(areaKey: string, gardenStage: number) {
  const areas = await listGardenAreas();
  return areas.some((area) => area.key === areaKey && area.stageUnlock <= Math.max(1, gardenStage));
}

export async function placeGardenObject(couple: CurrentCouple, objectId: string, placement: GardenPlacementUpdate) {
  const updated = await updateGardenObjectPlacement(couple.id, objectId, placement);
  return updated ? { couple, object: mapGardenObject(updated) } : null;
}

export async function getGardenObjectDetail(userId: string, objectId: string, locale: string) {
  return buildGardenObjectDetail(userId, objectId, locale);
}
