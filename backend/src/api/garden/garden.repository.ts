import type { Queryable } from '../support.repository.js';
import { config } from '../../config.js';
import { pool } from '../../db.js';
import type { GardenObjectRow } from './garden.mapper.js';

export interface GardenPlacementUpdate {
  areaKey?: string;
  positionX?: number;
  positionY?: number;
  zIndex?: number;
  scale?: number;
  rotation?: number;
}

export async function listGardenObjects(coupleId: string, locale = config.i18nDefaultLocale) {
  const result = await pool.query<GardenObjectRow>(
    `
      select
        go.id,
        go.couple_id as "coupleId",
        go.type,
        go.source_type as "sourceType",
        go.source_id as "sourceId",
        go.label,
        coalesce(dqt_requested.text, dqt_fallback.text, qt_requested.title, qt_fallback.title, m.title, ln.text, km.question_text, go.label) as "historyTitle",
        go.area_key as "areaKey",
        go.asset_key as "assetKey",
        go.position_x as "positionX",
        go.position_y as "positionY",
        go.z_index as "zIndex",
        go.scale,
        go.rotation,
        go.placed_by_user as "placedByUser",
        go.reward_points as "rewardPoints",
        go.level,
        go.created_at as "createdAt"
      from garden_objects go
      left join daily_question_instances dqi on go.source_type = 'question' and go.source_id = dqi.id
      left join daily_questions dq on dq.id = dqi.question_id
      left join daily_question_translations dqt_requested on dqt_requested.question_id = dq.id and dqt_requested.locale = $2
      left join daily_question_translations dqt_fallback on dqt_fallback.question_id = dq.id and dqt_fallback.locale = $3
      left join couple_quests cq on go.source_type = 'quest' and go.source_id = cq.id
      left join quests q on q.id = cq.quest_id
      left join quest_translations qt_requested on qt_requested.quest_id = q.id and qt_requested.locale = $2
      left join quest_translations qt_fallback on qt_fallback.quest_id = q.id and qt_fallback.locale = $3
      left join memory_entries m on go.source_type = 'memory' and go.source_id = m.id
      left join love_jar_notes ln on go.source_type = 'love_jar' and go.source_id = ln.id
      left join know_me_questions km on go.source_type = 'know_me' and go.source_id = km.id
      where go.couple_id = $1
      order by go.created_at
    `,
    [coupleId, locale, config.i18nDefaultLocale],
  );
  return result.rows;
}

export async function updateGardenObjectPlacement(coupleId: string, objectId: string, placement: GardenPlacementUpdate) {
  const result = await pool.query<GardenObjectRow>(
    `
      update garden_objects
      set
        area_key = coalesce($1, area_key),
        position_x = coalesce($2, position_x),
        position_y = coalesce($3, position_y),
        z_index = coalesce($4, z_index),
        scale = coalesce($5, scale),
        rotation = coalesce($6, rotation),
        placed_by_user = true
      where id = $7 and couple_id = $8
      returning
        id,
        couple_id as "coupleId",
        type,
        source_type as "sourceType",
        source_id as "sourceId",
        label,
        label as "historyTitle",
        area_key as "areaKey",
        asset_key as "assetKey",
        position_x as "positionX",
        position_y as "positionY",
        z_index as "zIndex",
        scale,
        rotation,
        placed_by_user as "placedByUser",
        reward_points as "rewardPoints",
        level,
        created_at as "createdAt"
    `,
    [
      placement.areaKey,
      placement.positionX,
      placement.positionY,
      placement.zIndex,
      placement.scale,
      placement.rotation,
      objectId,
      coupleId,
    ],
  );

  return result.rows[0] ?? null;
}

export async function countGardenObjectsInArea(client: Queryable, coupleId: string, areaKey: string) {
  const result = await client.query<{ count: number }>(
    'select count(*)::int as count from garden_objects where couple_id = $1 and area_key = $2',
    [coupleId, areaKey],
  );
  return Number(result.rows[0]?.count ?? 0);
}
