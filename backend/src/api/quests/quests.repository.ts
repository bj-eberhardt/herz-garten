import { randomUUID } from 'node:crypto';
import type { Queryable } from '../support.repository.js';
import { pool } from '../../db.js';

export interface ActiveQuestIdRow {
  id: string;
}

export interface ActiveQuestForCompletion {
  id: string;
  title: string;
  category: string;
  rewardPoints: number;
  requiresBothPartners: boolean;
}

export interface CoupleQuestState {
  id: string;
  status: 'available' | 'accepted' | 'completed';
  completedByUserIds: string[];
  rewardAppliedAt: Date | string | null;
}

export async function findActiveQuestId(questId: string) {
  const result = await pool.query<ActiveQuestIdRow>('select id from quests where id = $1 and coalesce(active, true) = true', [
    questId,
  ]);
  return result.rows[0] ?? null;
}

export async function acceptQuestForCouple(coupleId: string, questId: string) {
  await pool.query(
    `
      insert into couple_quests (id, couple_id, quest_id, status)
      values ($1, $2, $3, 'accepted')
      on conflict (couple_id, quest_id)
      do update set status = case
        when couple_quests.status = 'available' then 'accepted'
        else couple_quests.status
      end
    `,
    [randomUUID(), coupleId, questId],
  );
}

export async function findActiveQuestForCompletion(client: Queryable, questId: string, locale = 'de') {
  const result = await client.query<ActiveQuestForCompletion>(
    `
      select
        q.id,
        coalesce(requested.title, fallback.title, q.title) as title,
        q.category,
        q.reward_points as "rewardPoints",
        q.requires_both_partners as "requiresBothPartners"
      from quests q
      left join quest_translations requested on requested.quest_id = q.id and requested.locale = $2
      left join quest_translations fallback on fallback.quest_id = q.id and fallback.locale = 'de'
      where q.id = $1 and coalesce(q.active, true) = true
    `,
    [questId, locale],
  );
  return result.rows[0] ?? null;
}

export async function ensureCoupleQuest(client: Queryable, coupleId: string, questId: string) {
  const result = await client.query<CoupleQuestState>(
    `
      insert into couple_quests (id, couple_id, quest_id, status, completed_by_user_ids)
      values ($1, $2, $3, 'accepted', '{}')
      on conflict (couple_id, quest_id) do update set status = couple_quests.status
      returning
        id,
        status,
        completed_by_user_ids as "completedByUserIds",
        reward_applied_at as "rewardAppliedAt"
    `,
    [randomUUID(), coupleId, questId],
  );
  return result.rows[0];
}

export async function lockCoupleQuest(client: Queryable, coupleQuestId: string) {
  const result = await client.query<CoupleQuestState>(
    `
      select
        id,
        status,
        completed_by_user_ids as "completedByUserIds",
        reward_applied_at as "rewardAppliedAt"
      from couple_quests
      where id = $1
      for update
    `,
    [coupleQuestId],
  );
  return result.rows[0];
}

export async function countCoupleMembers(client: Queryable, coupleId: string) {
  const result = await client.query<{ count: number }>('select count(*)::int as count from couple_members where couple_id = $1', [
    coupleId,
  ]);
  return Number(result.rows[0]?.count ?? 0);
}

export async function updateCoupleQuestCompletion(
  client: Queryable,
  coupleQuestId: string,
  status: 'accepted' | 'completed',
  completedByUserIds: string[],
) {
  await client.query(
    `
      update couple_quests
      set
        status = $2,
        completed_by_user_ids = $3,
        completed_at = case when $2 = 'completed' and completed_at is null then now() else completed_at end
      where id = $1
    `,
    [coupleQuestId, status, completedByUserIds],
  );
}
