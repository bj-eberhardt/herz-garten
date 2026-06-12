import { fallbackAreaKey, gardenAssets } from './catalog.js';

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

export function objectTypeForAsset(assetKey: string) {
  return gardenAssets.find((asset) => asset.key === assetKey)?.objectType ?? 'decoration';
}

export function mapGardenObject(row: Record<string, unknown>) {
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
