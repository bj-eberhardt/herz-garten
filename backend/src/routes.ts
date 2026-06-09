import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { currentUser, requireAuth, signToken } from './auth.js';
import { pool } from './db.js';

interface Queryable {
  query: typeof pool.query;
}

const gardenPositions = [
  [18, 62],
  [36, 48],
  [55, 66],
  [74, 42],
  [24, 28],
  [64, 24],
];

function normalizeEmail(email: unknown) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function publicUser(row: { id: string; email: string; displayName: string }) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
  };
}

async function getCurrentCouple(userId: string) {
  const result = await pool.query(
    `
      select
        c.id,
        c.invite_code as "inviteCode",
        c.relationship_type as "relationshipType",
        c.content_preference as "contentPreference",
        c.heart_points as "heartPoints",
        c.garden_stage as "gardenStage",
        c.created_at as "createdAt",
        count(cm.user_id)::int as "memberCount"
      from couples c
      join couple_members own_membership on own_membership.couple_id = c.id
      join couple_members cm on cm.couple_id = c.id
      where own_membership.user_id = $1
      group by c.id
      order by c.created_at desc
      limit 1
    `,
    [userId],
  );

  return result.rows[0] ?? null;
}

async function getOrCreateTodayInstance(client: Queryable, coupleId: string) {
  const date = todayIsoDate();
  const questionResult = await client.query(
    `
      select id
      from daily_questions
      where active = true
      order by id
      limit 1
    `,
  );
  const questionId = questionResult.rows[0]?.id;
  if (!questionId) {
    throw new Error('No active daily question exists');
  }

  const instanceResult = await client.query(
    `
      insert into daily_question_instances (id, couple_id, question_id, date)
      values ($1, $2, $3, $4)
      on conflict (couple_id, date) do update set question_id = daily_question_instances.question_id
      returning id, couple_id as "coupleId", question_id as "questionId", date, reward_applied_at as "rewardAppliedAt"
    `,
    [randomUUID(), coupleId, questionId, date],
  );

  return instanceResult.rows[0];
}

async function ensureCoupleMembership(userId: string, coupleId: string) {
  const result = await pool.query(
    'select 1 from couple_members where user_id = $1 and couple_id = $2',
    [userId, coupleId],
  );
  return (result.rowCount ?? 0) > 0;
}

function mapGardenObject(row: Record<string, unknown>) {
  return {
    id: row.id,
    coupleId: row.coupleId,
    type: row.type,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    label: row.label,
    positionX: row.positionX,
    positionY: row.positionY,
    level: row.level,
    createdAt: row.createdAt,
  };
}

