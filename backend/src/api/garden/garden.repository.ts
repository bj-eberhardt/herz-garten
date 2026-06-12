import type { Queryable } from '../support.repository.js';
import { pool } from '../../db.js';

export interface GardenPlacementUpdate {
  areaKey: string;
  positionX: number;
  positionY: number;
  zIndex: number;
  scale: number;
  rotation: number;
}

export async function listGardenObjects(coupleId: string) {
  const result = await pool.query(
    `
      select
        go.id,
        go.couple_id as "coupleId",
        go.type,
        go.source_type as "sourceType",
        go.source_id as "sourceId",
        go.label,
        coalesce(dq.text, q.title, m.title, ln.text, km.question_text, go.label) as "historyTitle",
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
      left join couple_quests cq on go.source_type = 'quest' and go.source_id = cq.id
      left join quests q on q.id = cq.quest_id
      left join memory_entries m on go.source_type = 'memory' and go.source_id = m.id
      left join love_jar_notes ln on go.source_type = 'love_jar' and go.source_id = ln.id
      left join know_me_questions km on go.source_type = 'know_me' and go.source_id = km.id
      where go.couple_id = $1
      order by go.created_at
    `,
    [coupleId],
  );
  return result.rows;
}

export async function updateGardenObjectPlacement(coupleId: string, objectId: string, placement: GardenPlacementUpdate) {
  const result = await pool.query(
    `
      update garden_objects
      set
        area_key = $1,
        position_x = $2,
        position_y = $3,
        z_index = $4,
        scale = $5,
        rotation = $6,
        placed_by_user = true
      where id = $7 and couple_id = $8
      returning
        id,
        couple_id as "coupleId",
        type,
        source_type as "sourceType",
        source_id as "sourceId",
        label,
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
  const result = await client.query('select count(*)::int as count from garden_objects where couple_id = $1 and area_key = $2', [
    coupleId,
    areaKey,
  ]);
  return Number(result.rows[0]?.count ?? 0);
}
