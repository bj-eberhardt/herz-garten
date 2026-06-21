import { pool } from '../../db.js';
import type { Queryable } from './catalog.js';
import { assetKeyForGardenObject, assetKeyForQuest } from './garden.mapper.js';

export interface SelectedGardenAsset {
  key: string;
}

export interface GardenAssetSelectionInput {
  sourceType: string;
  gardenStage: number;
  category?: string;
}

export function objectTypeForGardenReward(sourceType: string, category = '') {
  if (sourceType === 'question') return 'flower';
  if (sourceType === 'love_jar') return 'light';
  if (sourceType === 'memory') return 'stone';
  if (sourceType === 'know_me') return 'flower';
  if (sourceType === 'quest' && category === 'teamwork') return 'tree';
  return 'decoration';
}

function fallbackAssetKey(input: GardenAssetSelectionInput) {
  if (input.sourceType === 'quest') return assetKeyForQuest(input.category ?? '');
  return assetKeyForGardenObject(objectTypeForGardenReward(input.sourceType, input.category), input.sourceType, input.category ?? '');
}

export async function selectGardenAssetForReward(
  client: Queryable = pool,
  input: GardenAssetSelectionInput,
): Promise<SelectedGardenAsset> {
  const result = await client.query<SelectedGardenAsset>(
    `
      select
        key
      from garden_assets
      where active = true
        and stage_unlock <= $1
        and $2 = any(source_types)
      order by sort_order, key
      limit 1
    `,
    [Math.max(1, input.gardenStage), input.sourceType],
  );

  if (result.rows[0]) return result.rows[0];

  const fallbackKey = fallbackAssetKey(input);
  console.error('No matching garden asset found for reward; using fallback asset.', {
    sourceType: input.sourceType,
    category: input.category ?? '',
    gardenStage: Math.max(1, input.gardenStage),
    fallbackKey,
  });

  return {
    key: fallbackKey,
  };
}
