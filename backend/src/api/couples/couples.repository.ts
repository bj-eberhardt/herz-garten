import type { Queryable } from '../support.repository.js';
import { pool } from '../../db.js';

export async function insertCouple(coupleId: string, inviteCode: string, relationshipType: string, contentPreference: string) {
  const result = await pool.query(
    `
      insert into couples (id, invite_code, relationship_type, content_preference)
      values ($1, $2, $3, $4)
      returning
        id,
        invite_code as "inviteCode",
        relationship_type as "relationshipType",
        content_preference as "contentPreference",
        heart_points as "heartPoints",
        garden_stage as "gardenStage",
        created_at as "createdAt"
    `,
    [coupleId, inviteCode, relationshipType, contentPreference],
  );
  return result.rows[0];
}

export async function findCoupleByInviteCode(inviteCode: string) {
  const result = await pool.query(
    `
      select
        id,
        invite_code as "inviteCode",
        relationship_type as "relationshipType",
        content_preference as "contentPreference",
        heart_points as "heartPoints",
        garden_stage as "gardenStage",
        created_at as "createdAt"
      from couples
      where lower(invite_code) = $1
    `,
    [inviteCode],
  );
  return result.rows[0] ?? null;
}

export async function countCoupleMembers(coupleId: string) {
  const result = await pool.query('select count(*)::int as count from couple_members where couple_id = $1', [coupleId]);
  return Number(result.rows[0]?.count ?? 0);
}

export async function insertCoupleMember(coupleId: string, userId: string, role: 'owner' | 'partner') {
  await pool.query('insert into couple_members (couple_id, user_id, role) values ($1, $2, $3)', [coupleId, userId, role]);
}

export async function deleteCoupleMember(client: Queryable, coupleId: string, userId: string) {
  await client.query('delete from couple_members where couple_id = $1 and user_id = $2', [coupleId, userId]);
}

export async function deleteEmptyCouple(client: Queryable, coupleId: string) {
  await client.query(
    `
      delete from couples c
      where c.id = $1
        and not exists (select 1 from couple_members cm where cm.couple_id = c.id)
    `,
    [coupleId],
  );
}
