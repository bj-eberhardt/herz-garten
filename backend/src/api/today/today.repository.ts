import { randomUUID } from 'node:crypto';
import type { Queryable } from '../support.repository.js';
import { addCoupleHeartPoints } from '../garden/levels.repository.js';

export async function upsertDailyAnswer(
  client: Queryable,
  input: { coupleId: string; questionId: string; userId: string; answerText: string },
) {
  await client.query(
    `
      insert into daily_question_answers (id, couple_id, question_id, user_id, answer_text)
      values ($1, $2, $3, $4, $5)
      on conflict (couple_id, question_id, user_id)
      do update set answer_text = excluded.answer_text, created_at = now()
    `,
    [randomUUID(), input.coupleId, input.questionId, input.userId, input.answerText],
  );
}

export async function listAnswersForDailyInstance(client: Queryable, coupleId: string, questionId: string, date: string) {
  const result = await client.query(
    `
      select
        a.id,
        a.couple_id as "coupleId",
        a.question_id as "questionId",
        a.user_id as "userId",
        p.display_name as "displayName",
        a.answer_text as "answerText",
        a.created_at as "createdAt"
      from daily_question_answers a
      join profiles p on p.id = a.user_id
      where a.couple_id = $1
        and a.question_id = $2
        and a.created_at::date = $3::date
      order by a.created_at
    `,
    [coupleId, questionId, date],
  );
  return result.rows;
}

export async function insertDailyGardenReward(
  client: Queryable,
  input: {
    coupleId: string;
    instanceId: string;
    areaKey: string;
    assetKey: string;
    objectType: string;
    positionX: number;
    positionY: number;
    zIndex: number;
  },
) {
  await client.query(
    `
      insert into garden_objects (
        id, couple_id, type, source_type, source_id, label, area_key, asset_key, position_x, position_y, z_index, reward_points, level
      )
      values ($1, $2, $3, 'question', $4, 'Tagesfrage beantwortet', $5, $6, $7, $8, $9, 10, 1)
      on conflict do nothing
    `,
    [
      randomUUID(),
      input.coupleId,
      input.objectType,
      input.instanceId,
      input.areaKey,
      input.assetKey,
      input.positionX,
      input.positionY,
      input.zIndex,
    ],
  );
}

export async function addDailyRewardPoints(client: Queryable, coupleId: string) {
  await addCoupleHeartPoints(client, coupleId, 10);
}

export async function markDailyRewardApplied(client: Queryable, instanceId: string) {
  await client.query('update daily_question_instances set reward_applied_at = now() where id = $1', [instanceId]);
}
