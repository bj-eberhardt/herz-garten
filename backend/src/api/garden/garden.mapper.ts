import { fallbackAreaKey } from './catalog.js';

export interface GardenObjectRow {
  id: string;
  coupleId: string;
  type: string;
  sourceType: string;
  sourceId: string | null;
  label: string;
  areaKey: string | null;
  assetKey: string | null;
  historyTitle?: string | null;
  positionX: number;
  positionY: number;
  zIndex: number | null;
  scale: number | string | null;
  rotation: number | null;
  placedByUser: boolean;
  rewardPoints: number | string | null;
  level: number;
  createdAt: Date | string;
}

export function assetKeyForQuest(category: string) {
  if (category === 'date') return 'picnic_blanket';
  if (category === 'romance') return 'date_pavilion';
  if (category === 'memory') return 'polaroid_frame';
  if (category === 'teamwork') return 'memory_tree';
  if (category === 'long_distance') return 'distance_bridge';
  if (category === 'humor') return 'garden_decor';
  return 'warm_lantern';
}

export function assetKeyForGardenObject(type: string, sourceType: string, category = '') {
  if (sourceType === 'question') return 'conversation_flower';
  if (sourceType === 'love_jar') return 'warm_lantern';
  if (sourceType === 'memory') return 'memory_stone';
  if (sourceType === 'know_me') return 'heart_flower';
  if (sourceType === 'quest') return assetKeyForQuest(category);
  if (type === 'tree') return 'memory_tree';
  if (type === 'bench') return 'couple_bench';
  if (type === 'pond') return 'quiet_pond';
  if (type === 'stone') return 'memory_stone';
  if (type === 'light') return 'warm_lantern';
  return 'garden_decor';
}

export function mapGardenObject(row: GardenObjectRow) {
  return {
    id: row.id,
    coupleId: row.coupleId,
    type: row.type,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    label: row.label,
    areaKey: row.areaKey ?? fallbackAreaKey,
    assetKey: row.assetKey ?? assetKeyForGardenObject(String(row.type), String(row.sourceType)),
    historyTitle: row.historyTitle ?? row.label,
    positionX: row.positionX,
    positionY: row.positionY,
    zIndex: row.zIndex ?? 1,
    scale: Number(row.scale ?? 1),
    rotation: row.rotation ?? 0,
    placedByUser: Boolean(row.placedByUser),
    rewardPoints: Number(row.rewardPoints ?? 0),
    level: row.level,
    createdAt: row.createdAt,
  };
}