async function buildTodayPayload(userId: string) {
  const couple = await getCurrentCouple(userId);
  if (!couple) {
    return null;
  }

  const instance = await getOrCreateTodayInstance(pool, couple.id);
  const questionResult = await pool.query(
    `
      select
        id,
        text,
        category,
        depth_level as "depthLevel",
        long_distance_suitable as "longDistanceSuitable",
        active
      from daily_questions
      where id = $1
    `,
    [instance.questionId],
  );
  const answersResult = await pool.query(
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
      where a.couple_id = $1 and a.question_id = $2
      order by a.created_at
    `,
    [couple.id, instance.questionId],
  );
  const answers = answersResult.rows;
  const answeredByCurrentUser = answers.some((answer) => answer.userId === userId);
  const revealed = answers.length >= 2;

  return {
    couple,
    question: questionResult.rows[0],
    instance,
    answeredByCurrentUser,
    revealed,
    answers: revealed
      ? answers
      : answers
          .filter((answer) => answer.userId === userId)
          .map((answer) => ({ ...answer, answerText: null })),
  };
}

function inviteCode() {
  const number = Math.floor(1000 + Math.random() * 9000);
  return `HERZ-${number}`;
}

async function createUniqueInviteCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = inviteCode();
    const result = await pool.query('select 1 from couples where invite_code = $1', [code]);
    if (result.rowCount === 0) return code;
  }

  throw new Error('Could not create unique invite code');
}

function handleError(response: Response, error: unknown) {
  console.error(error);
  response.status(500).json({ error: 'Unexpected server error' });
}

export function apiRouter(): Router {
  const router = createRouter();

  router.post('/auth/register', async (request, response) => {
    const email = normalizeEmail(request.body.email);
    const displayName = normalizeText(request.body.displayName);
    const password = normalizeText(request.body.password);

    if (!email || !displayName || password.length < 8) {
      response.status(400).json({ error: 'Email, display name and password with at least 8 chars are required' });
      return;
    }

    try {
      const passwordHash = await bcrypt.hash(password, 12);
      const result = await pool.query(
        `
          insert into profiles (id, email, display_name, password_hash)
          values ($1, $2, $3, $4)
          returning id, email, display_name as "displayName"
        `,
        [randomUUID(), email, displayName, passwordHash],
      );
      const user = publicUser(result.rows[0]);

      response.status(201).json({
        token: signToken(user.id),
        user,
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        response.status(409).json({ error: 'Email already registered' });
        return;
      }
      handleError(response, error);
    }
  });

  router.post('/auth/login', async (request, response) => {
    const email = normalizeEmail(request.body.email);
    const password = normalizeText(request.body.password);

    if (!email || !password) {
      response.status(400).json({ error: 'Email and password are required' });
      return;
    }

    try {
      const result = await pool.query(
        `
          select id, email, display_name as "displayName", password_hash as "passwordHash"
          from profiles
          where email = $1
        `,
        [email],
      );
      const user = result.rows[0];
      const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

      if (!valid) {
        response.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      response.json({
        token: signToken(user.id),
        user: publicUser(user),
      });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/me', requireAuth, async (request, response) => {
    const user = currentUser(request);
    const couple = await getCurrentCouple(user.id);
    response.json({ user, couple });
  });

  router.post('/couples', requireAuth, async (request, response) => {
    const user = currentUser(request);
    const relationshipType = normalizeText(request.body.relationshipType) || 'mixed';
    const contentPreference = normalizeText(request.body.contentPreference) || 'balanced';

    try {
      const existing = await getCurrentCouple(user.id);
      if (existing) {
        response.status(409).json({ error: 'User is already in a couple', couple: existing });
        return;
      }

      const coupleId = randomUUID();
      const code = await createUniqueInviteCode();
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
        [coupleId, code, relationshipType, contentPreference],
      );
      await pool.query(
        'insert into couple_members (couple_id, user_id, role) values ($1, $2, $3)',
        [coupleId, user.id, 'owner'],
      );

      response.status(201).json({ couple: { ...result.rows[0], memberCount: 1 } });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/couples/join', requireAuth, async (request, response) => {
    const user = currentUser(request);
    const code = normalizeText(request.body.inviteCode).toUpperCase();

    if (!code) {
      response.status(400).json({ error: 'Invite code is required' });
      return;
    }

    try {
      const existing = await getCurrentCouple(user.id);
      if (existing) {
        response.status(409).json({ error: 'User is already in a couple', couple: existing });
        return;
      }

      const coupleResult = await pool.query(
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
          where invite_code = $1
        `,
        [code],
      );
      const couple = coupleResult.rows[0];
      if (!couple) {
        response.status(404).json({ error: 'Invite code not found' });
        return;
      }

      const memberCount = await pool.query('select count(*)::int as count from couple_members where couple_id = $1', [
        couple.id,
      ]);
      if (memberCount.rows[0].count >= 2) {
        response.status(409).json({ error: 'Couple already has two members' });
        return;
      }

      await pool.query('insert into couple_members (couple_id, user_id, role) values ($1, $2, $3)', [
        couple.id,
        user.id,
        'partner',
      ]);

      response.json({ couple: { ...couple, memberCount: memberCount.rows[0].count + 1 } });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/today', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      const payload = await buildTodayPayload(user.id);
      if (!payload) {
        response.status(409).json({ error: 'No couple connected' });
        return;
      }
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/today/answer', requireAuth, async (request, response) => {
    const user = currentUser(request);
    const answerText = normalizeText(request.body.answerText);

    if (!answerText) {
      response.status(400).json({ error: 'Answer text is required' });
      return;
    }

    const client = await pool.connect();
    try {
      const couple = await getCurrentCouple(user.id);
      if (!couple) {
        response.status(409).json({ error: 'No couple connected' });
        return;
      }

      const member = await ensureCoupleMembership(user.id, couple.id);
      if (!member) {
        response.status(403).json({ error: 'Couple access denied' });
        return;
      }

      await client.query('begin');
      const instance = await getOrCreateTodayInstance(client, couple.id);
      await client.query(
        `
          insert into daily_question_answers (id, couple_id, question_id, user_id, answer_text)
          values ($1, $2, $3, $4, $5)
          on conflict (couple_id, question_id, user_id)
          do update set answer_text = excluded.answer_text, created_at = now()
        `,
        [randomUUID(), couple.id, instance.questionId, user.id, answerText],
      );

      const answersResult = await client.query(
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
          where a.couple_id = $1 and a.question_id = $2
          order by a.created_at
        `,
        [couple.id, instance.questionId],
      );

      if (answersResult.rows.length >= 2 && !instance.rewardAppliedAt) {
        const countResult = await client.query(
          'select count(*)::int as count from garden_objects where couple_id = $1',
          [couple.id],
        );
        const [positionX, positionY] = gardenPositions[countResult.rows[0].count % gardenPositions.length];

        await client.query(
          `
            insert into garden_objects (
              id, couple_id, type, source_type, source_id, label, position_x, position_y, level
            )
            values ($1, $2, 'flower', 'question', $3, 'Tagesfrage beantwortet', $4, $5, 1)
            on conflict do nothing
          `,
          [randomUUID(), couple.id, instance.id, positionX, positionY],
        );
        await client.query(
          `
            update couples
            set heart_points = heart_points + 10,
                garden_stage = greatest(1, floor((heart_points + 10) / 80) + 1)
            where id = $1
          `,
          [couple.id],
        );
        await client.query('update daily_question_instances set reward_applied_at = now() where id = $1', [
          instance.id,
        ]);
      }

      await client.query('commit');

      const payload = await buildTodayPayload(user.id);
      response.json(payload);
    } catch (error) {
      await client.query('rollback');
      handleError(response, error);
    } finally {
      client.release();
    }
  });

  router.get('/garden', requireAuth, async (request: Request, response: Response) => {
    const user = currentUser(request);
    const couple = await getCurrentCouple(user.id);
    if (!couple) {
      response.status(409).json({ error: 'No couple connected' });
      return;
    }

    try {
      const objectsResult = await pool.query(
        `
          select
            id,
            couple_id as "coupleId",
            type,
            source_type as "sourceType",
            source_id as "sourceId",
            label,
            position_x as "positionX",
            position_y as "positionY",
            level,
            created_at as "createdAt"
          from garden_objects
          where couple_id = $1
          order by created_at
        `,
        [couple.id],
      );

      response.json({
        couple,
        objects: objectsResult.rows.map(mapGardenObject),
      });
    } catch (error) {
      handleError(response, error);
    }
  });

  return router;
}
