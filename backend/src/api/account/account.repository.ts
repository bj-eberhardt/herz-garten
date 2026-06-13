import type { Queryable } from '../support.repository.js';
import { pool } from '../../db.js';

export async function getProfilePreferences(userId: string) {
  const result = await pool.query('select preferences from profiles where id = $1', [userId]);
  return result.rows[0]?.preferences ?? {};
}

export async function updateProfilePreferences(userId: string, preferences: Record<string, unknown>) {
  const result = await pool.query(
    `
      update profiles
      set preferences = $2::jsonb,
          updated_at = now()
      where id = $1
      returning id, email, display_name as "displayName", preferences
    `,
    [userId, JSON.stringify(preferences)],
  );
  return result.rows[0];
}

export async function updateProfile(userId: string, profile: { email?: string; displayName?: string }) {
  const result = await pool.query(
    `
      update profiles
      set email = coalesce($2, email),
          display_name = coalesce($3, display_name),
          updated_at = now()
      where id = $1
      returning id, email, display_name as "displayName", preferences
    `,
    [userId, profile.email ?? null, profile.displayName ?? null],
  );
  return result.rows[0];
}

export async function getPasswordHashForUser(userId: string) {
  const result = await pool.query('select password_hash as "passwordHash" from profiles where id = $1', [userId]);
  return result.rows[0]?.passwordHash as string | undefined;
}

export async function updatePasswordHash(userId: string, passwordHash: string) {
  await pool.query(
    `
      update profiles
      set password_hash = $2,
          updated_at = now()
      where id = $1
    `,
    [userId, passwordHash],
  );
}

export async function exportCoupleData(coupleId: string, locale: string) {
  const [members, answers, quests, gardenObjects, loveJarNotes, memories, knowMeQuestions, knowMeGuesses, notifications] =
    await Promise.all([
      pool.query(
        `
          select p.id, p.email, p.display_name as "displayName", cm.role, cm.joined_at as "joinedAt"
          from couple_members cm
          join profiles p on p.id = cm.user_id
          where cm.couple_id = $1
          order by cm.joined_at
        `,
        [coupleId],
      ),
      pool.query(
        `
          select a.*, coalesce(requested.text, fallback.text, q.text) as question
          from daily_question_answers a
          join daily_questions q on q.id = a.question_id
          left join daily_question_translations requested
            on requested.question_id = q.id and requested.locale = $2
          left join daily_question_translations fallback
            on fallback.question_id = q.id and fallback.locale = 'de'
          where a.couple_id = $1
          order by a.created_at
        `,
        [coupleId, locale],
      ),
      pool.query(
        `
          select
            cq.*,
            coalesce(requested.title, fallback.title, q.title) as title,
            coalesce(requested.description, fallback.description, q.description) as description
          from couple_quests cq
          join quests q on q.id = cq.quest_id
          left join quest_translations requested
            on requested.quest_id = q.id and requested.locale = $2
          left join quest_translations fallback
            on fallback.quest_id = q.id and fallback.locale = 'de'
          where cq.couple_id = $1
          order by cq.completed_at nulls last
        `,
        [coupleId, locale],
      ),
      pool.query('select * from garden_objects where couple_id = $1 order by created_at', [coupleId]),
      pool.query('select * from love_jar_notes where couple_id = $1 order by created_at', [coupleId]),
      pool.query('select * from memory_entries where couple_id = $1 order by date desc, created_at desc', [coupleId]),
      pool.query('select * from know_me_questions where couple_id = $1 order by created_at desc', [coupleId]),
      pool.query(
        `
          select g.*
          from know_me_guesses g
          join know_me_questions q on q.id = g.question_id
          where q.couple_id = $1
          order by g.created_at desc
        `,
        [coupleId],
      ),
      pool.query('select * from notifications where couple_id = $1 order by created_at desc', [coupleId]),
    ]);

  return {
    members: members.rows,
    dailyQuestionAnswers: answers.rows,
    coupleQuests: quests.rows,
    gardenObjects: gardenObjects.rows,
    loveJarNotes: loveJarNotes.rows,
    memories: memories.rows,
    knowMeQuestions: knowMeQuestions.rows,
    knowMeGuesses: knowMeGuesses.rows,
    notifications: notifications.rows,
  };
}

export async function findUserMemberships(client: Queryable, userId: string) {
  const result = await client.query('select couple_id from couple_members where user_id = $1', [userId]);
  return result.rows;
}

export async function findPartnerIdsForMembership(client: Queryable, coupleId: string, userId: string) {
  const result = await client.query(
    `
      select p.id
      from couple_members cm
      join profiles p on p.id = cm.user_id
      where cm.couple_id = $1 and cm.user_id <> $2
    `,
    [coupleId, userId],
  );
  return result.rows.map((row: { id: string }) => row.id);
}

export async function deleteCoupleMembersForCouple(client: Queryable, coupleId: string) {
  await client.query('delete from couple_members where couple_id = $1', [coupleId]);
}

export async function deleteGardenObjectsCreatedByUserSources(client: Queryable, userId: string) {
  await client.query(
    `
      delete from garden_objects
      where source_type = 'question'
        and source_id in (
          select i.id
          from daily_question_instances i
          join daily_question_answers a
            on a.couple_id = i.couple_id and a.question_id = i.question_id
          where a.user_id = $1
        )
    `,
    [userId],
  );
  await client.query(
    `
      delete from garden_objects
      where source_type = 'love_jar'
        and source_id in (select id from love_jar_notes where author_id = $1)
    `,
    [userId],
  );
  await client.query(
    `
      delete from garden_objects
      where source_type = 'memory'
        and source_id in (select id from memory_entries where author_id = $1)
    `,
    [userId],
  );
  await client.query(
    `
      delete from garden_objects
      where source_type = 'know_me'
        and source_id in (select id from know_me_questions where author_id = $1)
    `,
    [userId],
  );
}

export async function deleteProfile(client: Queryable, userId: string) {
  await client.query('delete from profiles where id = $1', [userId]);
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
