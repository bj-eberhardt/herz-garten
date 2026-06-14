import { randomUUID } from 'node:crypto';
import { pool } from '../../db.js';
import { withTransaction } from '../../db/transaction.js';
import { fallbackAreaKey, gardenAreas } from './catalog.js';

export interface Queryable {
  query: typeof pool.query;
}

export interface GardenLevelRow {
  id: string;
  stage: number;
  name: string;
  localizedName: string;
  pointsToNext: number | null;
  minimumPoints: number;
  translations: Record<string, { name: string }>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface GardenLevelInput {
  name: string;
  pointsToNext?: number | null;
  translations?: Record<string, { name?: string }>;
}

export class GardenLevelValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GardenLevelValidationError';
  }
}

export interface GardenUnlockConfig {
  stage: number;
  points: number;
  name: string;
  areaKey: string;
  areaLabel: string;
  unlock: string;
}

function normalizeName(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePoints(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function translationsFromInput(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, { name?: unknown }>;
}

function withMinimumPoints<T extends { pointsToNext: number | null }>(rows: T[]) {
  let minimumPoints = 0;
  return rows.map((row, index) => {
    const item = { ...row, minimumPoints };
    if (index < rows.length - 1) {
      minimumPoints += Number(row.pointsToNext ?? 0);
    }
    return item;
  });
}

export function calculateGardenStage(points: number, levels: Array<{ stage: number; minimumPoints: number }>) {
  const normalizedPoints = Math.max(0, Math.floor(Number(points) || 0));
  let stage = 1;
  for (const level of levels) {
    if (normalizedPoints >= level.minimumPoints) stage = level.stage;
  }
  return stage;
}

function highestAreaKeyForStage(stage: number) {
  return (
    gardenAreas
      .filter((area) => area.stageUnlock <= Math.max(1, stage))
      .sort((left, right) => right.stageUnlock - left.stageUnlock)[0]?.key ?? fallbackAreaKey
  );
}

export async function listGardenLevels(locale = 'de', client: Queryable = pool) {
  const result = await client.query(
    `
      select
        gl.id,
        gl.stage,
        gl.name,
        coalesce(requested.name, fallback.name, gl.name) as "localizedName",
        gl.points_to_next as "pointsToNext",
        gl.created_at as "createdAt",
        gl.updated_at as "updatedAt",
        coalesce(json_object_agg(t.locale, json_build_object('name', t.name)) filter (where t.locale is not null), '{}'::json) as translations
      from garden_levels gl
      left join garden_level_translations t on t.level_id = gl.id
      left join garden_level_translations requested on requested.level_id = gl.id and requested.locale = $1
      left join garden_level_translations fallback on fallback.level_id = gl.id and fallback.locale = 'de'
      group by gl.id, requested.name, fallback.name
      order by gl.stage
    `,
    [locale],
  );

  return withMinimumPoints(result.rows).map((row) => ({
    ...row,
    pointsToNext: row.pointsToNext === null ? null : Number(row.pointsToNext),
    minimumPoints: Number(row.minimumPoints),
  })) as GardenLevelRow[];
}

export async function gardenStageForPoints(points: number, client: Queryable = pool) {
  const levels = await listGardenLevels('de', client);
  return calculateGardenStage(points, levels);
}

export async function gardenStageAfterReward(client: Queryable, coupleId: string, rewardPoints: number) {
  const result = await client.query<{ heartPoints: number }>('select heart_points as "heartPoints" from couples where id = $1', [
    coupleId,
  ]);
  return gardenStageForPoints(Number(result.rows[0]?.heartPoints ?? 0) + rewardPoints, client);
}

export async function addCoupleHeartPoints(client: Queryable, coupleId: string, points: number) {
  const result = await client.query<{ heartPoints: number }>(
    'update couples set heart_points = heart_points + $2 where id = $1 returning heart_points as "heartPoints"',
    [coupleId, points],
  );
  const nextStage = await gardenStageForPoints(Number(result.rows[0]?.heartPoints ?? 0), client);
  await client.query('update couples set garden_stage = $2 where id = $1', [coupleId, nextStage]);
}

export function validateGardenLevelSequence(levels: Array<{ stage: number; pointsToNext: number | null }>) {
  if (levels.length === 0 || levels[0]?.stage !== 1) {
    throw new GardenLevelValidationError('Garden-Level muessen bei Stufe 1 beginnen.');
  }

  for (let index = 0; index < levels.length; index += 1) {
    const expectedStage = index + 1;
    const level = levels[index];
    if (level.stage !== expectedStage) {
      throw new GardenLevelValidationError('Garden-Level muessen lueckenlos sortiert sein.');
    }
    if (index < levels.length - 1 && (!Number.isInteger(level.pointsToNext) || Number(level.pointsToNext) <= 0)) {
      throw new GardenLevelValidationError('Alle Stufen ausser der letzten brauchen positive Punkte bis zur naechsten Stufe.');
    }
    if (level.pointsToNext !== null && (!Number.isInteger(level.pointsToNext) || Number(level.pointsToNext) <= 0)) {
      throw new GardenLevelValidationError('Punkte bis zur naechsten Stufe muessen positiv sein.');
    }
  }
}

async function upsertTranslations(client: Queryable, levelId: string, translations: unknown) {
  for (const [locale, translation] of Object.entries(translationsFromInput(translations))) {
    const name = normalizeName(translation.name);
    if (!name) continue;
    await client.query(
      `
        insert into garden_level_translations (level_id, locale, name)
        values ($1, $2, $3)
        on conflict (level_id, locale) do update set name = excluded.name
      `,
      [levelId, locale, name],
    );
  }
}

async function recalculateCoupleStages(client: Queryable, levels: GardenLevelRow[]) {
  const couplesResult = await client.query<{ id: string; heartPoints: number }>('select id, heart_points as "heartPoints" from couples');
  for (const couple of couplesResult.rows) {
    const stage = calculateGardenStage(Number(couple.heartPoints ?? 0), levels);
    await client.query('update couples set garden_stage = $2 where id = $1', [couple.id, stage]);
  }
}

async function rebalanceGardenObjects(client: Queryable, levels: GardenLevelRow[]) {
  const objectsResult = await client.query<{
    id: string;
    coupleId: string;
    rewardPoints: number | string | null;
  }>(
    `
      select
        id,
        couple_id as "coupleId",
        reward_points as "rewardPoints"
      from garden_objects
      order by couple_id, created_at, id
    `,
  );

  let currentCoupleId = '';
  let runningPoints = 0;
  for (const object of objectsResult.rows) {
    if (object.coupleId !== currentCoupleId) {
      currentCoupleId = object.coupleId;
      runningPoints = 0;
    }

    runningPoints += Math.max(0, Number(object.rewardPoints ?? 0));
    const targetStage = calculateGardenStage(runningPoints, levels);
    const targetAreaKey = highestAreaKeyForStage(targetStage);
    await client.query(
      `
        update garden_objects
        set area_key = $2,
            placed_by_user = false
        where id = $1
      `,
      [object.id, targetAreaKey],
    );
  }
}

async function recalculateGardens(client: Queryable) {
  const levels = await listGardenLevels('de', client);
  validateGardenLevelSequence(levels);

  await recalculateCoupleStages(client, levels);
  await rebalanceGardenObjects(client, levels);
}

export async function saveGardenLevel(input: GardenLevelInput, id?: string, locale = 'de') {
  const name = normalizeName(input.name);
  if (!name) throw new GardenLevelValidationError('Bitte gib einen Namen fuer das Garden-Level ein.');
  const pointsToNext = normalizePoints(input.pointsToNext);
  if (input.pointsToNext !== null && input.pointsToNext !== undefined && pointsToNext === null) {
    throw new GardenLevelValidationError('Punkte bis zur naechsten Stufe muessen positiv sein.');
  }

  return withTransaction(async (client) => {
    let levelId = id;
    let stage: number;
    if (levelId) {
      const existing = await client.query<{ stage: number }>('select stage from garden_levels where id = $1', [levelId]);
      if (!existing.rows[0]) throw new Error('garden level not found');
      stage = Number(existing.rows[0].stage);
    } else {
      levelId = randomUUID();
      const maxResult = await client.query<{ stage: number }>('select coalesce(max(stage), 0)::int + 1 as stage from garden_levels');
      stage = Number(maxResult.rows[0]?.stage ?? 1);
      if (stage > 1 && pointsToNext === null) {
        throw new GardenLevelValidationError('Neue Stufen brauchen positive Punkte von der bisherigen letzten Stufe bis hierher.');
      }
    }

    await client.query(
      `
        insert into garden_levels (id, stage, name, points_to_next, updated_at)
        values ($1, $2, $3, $4, now())
        on conflict (id) do update set
          name = excluded.name,
          points_to_next = excluded.points_to_next,
          updated_at = now()
      `,
      [levelId, stage, name, id ? pointsToNext : null],
    );
    if (!id && stage > 1) {
      await client.query('update garden_levels set points_to_next = $2, updated_at = now() where stage = $1', [stage - 1, pointsToNext]);
    }
    await upsertTranslations(client, levelId, input.translations);
    await recalculateGardens(client);
    return { id: levelId, items: await listGardenLevels(locale, client) };
  });
}

export async function deleteGardenLevel(id: string, locale = 'de') {
  return withTransaction(async (client) => {
    const existing = await client.query<{ stage: number }>('select stage from garden_levels where id = $1', [id]);
    const stage = existing.rows[0]?.stage;
    if (!stage) return { status: 'not_found' as const, items: await listGardenLevels(locale, client) };
    if (Number(stage) === 1) return { status: 'invalid' as const, items: await listGardenLevels(locale, client) };

    await client.query('delete from garden_levels where id = $1', [id]);
    await client.query('update garden_levels set stage = -stage, updated_at = now() where stage > $1', [stage]);
    await client.query('update garden_levels set stage = (-stage) - 1, updated_at = now() where stage < 0');
    await client.query(
      'update garden_levels set points_to_next = null, updated_at = now() where stage = (select max(stage) from garden_levels)',
    );
    await recalculateGardens(client);
    return { status: 'deleted' as const, items: await listGardenLevels(locale, client) };
  });
}

export async function gardenUnlocksForLocale(locale = 'de', client: Queryable = pool): Promise<GardenUnlockConfig[]> {
  const levels = await listGardenLevels(locale, client);
  return levels.map((level) => {
    const area = gardenAreas.find((item) => item.stageUnlock === level.stage);
    return {
      stage: level.stage,
      points: level.minimumPoints,
      name: level.localizedName,
      unlock: area ? area.label : level.localizedName,
      areaKey: area?.key ?? fallbackAreaKey,
      areaLabel: area?.label ?? level.localizedName,
    };
  });
}

export async function nextGardenUnlock(heartPoints: number, locale = 'de', client: Queryable = pool) {
  const unlocks = await gardenUnlocksForLocale(locale, client);
  const currentStage = calculateGardenStage(heartPoints, unlocks.map((unlock) => ({ stage: unlock.stage, minimumPoints: unlock.points })));
  const nextUnlock = unlocks.find((unlock) => unlock.stage > currentStage);
  return nextUnlock
    ? {
        ...nextUnlock,
        pointsRemaining: Math.max(0, nextUnlock.points - heartPoints),
      }
    : null;
}
