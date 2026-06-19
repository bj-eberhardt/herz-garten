import { pool } from '../../db.js';
import { config } from '../../config.js';

export interface Queryable {
  query: typeof pool.query;
}

export interface GardenArea {
  key: string;
  label: string;
  stageUnlock: number;
  startX: number;
  width: number;
  accent: string;
  backgroundImage: string;
}

export interface GardenAsset {
  key: string;
  label: string;
  objectType: string;
  sourceTypes: string[];
  stageUnlock: number;
  image: string;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  active: boolean;
  sortOrder: number;
}

export interface GardenAssetInput {
  key?: string;
  label: string;
  objectType: string;
  sourceTypes: string[];
  stageUnlock: number;
  image?: string;
  width?: number;
  height?: number;
  anchorX: number;
  anchorY: number;
  active: boolean;
  sortOrder?: number;
}

const areaWidth = 700;
export const fallbackAreaKey = 'heart_bed';

function mapGardenAsset(row: Record<string, unknown>): GardenAsset {
  return {
    key: String(row.key),
    label: String(row.label),
    objectType: String(row.objectType),
    sourceTypes: Array.isArray(row.sourceTypes) ? row.sourceTypes.map(String) : [],
    stageUnlock: Number(row.stageUnlock),
    image: String(row.image),
    width: Number(row.width),
    height: Number(row.height),
    anchorX: Number(row.anchorX),
    anchorY: Number(row.anchorY),
    active: Boolean(row.active),
    sortOrder: Number(row.sortOrder ?? 0),
  };
}

export async function listGardenAreas(locale = config.i18nDefaultLocale, client: Queryable = pool): Promise<GardenArea[]> {
  const result = await client.query<{ areaKey: string; stage: number; label: string; accent: string; backgroundImage: string }>(
    `
      select
        gl.area_key as "areaKey",
        gl.stage,
        coalesce(requested.name, fallback.name) as label,
        gl.accent,
        gl.background_image as "backgroundImage"
      from garden_levels gl
      left join garden_level_translations requested on requested.level_id = gl.id and requested.locale = $1
      left join garden_level_translations fallback on fallback.level_id = gl.id and fallback.locale = $2
      order by gl.stage
    `,
    [locale, config.i18nDefaultLocale],
  );

  return result.rows.map((level) => ({
    key: level.areaKey,
    label: level.label,
    stageUnlock: Number(level.stage),
    startX: (Number(level.stage) - 1) * areaWidth,
    width: areaWidth,
    accent: level.accent,
    backgroundImage: level.backgroundImage,
  }));
}

export async function listGardenAssets(client: Queryable = pool, referencedKeys: string[] = []) {
  const result = await client.query(
    `
      select
        key,
        label,
        object_type as "objectType",
        source_types as "sourceTypes",
        stage_unlock as "stageUnlock",
        image,
        width,
        height,
        anchor_x as "anchorX",
        anchor_y as "anchorY",
        active,
        sort_order as "sortOrder"
      from garden_assets
      where active = true or key = any($1::text[])
      order by sort_order, key
    `,
    [referencedKeys],
  );
  return result.rows.map(mapGardenAsset);
}

export async function listAdminGardenAssets(client: Queryable = pool) {
  const result = await client.query(
    `
      select
        key,
        label,
        object_type as "objectType",
        source_types as "sourceTypes",
        stage_unlock as "stageUnlock",
        image,
        width,
        height,
        anchor_x as "anchorX",
        anchor_y as "anchorY",
        active,
        sort_order as "sortOrder"
      from garden_assets
      order by sort_order, key
    `,
  );
  return result.rows.map(mapGardenAsset);
}

export async function gardenAssetExists(key: string, client: Queryable = pool) {
  const result = await client.query<{ one: number }>('select 1 as one from garden_assets where key = $1 limit 1', [key]);
  return (result.rowCount ?? 0) > 0;
}

export async function gardenAssetObjectType(key: string, client: Queryable = pool) {
  const result = await client.query<{ objectType: string }>('select object_type as "objectType" from garden_assets where key = $1', [key]);
  return result.rows[0]?.objectType ?? 'decoration';
}

export async function saveGardenAsset(input: GardenAssetInput, existingKey?: string, client: Queryable = pool) {
  if (existingKey) {
    const result = await client.query(
      `
        update garden_assets
        set
          label = $2,
          object_type = $3,
          source_types = $4,
          stage_unlock = $5,
          image = coalesce($6, image),
          width = coalesce($7, width),
          height = coalesce($8, height),
          anchor_x = $9,
          anchor_y = $10,
          active = $11,
          sort_order = $12,
          updated_at = now()
        where key = $1
        returning
          key,
          label,
          object_type as "objectType",
          source_types as "sourceTypes",
          stage_unlock as "stageUnlock",
          image,
          width,
          height,
          anchor_x as "anchorX",
          anchor_y as "anchorY",
          active,
          sort_order as "sortOrder"
      `,
      [
        existingKey,
        input.label,
        input.objectType,
        input.sourceTypes,
        input.stageUnlock,
        input.image ?? null,
        input.width ?? null,
        input.height ?? null,
        input.anchorX,
        input.anchorY,
        input.active,
        input.sortOrder ?? 0,
      ],
    );
    return result.rows[0] ? mapGardenAsset(result.rows[0]) : null;
  }

  const result = await client.query(
    `
      insert into garden_assets (
        key, label, object_type, source_types, stage_unlock, image, width, height, anchor_x, anchor_y, active, sort_order, updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
      returning
        key,
        label,
        object_type as "objectType",
        source_types as "sourceTypes",
        stage_unlock as "stageUnlock",
        image,
        width,
        height,
        anchor_x as "anchorX",
        anchor_y as "anchorY",
        active,
        sort_order as "sortOrder"
    `,
    [
      input.key,
      input.label,
      input.objectType,
      input.sourceTypes,
      input.stageUnlock,
      input.image,
      input.width,
      input.height,
      input.anchorX,
      input.anchorY,
      input.active,
      input.sortOrder ?? 0,
    ],
  );
  return mapGardenAsset(result.rows[0]);
}
