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

function mapQuest(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    estimatedMinutes: row.estimatedMinutes,
    effortLevel: row.effortLevel,
    rewardPoints: row.rewardPoints,
    rewardSeedType: row.rewardSeedType,
    requiresBothPartners: row.requiresBothPartners,
    coupleQuest: row.coupleQuestId
      ? {
          id: row.coupleQuestId,
          status: row.status,
          completedByUserIds: row.completedByUserIds,
          completedAt: row.completedAt,
          rewardAppliedAt: row.rewardAppliedAt,
        }
      : null,
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

async function buildQuestPayload(userId: string) {
  const couple = await getCurrentCouple(userId);
  if (!couple) {
    return null;
  }

  const result = await pool.query(
    `
      select
        q.id,
        q.title,
        q.description,
        q.category,
        q.estimated_minutes as "estimatedMinutes",
        q.effort_level as "effortLevel",
        q.reward_points as "rewardPoints",
        q.reward_seed_type as "rewardSeedType",
        q.requires_both_partners as "requiresBothPartners",
        cq.id as "coupleQuestId",
        coalesce(cq.status, 'available') as status,
        coalesce(cq.completed_by_user_ids, '{}') as "completedByUserIds",
        cq.completed_at as "completedAt",
        cq.reward_applied_at as "rewardAppliedAt"
      from quests q
      left join couple_quests cq on cq.quest_id = q.id and cq.couple_id = $1
      order by q.title
    `,
    [couple.id],
  );

  return {
    couple,
    quests: result.rows.map(mapQuest),
  };
}

function gardenTypeForQuest(category: string) {
  if (category === 'date') return 'decoration';
  if (category === 'memory') return 'stone';
  if (category === 'teamwork') return 'tree';
  return 'light';
}

async function applyQuestReward(client: Queryable, coupleId: string, coupleQuestId: string, quest: Record<string, unknown>) {
  const countResult = await client.query('select count(*)::int as count from garden_objects where couple_id = $1', [
    coupleId,
  ]);
  const [positionX, positionY] = gardenPositions[countResult.rows[0].count % gardenPositions.length];

  await client.query(
    `
      insert into garden_objects (
        id, couple_id, type, source_type, source_id, label, position_x, position_y, level
      )
      values ($1, $2, $3, 'quest', $4, $5, $6, $7, 1)
      on conflict do nothing
    `,
    [
      randomUUID(),
      coupleId,
      gardenTypeForQuest(String(quest.category)),
      coupleQuestId,
      String(quest.title),
      positionX,
      positionY,
    ],
  );
  await client.query(
    `
      update couples
      set heart_points = heart_points + $2,
          garden_stage = greatest(1, floor((heart_points + $2) / 80) + 1)
      where id = $1
    `,
    [coupleId, Number(quest.rewardPoints)],
  );
  await client.query('update couple_quests set reward_applied_at = now() where id = $1', [coupleQuestId]);
}

function mapLoveJarNote(row: Record<string, unknown>, revealText = true) {
  return {
    id: row.id,
    coupleId: row.coupleId,
    authorId: row.authorId,
    authorName: row.authorName,
    text: revealText ? row.text : null,
    category: row.category,
    isDrawn: row.isDrawn,
    drawnAt: row.drawnAt,
    createdAt: row.createdAt,
  };
}

function mapMemoryEntry(row: Record<string, unknown>) {
  return {
    id: row.id,
    coupleId: row.coupleId,
    authorId: row.authorId,
    authorName: row.authorName,
    title: row.title,
    description: row.description,
    date: row.date,
    imageUrl: row.imageUrl,
    category: row.category,
    linkedGardenObjectId: row.linkedGardenObjectId,
    createdAt: row.createdAt,
  };
}

async function buildMemoryPayload(userId: string) {
  const couple = await getCurrentCouple(userId);
  if (!couple) {
    return null;
  }

  const result = await pool.query(
    `
      select
        m.id,
        m.couple_id as "coupleId",
        m.author_id as "authorId",
        p.display_name as "authorName",
        m.title,
        m.description,
        m.date,
        m.image_url as "imageUrl",
        m.category,
        m.linked_garden_object_id as "linkedGardenObjectId",
        m.created_at as "createdAt"
      from memory_entries m
      join profiles p on p.id = m.author_id
      where m.couple_id = $1
      order by m.date desc, m.created_at desc
    `,
    [couple.id],
  );

  return {
    couple,
    memories: result.rows.map(mapMemoryEntry),
  };
}

async function createMemoryStone(client: Queryable, coupleId: string, memoryId: string, title: string) {
  const countResult = await client.query('select count(*)::int as count from garden_objects where couple_id = $1', [
    coupleId,
  ]);
  const [positionX, positionY] = gardenPositions[countResult.rows[0].count % gardenPositions.length];

  const result = await client.query(
    `
      insert into garden_objects (
        id, couple_id, type, source_type, source_id, label, position_x, position_y, level
      )
      values ($1, $2, 'stone', 'memory', $3, $4, $5, $6, 1)
      on conflict do nothing
      returning id
    `,
    [randomUUID(), coupleId, memoryId, title, positionX, positionY],
  );

  await client.query(
    `
      update couples
      set heart_points = heart_points + 8,
          garden_stage = greatest(1, floor((heart_points + 8) / 80) + 1)
      where id = $1
    `,
    [coupleId],
  );

  return result.rows[0]?.id as string | undefined;
}

async function buildGardenObjectDetail(userId: string, objectId: string) {
  const couple = await getCurrentCouple(userId);
  if (!couple) {
    return null;
  }

  const objectResult = await pool.query(
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
      where id = $1 and couple_id = $2
    `,
    [objectId, couple.id],
  );
  const object = objectResult.rows[0];

  if (!object) {
    return { couple, object: null, source: null };
  }

  let source: Record<string, unknown> | null = null;

  if (object.sourceType === 'question') {
    const result = await pool.query(
      `
        select
          i.id,
          i.date,
          q.text as question,
          json_agg(
            json_build_object(
              'displayName', p.display_name,
              'answerText', a.answer_text,
              'createdAt', a.created_at
            )
            order by a.created_at
          ) as answers
        from daily_question_instances i
        join daily_questions q on q.id = i.question_id
        left join daily_question_answers a on a.couple_id = i.couple_id and a.question_id = i.question_id
        left join profiles p on p.id = a.user_id
        where i.id = $1 and i.couple_id = $2
        group by i.id, q.text
      `,
      [object.sourceId, couple.id],
    );
    source = result.rows[0] ? { type: 'question', ...result.rows[0] } : null;
  }

  if (object.sourceType === 'quest') {
    const result = await pool.query(
      `
        select
          cq.id,
          q.title,
          q.description,
          q.category,
          q.reward_points as "rewardPoints",
          cq.completed_at as "completedAt"
        from couple_quests cq
        join quests q on q.id = cq.quest_id
        where cq.id = $1 and cq.couple_id = $2
      `,
      [object.sourceId, couple.id],
    );
    source = result.rows[0] ? { type: 'quest', ...result.rows[0] } : null;
  }

  if (object.sourceType === 'love_jar') {
    const result = await pool.query(
      `
        select
          n.id,
          p.display_name as "authorName",
          case when n.is_drawn then n.text else null end as text,
          n.category,
          n.is_drawn as "isDrawn",
          n.drawn_at as "drawnAt",
          n.created_at as "createdAt"
        from love_jar_notes n
        join profiles p on p.id = n.author_id
        where n.id = $1 and n.couple_id = $2
      `,
      [object.sourceId, couple.id],
    );
    source = result.rows[0] ? { type: 'love_jar', ...result.rows[0] } : null;
  }

  if (object.sourceType === 'memory') {
    const result = await pool.query(
      `
        select
          m.id,
          p.display_name as "authorName",
          m.title,
          m.description,
          m.date,
          m.category,
          m.created_at as "createdAt"
        from memory_entries m
        join profiles p on p.id = m.author_id
        where m.id = $1 and m.couple_id = $2
      `,
      [object.sourceId, couple.id],
    );
    source = result.rows[0] ? { type: 'memory', ...result.rows[0] } : null;
  }

  return {
    couple,
    object: mapGardenObject(object),
    source,
  };
}

async function buildLoveJarPayload(userId: string) {
  const couple = await getCurrentCouple(userId);
  if (!couple) {
    return null;
  }

  const result = await pool.query(
    `
      select
        n.id,
        n.couple_id as "coupleId",
        n.author_id as "authorId",
        p.display_name as "authorName",
        n.text,
        n.category,
        n.is_drawn as "isDrawn",
        n.drawn_at as "drawnAt",
        n.created_at as "createdAt"
      from love_jar_notes n
      join profiles p on p.id = n.author_id
      where n.couple_id = $1
      order by n.created_at desc
    `,
    [couple.id],
  );

  return {
    couple,
    notes: result.rows.map((note) => mapLoveJarNote(note, Boolean(note.isDrawn))),
  };
}

async function createLoveJarLight(client: Queryable, coupleId: string, noteId: string) {
  const countResult = await client.query('select count(*)::int as count from garden_objects where couple_id = $1', [
    coupleId,
  ]);
  const [positionX, positionY] = gardenPositions[countResult.rows[0].count % gardenPositions.length];

  await client.query(
    `
      insert into garden_objects (
        id, couple_id, type, source_type, source_id, label, position_x, position_y, level
      )
      values ($1, $2, 'light', 'love_jar', $3, 'Love-Jar-Licht', $4, $5, 1)
      on conflict do nothing
    `,
    [randomUUID(), coupleId, noteId, positionX, positionY],
  );
  await client.query(
    `
      update couples
      set heart_points = heart_points + 5,
          garden_stage = greatest(1, floor((heart_points + 5) / 80) + 1)
      where id = $1
    `,
    [coupleId],
  );
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

  router.get('/me/export', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      const couple = await getCurrentCouple(user.id);
      const payload: Record<string, unknown> = {
        exportedAt: new Date().toISOString(),
        user,
        couple,
      };

      if (couple) {
        const [members, answers, quests, gardenObjects, loveJarNotes, memories] = await Promise.all([
          pool.query(
            `
              select p.id, p.email, p.display_name as "displayName", cm.role, cm.joined_at as "joinedAt"
              from couple_members cm
              join profiles p on p.id = cm.user_id
              where cm.couple_id = $1
              order by cm.joined_at
            `,
            [couple.id],
          ),
          pool.query(
            `
              select a.*, q.text as question
              from daily_question_answers a
              join daily_questions q on q.id = a.question_id
              where a.couple_id = $1
              order by a.created_at
            `,
            [couple.id],
          ),
          pool.query('select * from couple_quests where couple_id = $1 order by completed_at nulls last', [couple.id]),
          pool.query('select * from garden_objects where couple_id = $1 order by created_at', [couple.id]),
          pool.query('select * from love_jar_notes where couple_id = $1 order by created_at', [couple.id]),
          pool.query('select * from memory_entries where couple_id = $1 order by date desc, created_at desc', [couple.id]),
        ]);

        payload.data = {
          members: members.rows,
          dailyQuestionAnswers: answers.rows,
          coupleQuests: quests.rows,
          gardenObjects: gardenObjects.rows,
          loveJarNotes: loveJarNotes.rows,
          memories: memories.rows,
        };
      }

      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.delete('/me', requireAuth, async (request, response) => {
    const user = currentUser(request);
    const client = await pool.connect();

    try {
      await client.query('begin');
      const memberships = await client.query('select couple_id from couple_members where user_id = $1', [user.id]);
      await client.query('delete from profiles where id = $1', [user.id]);
      for (const membership of memberships.rows) {
        await client.query(
          `
            delete from couples c
            where c.id = $1
              and not exists (select 1 from couple_members cm where cm.couple_id = c.id)
          `,
          [membership.couple_id],
        );
      }
      await client.query('commit');
      response.status(204).send();
    } catch (error) {
      await client.query('rollback');
      handleError(response, error);
    } finally {
      client.release();
    }
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

  router.post('/couples/leave', requireAuth, async (request, response) => {
    const user = currentUser(request);
    const client = await pool.connect();

    try {
      const couple = await getCurrentCouple(user.id);
      if (!couple) {
        response.status(409).json({ error: 'No couple connected' });
        return;
      }

      await client.query('begin');
      await client.query('delete from couple_members where couple_id = $1 and user_id = $2', [couple.id, user.id]);
      await client.query(
        `
          delete from couples c
          where c.id = $1
            and not exists (select 1 from couple_members cm where cm.couple_id = c.id)
        `,
        [couple.id],
      );
      await client.query('commit');

      response.json({ user, couple: null });
    } catch (error) {
      await client.query('rollback');
      handleError(response, error);
    } finally {
      client.release();
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

  router.get('/quests', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      const payload = await buildQuestPayload(user.id);
      if (!payload) {
        response.status(409).json({ error: 'No couple connected' });
        return;
      }
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/quests/:questId/accept', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      const couple = await getCurrentCouple(user.id);
      if (!couple) {
        response.status(409).json({ error: 'No couple connected' });
        return;
      }

      const questResult = await pool.query('select id from quests where id = $1', [request.params.questId]);
      if (!questResult.rows[0]) {
        response.status(404).json({ error: 'Quest not found' });
        return;
      }

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
        [randomUUID(), couple.id, request.params.questId],
      );

      const payload = await buildQuestPayload(user.id);
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/quests/:questId/complete', requireAuth, async (request, response) => {
    const user = currentUser(request);
    const client = await pool.connect();

    try {
      const couple = await getCurrentCouple(user.id);
      if (!couple) {
        response.status(409).json({ error: 'No couple connected' });
        return;
      }

      await client.query('begin');

      const questResult = await client.query(
        `
          select
            id,
            title,
            category,
            reward_points as "rewardPoints",
            requires_both_partners as "requiresBothPartners"
          from quests
          where id = $1
        `,
        [request.params.questId],
      );
      const quest = questResult.rows[0];
      if (!quest) {
        await client.query('rollback');
        response.status(404).json({ error: 'Quest not found' });
        return;
      }

      const coupleQuestResult = await client.query(
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
        [randomUUID(), couple.id, request.params.questId],
      );
      const coupleQuestId = coupleQuestResult.rows[0].id;

      const lockedQuestResult = await client.query(
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
      const coupleQuest = lockedQuestResult.rows[0];
      const completedBy = new Set<string>(coupleQuest.completedByUserIds ?? []);
      completedBy.add(user.id);
      const completedByUserIds = [...completedBy];

      const memberCountResult = await client.query(
        'select count(*)::int as count from couple_members where couple_id = $1',
        [couple.id],
      );
      const requiredConfirmations = quest.requiresBothPartners ? 2 : 1;
      const hasEnoughMembers = memberCountResult.rows[0].count >= requiredConfirmations;
      const isCompleted = hasEnoughMembers && completedByUserIds.length >= requiredConfirmations;

      await client.query(
        `
          update couple_quests
          set
            status = $2,
            completed_by_user_ids = $3,
            completed_at = case when $2 = 'completed' and completed_at is null then now() else completed_at end
          where id = $1
        `,
        [coupleQuestId, isCompleted ? 'completed' : 'accepted', completedByUserIds],
      );

      if (isCompleted && !coupleQuest.rewardAppliedAt) {
        await applyQuestReward(client, couple.id, coupleQuestId, quest);
      }

      await client.query('commit');

      const payload = await buildQuestPayload(user.id);
      response.json(payload);
    } catch (error) {
      await client.query('rollback');
      handleError(response, error);
    } finally {
      client.release();
    }
  });

  router.get('/love-jar', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      const payload = await buildLoveJarPayload(user.id);
      if (!payload) {
        response.status(409).json({ error: 'No couple connected' });
        return;
      }
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/love-jar', requireAuth, async (request, response) => {
    const user = currentUser(request);
    const text = normalizeText(request.body.text);
    const category = normalizeText(request.body.category) || 'compliment';
    const validCategories = new Set(['compliment', 'memory', 'voucher', 'wish', 'surprise']);

    if (!text) {
      response.status(400).json({ error: 'Note text is required' });
      return;
    }

    if (!validCategories.has(category)) {
      response.status(400).json({ error: 'Invalid note category' });
      return;
    }

    const client = await pool.connect();
    try {
      const couple = await getCurrentCouple(user.id);
      if (!couple) {
        response.status(409).json({ error: 'No couple connected' });
        return;
      }

      await client.query('begin');
      const noteId = randomUUID();
      await client.query(
        `
          insert into love_jar_notes (id, couple_id, author_id, text, category)
          values ($1, $2, $3, $4, $5)
        `,
        [noteId, couple.id, user.id, text, category],
      );
      await createLoveJarLight(client, couple.id, noteId);
      await client.query('commit');

      const payload = await buildLoveJarPayload(user.id);
      response.status(201).json(payload);
    } catch (error) {
      await client.query('rollback');
      handleError(response, error);
    } finally {
      client.release();
    }
  });

  router.post('/love-jar/draw', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      const couple = await getCurrentCouple(user.id);
      if (!couple) {
        response.status(409).json({ error: 'No couple connected' });
        return;
      }

      const noteResult = await pool.query(
        `
          update love_jar_notes
          set is_drawn = true,
              drawn_at = now()
          where id = (
            select id
            from love_jar_notes
            where couple_id = $1
              and author_id <> $2
              and is_drawn = false
            order by random()
            limit 1
          )
          returning id
        `,
        [couple.id, user.id],
      );

      if (!noteResult.rows[0]) {
        response.status(404).json({ error: 'No unread partner note available' });
        return;
      }

      const payload = await buildLoveJarPayload(user.id);
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/memories', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      const payload = await buildMemoryPayload(user.id);
      if (!payload) {
        response.status(409).json({ error: 'No couple connected' });
        return;
      }
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/memories', requireAuth, async (request, response) => {
    const user = currentUser(request);
    const title = normalizeText(request.body.title);
    const description = normalizeText(request.body.description) || null;
    const date = normalizeText(request.body.date) || todayIsoDate();
    const category = normalizeText(request.body.category) || 'everyday';
    const validCategories = new Set(['date', 'travel', 'milestone', 'funny', 'everyday', 'special']);

    if (!title) {
      response.status(400).json({ error: 'Memory title is required' });
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      response.status(400).json({ error: 'Memory date must be YYYY-MM-DD' });
      return;
    }

    if (!validCategories.has(category)) {
      response.status(400).json({ error: 'Invalid memory category' });
      return;
    }

    const client = await pool.connect();
    try {
      const couple = await getCurrentCouple(user.id);
      if (!couple) {
        response.status(409).json({ error: 'No couple connected' });
        return;
      }

      await client.query('begin');
      const memoryId = randomUUID();
      await client.query(
        `
          insert into memory_entries (id, couple_id, author_id, title, description, date, category)
          values ($1, $2, $3, $4, $5, $6, $7)
        `,
        [memoryId, couple.id, user.id, title, description, date, category],
      );
      const gardenObjectId = await createMemoryStone(client, couple.id, memoryId, title);
      if (gardenObjectId) {
        await client.query('update memory_entries set linked_garden_object_id = $1 where id = $2', [
          gardenObjectId,
          memoryId,
        ]);
      }
      await client.query('commit');

      const payload = await buildMemoryPayload(user.id);
      response.status(201).json(payload);
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

  router.get('/garden/objects/:objectId', requireAuth, async (request, response) => {
    const user = currentUser(request);
    const objectId = String(request.params.objectId);

    try {
      const payload = await buildGardenObjectDetail(user.id, objectId);
      if (!payload) {
        response.status(409).json({ error: 'No couple connected' });
        return;
      }
      if (!payload.object) {
        response.status(404).json({ error: 'Garden object not found' });
        return;
      }
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  return router;
}
