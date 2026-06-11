import bcrypt from 'bcryptjs';
import { randomInt, randomUUID } from 'node:crypto';
import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { currentUser, requireAuth, signToken } from './auth.js';
import { pool } from './db.js';
import { handleError, sendApiError } from './errors.js';

interface Queryable {
  query: typeof pool.query;
}

const defaultFeatureExplainerPreferences: Record<string, boolean> = {
  onboarding: true,
  today: true,
  quests: true,
  garden: true,
  knowMe: true,
  loveJar: true,
  memories: true,
  notifications: true,
  settings: true,
};

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

function shuffleKnowMeOptions(options: string[], correctOptionIndex: number) {
  const indexedOptions = options.map((option, index) => ({ option, wasCorrect: index === correctOptionIndex }));

  for (let index = indexedOptions.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [indexedOptions[index], indexedOptions[swapIndex]] = [indexedOptions[swapIndex], indexedOptions[index]];
  }

  let shuffledCorrectOptionIndex = indexedOptions.findIndex((option) => option.wasCorrect);
  if (correctOptionIndex === 0 && shuffledCorrectOptionIndex === 0 && indexedOptions.length > 1) {
    const swapIndex = randomInt(1, indexedOptions.length);
    [indexedOptions[0], indexedOptions[swapIndex]] = [indexedOptions[swapIndex], indexedOptions[0]];
    shuffledCorrectOptionIndex = swapIndex;
  }

  return {
    options: indexedOptions.map((option) => option.option),
    correctOptionIndex: shuffledCorrectOptionIndex,
  };
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeLocale(value: unknown) {
  if (typeof value !== 'string') return '';
  const locale = value.trim().toLowerCase().split(';')[0]?.split(',')[0]?.replace('_', '-') ?? '';
  return locale.split('-')[0] ?? '';
}

function parseAcceptLanguage(headerValue: string | undefined) {
  if (!headerValue) return '';
  const candidates = headerValue
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.find((param) => param.trim().startsWith('q='));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { locale: normalizeLocale(tag), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((candidate) => candidate.locale)
    .sort((left, right) => right.q - left.q);

  return candidates[0]?.locale ?? '';
}

async function resolveLocale(request: Request) {
  const requestedLocale = normalizeLocale(request.query.lang) || parseAcceptLanguage(request.header('accept-language')) || 'de';
  const result = await pool.query<{ locale: string; isDefault: boolean }>(
    `
      select locale, is_default as "isDefault"
      from supported_locales
      where active = true
    `,
  );
  const supported = result.rows;
  const defaultLocale = supported.find((locale) => locale.isDefault)?.locale ?? 'de';
  return supported.some((locale) => locale.locale === requestedLocale) ? requestedLocale : defaultLocale;
}

function publicUser(row: { id: string; email: string; displayName: string }) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    preferences: normalizeUserPreferences('preferences' in row ? row.preferences : undefined),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function normalizeBooleanRecord(value: unknown) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean'));
}

function normalizeUserPreferences(value: unknown) {
  const preferences = isRecord(value) ? value : {};
  return {
    ...preferences,
    featureExplainers: {
      ...defaultFeatureExplainerPreferences,
      ...normalizeBooleanRecord(preferences.featureExplainers),
    },
  };
}

function mergeUserPreferences(current: unknown, patch: unknown) {
  const normalizedCurrent = normalizeUserPreferences(current);
  if (!isRecord(patch)) return normalizedCurrent;

  return {
    ...normalizedCurrent,
    ...patch,
    featureExplainers: {
      ...normalizedCurrent.featureExplainers,
      ...normalizeBooleanRecord(patch.featureExplainers),
    },
  };
}

async function getPublicUser(userId: string) {
  const result = await pool.query(
    `
      select id, email, display_name as "displayName", preferences
      from profiles
      where id = $1
    `,
    [userId],
  );
  return result.rows[0] ? publicUser(result.rows[0]) : null;
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

async function getCoupleMemberIds(client: Queryable, coupleId: string) {
  const result = await client.query('select user_id as "userId" from couple_members where couple_id = $1', [coupleId]);
  return result.rows.map((row: { userId: string }) => row.userId);
}

async function createNotifications(
  client: Queryable,
  options: {
    coupleId: string;
    userIds: string[];
    type:
      | 'daily_answer_waiting'
      | 'daily_revealed'
      | 'quest_waiting_confirmation'
      | 'quest_completed'
      | 'love_jar_note'
      | 'memory_created'
      | 'know_me_question'
      | 'know_me_answered'
      | 'couple_disconnected';
    title: string;
    body: string;
    sourceType: string;
    sourceId?: string | null;
    titleKey?: string;
    bodyKey?: string;
    params?: Record<string, unknown>;
  },
) {
  const uniqueUserIds = [...new Set(options.userIds)].filter(Boolean);

  for (const userId of uniqueUserIds) {
    await client.query(
      `
        insert into notifications (id, couple_id, user_id, type, title, body, source_type, source_id, title_key, body_key, params)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        on conflict do nothing
      `,
      [
        randomUUID(),
        options.coupleId,
        userId,
        options.type,
        options.title,
        options.body,
        options.sourceType,
        options.sourceId ?? null,
        options.titleKey ?? null,
        options.bodyKey ?? null,
        JSON.stringify(options.params ?? {}),
      ],
    );
  }
}

async function getOrCreateTodayInstance(client: Queryable, coupleId: string) {
  const date = todayIsoDate();
  const questionResult = await client.query(
    `
      with couple_context as (
        select relationship_type, content_preference
        from couples
        where id = $1
      ),
      unanswered_previous_questions as (
        select distinct i.question_id
        from daily_question_instances i
        where i.couple_id = $1
          and i.date <> $2::date
          and not exists (
            select 1
            from daily_question_answers a
            where a.couple_id = i.couple_id
              and a.question_id = i.question_id
          )
      )
      select q.id
      from daily_questions q
      cross join couple_context c
      left join unanswered_previous_questions upq on upq.question_id = q.id
      where q.active = true
        and (c.relationship_type = 'long_distance' or q.long_distance_suitable = true)
        and not exists (
          select 1
          from daily_question_instances used
          where used.couple_id = $1
            and used.question_id = q.id
            and used.date <> $2::date
            and exists (
              select 1
              from daily_question_answers answer
              where answer.couple_id = used.couple_id
                and answer.question_id = used.question_id
            )
        )
      order by
        case when upq.question_id is not null then 0 else 1 end,
        case
          when c.content_preference = 'romantic' and q.category in ('romance', 'gratitude', 'connection') then 0
          when c.content_preference = 'playful' and q.category in ('humor', 'date', 'ritual') then 0
          when c.content_preference = 'deep' and q.category in ('deep', 'trust', 'future', 'support') then 0
          else 1
        end,
        md5(q.id::text || $1 || $2)
      limit 1
    `,
    [coupleId, date],
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
    categoryLabel: row.categoryLabel,
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

async function buildTodayPayload(userId: string, locale = 'de') {
  const couple = await getCurrentCouple(userId);
  if (!couple) {
    return null;
  }

  const instance = await getOrCreateTodayInstance(pool, couple.id);
  const questionResult = await pool.query(
    `
      select
        q.id,
        coalesce(requested.text, fallback.text, q.text) as text,
        q.category,
        q.depth_level as "depthLevel",
        q.long_distance_suitable as "longDistanceSuitable",
        q.active
      from daily_questions q
      left join daily_question_translations requested on requested.question_id = q.id and requested.locale = $2
      left join daily_question_translations fallback on fallback.question_id = q.id and fallback.locale = 'de'
      where q.id = $1
    `,
    [instance.questionId, locale],
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
      where a.couple_id = $1
        and a.question_id = $2
        and a.created_at::date = $3::date
      order by a.created_at
    `,
    [couple.id, instance.questionId, instance.date],
  );
  const answers = answersResult.rows;
  const answeredByCurrentUser = answers.some((answer) => answer.userId === userId);
  const revealed = answers.length >= 2;

  return {
    couple,
    locale,
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

interface QuestFilters {
  category?: string;
  effortLevel?: string;
  maxMinutes?: number;
  mode?: string;
}

function normalizeQuestFilters(query: Request['query']): QuestFilters {
  const category = normalizeText(query.category);
  const effortLevel = normalizeText(query.effortLevel);
  const mode = normalizeText(query.mode);
  const maxMinutesValue = Number(normalizeText(query.maxMinutes));

  return {
    category: category && category !== 'all' ? category : undefined,
    effortLevel: effortLevel && effortLevel !== 'all' ? effortLevel : undefined,
    maxMinutes: Number.isFinite(maxMinutesValue) && maxMinutesValue > 0 ? maxMinutesValue : undefined,
    mode: mode && mode !== 'all' ? mode : undefined,
  };
}

async function buildQuestPayload(userId: string, filters: QuestFilters = {}, locale = 'de') {
  const couple = await getCurrentCouple(userId);
  if (!couple) {
    return null;
  }

  const validEffortLevels = new Set(['low', 'medium', 'high']);
  const validModes = new Set(['solo', 'together', 'long_distance']);
  const whereClauses = ['q.active = true'];
  const params: unknown[] = [couple.id, locale];

  if (filters.category) {
    params.push(filters.category);
    whereClauses.push(`q.category = $${params.length}`);
  }

  if (filters.effortLevel && validEffortLevels.has(filters.effortLevel)) {
    params.push(filters.effortLevel);
    whereClauses.push(`q.effort_level = $${params.length}`);
  }

  if (filters.maxMinutes) {
    params.push(filters.maxMinutes);
    whereClauses.push(`q.estimated_minutes <= $${params.length}`);
  }

  if (filters.mode && validModes.has(filters.mode)) {
    if (filters.mode === 'solo') whereClauses.push('q.requires_both_partners = false');
    if (filters.mode === 'together') whereClauses.push('q.requires_both_partners = true');
    if (filters.mode === 'long_distance') whereClauses.push(`q.category = 'long_distance'`);
  }

  const result = await pool.query(
    `
      select
        q.id,
        coalesce(requested.title, fallback.title, q.title) as title,
        coalesce(requested.description, fallback.description, q.description) as description,
        q.category,
        coalesce(requested_category.label, fallback_category.label, category.label, q.category) as "categoryLabel",
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
      left join quest_translations requested on requested.quest_id = q.id and requested.locale = $2
      left join quest_translations fallback on fallback.quest_id = q.id and fallback.locale = 'de'
      left join content_categories category on category.content_type = 'quests' and category.value = q.category
      left join content_category_translations requested_category on requested_category.category_id = category.id and requested_category.locale = $2
      left join content_category_translations fallback_category on fallback_category.category_id = category.id and fallback_category.locale = 'de'
      where ${whereClauses.join(' and ')}
      order by coalesce(requested.title, fallback.title, q.title)
    `,
    params,
  );
  const categoryResult = await pool.query(
    `
      select
        c.value,
        coalesce(requested.label, fallback.label, c.label) as label
      from content_categories c
      left join content_category_translations requested on requested.category_id = c.id and requested.locale = $1
      left join content_category_translations fallback on fallback.category_id = c.id and fallback.locale = 'de'
      where c.content_type = 'quests' and c.active = true
      order by c.sort_order, label
    `,
    [locale],
  );

  return {
    couple,
    locale,
    categories: categoryResult.rows,
    quests: result.rows.map(mapQuest),
    filters,
  };
}

async function buildContentCategoryPayload(contentType: string, locale = 'de') {
  const result = await pool.query(
    `
      select
        c.value,
        coalesce(requested.label, fallback.label, c.label) as label
      from content_categories c
      left join content_category_translations requested on requested.category_id = c.id and requested.locale = $2
      left join content_category_translations fallback on fallback.category_id = c.id and fallback.locale = 'de'
      where c.content_type = $1 and c.active = true
      order by c.sort_order, label
    `,
    [contentType, locale],
  );
  return result.rows;
}

async function isActiveContentCategory(contentType: string, value: string) {
  const result = await pool.query(
    'select 1 from content_categories where content_type = $1 and value = $2 and active = true limit 1',
    [contentType, value],
  );
  return (result.rowCount ?? 0) > 0;
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
    categoryLabel: row.categoryLabel,
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
    categoryLabel: row.categoryLabel,
    linkedGardenObjectId: row.linkedGardenObjectId,
    createdAt: row.createdAt,
  };
}

function mapKnowMeRound(row: Record<string, unknown>) {
  return {
    id: row.id,
    coupleId: row.coupleId,
    authorId: row.authorId,
    authorName: row.authorName,
    catalogQuestionId: row.catalogQuestionId,
    questionText: row.questionText,
    options: row.options,
    correctOptionIndex: row.correctOptionIndex,
    status: row.status,
    rewardAppliedAt: row.rewardAppliedAt,
    answeredAt: row.answeredAt,
    createdAt: row.createdAt,
    guess: row.guessId
      ? {
          id: row.guessId,
          userId: row.guessUserId,
          userName: row.guessUserName,
          selectedOptionIndex: row.selectedOptionIndex,
          isCorrect: row.isCorrect,
          createdAt: row.guessCreatedAt,
        }
      : null,
  };
}

function mapKnowMeCatalogQuestion(row: Record<string, unknown>) {
  return {
    id: row.id,
    questionText: row.questionText,
    category: row.category,
  };
}

function mapNotification(row: Record<string, unknown>) {
  return {
    id: row.id,
    coupleId: row.coupleId,
    userId: row.userId,
    type: row.type,
    title: row.title,
    body: row.body,
    titleKey: row.titleKey,
    bodyKey: row.bodyKey,
    params: row.params ?? {},
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}

async function buildNotificationPayload(userId: string) {
  const result = await pool.query(
    `
      select
        id,
        couple_id as "coupleId",
        user_id as "userId",
        type,
        title,
        body,
        title_key as "titleKey",
        body_key as "bodyKey",
        params,
        source_type as "sourceType",
        source_id as "sourceId",
        read_at as "readAt",
        created_at as "createdAt"
      from notifications
      where user_id = $1
      order by created_at desc
      limit 50
    `,
    [userId],
  );
  const notifications = result.rows.map(mapNotification);

  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.readAt).length,
  };
}

async function buildMemoryPayload(userId: string, locale = 'de') {
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
        coalesce(
          requested_category.label,
          fallback_category.label,
          category.label,
          case
            when $2 = 'en' then
              case m.category
                when 'everyday' then 'Everyday'
                when 'date' then 'Date'
                when 'travel' then 'Travel'
                when 'milestone' then 'Milestone'
                when 'funny' then 'Funny'
                when 'special' then 'Special'
              end
            else
              case m.category
                when 'everyday' then 'Alltag'
                when 'date' then 'Date'
                when 'travel' then 'Reise'
                when 'milestone' then 'Meilenstein'
                when 'funny' then 'Lustig'
                when 'special' then 'Besonders'
              end
          end,
          m.category
        ) as "categoryLabel",
        m.linked_garden_object_id as "linkedGardenObjectId",
        m.created_at as "createdAt"
      from memory_entries m
      join profiles p on p.id = m.author_id
      left join content_categories category on category.content_type = 'memories' and category.value = m.category
      left join content_category_translations requested_category
        on requested_category.category_id = category.id and requested_category.locale = $2
      left join content_category_translations fallback_category
        on fallback_category.category_id = category.id and fallback_category.locale = 'de'
      where m.couple_id = $1
      order by m.date desc, m.created_at desc
    `,
    [couple.id, locale],
  );

  return {
    couple,
    categories: await buildContentCategoryPayload('memories', locale),
    memories: result.rows.map(mapMemoryEntry),
  };
}

async function buildKnowMePayload(userId: string, locale = 'de') {
  const couple = await getCurrentCouple(userId);
  if (!couple) {
    return null;
  }

  const result = await pool.query(
    `
      select
        q.id,
        q.couple_id as "coupleId",
        q.author_id as "authorId",
        author.display_name as "authorName",
        q.catalog_question_id as "catalogQuestionId",
        q.question_text as "questionText",
        q.options,
        q.correct_option_index as "correctOptionIndex",
        q.status,
        q.reward_applied_at as "rewardAppliedAt",
        q.answered_at as "answeredAt",
        q.created_at as "createdAt",
        g.id as "guessId",
        g.user_id as "guessUserId",
        guesser.display_name as "guessUserName",
        g.selected_option_index as "selectedOptionIndex",
        g.is_correct as "isCorrect",
        g.created_at as "guessCreatedAt"
      from know_me_questions q
      join profiles author on author.id = q.author_id
      left join know_me_guesses g on g.question_id = q.id
      left join profiles guesser on guesser.id = g.user_id
      where q.couple_id = $1
      order by q.created_at desc
    `,
    [couple.id],
  );

  const catalogResult = await pool.query(
    `
      select
        c.id,
        coalesce(requested.question_text, fallback.question_text, c.question_text) as "questionText",
        coalesce(requested.category_label, fallback.category_label, c.category) as category
      from know_me_catalog_questions c
      left join know_me_catalog_question_translations requested
        on requested.catalog_question_id = c.id and requested.locale = $3
      left join know_me_catalog_question_translations fallback
        on fallback.catalog_question_id = c.id and fallback.locale = 'de'
      where c.active = true
        and not exists (
          select 1
          from know_me_questions q
          where q.couple_id = $1
            and q.author_id = $2
            and q.catalog_question_id = c.id
        )
      order by c.sort_order, coalesce(requested.question_text, fallback.question_text, c.question_text)
    `,
    [couple.id, userId, locale],
  );

  return {
    couple,
    locale,
    rounds: result.rows.map(mapKnowMeRound),
    catalogQuestions: catalogResult.rows.map(mapKnowMeCatalogQuestion),
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

async function createKnowMeFlower(client: Queryable, coupleId: string, questionId: string) {
  const countResult = await client.query('select count(*)::int as count from garden_objects where couple_id = $1', [
    coupleId,
  ]);
  const [positionX, positionY] = gardenPositions[countResult.rows[0].count % gardenPositions.length];

  await client.query(
    `
      insert into garden_objects (
        id, couple_id, type, source_type, source_id, label, position_x, position_y, level
      )
      values ($1, $2, 'flower', 'know_me', $3, 'Kennst-du-mich-Blume', $4, $5, 1)
      on conflict do nothing
    `,
    [randomUUID(), coupleId, questionId, positionX, positionY],
  );
  await client.query(
    `
      update couples
      set heart_points = heart_points + 12,
          garden_stage = greatest(1, floor((heart_points + 12) / 80) + 1)
      where id = $1
    `,
    [coupleId],
  );
  await client.query('update know_me_questions set reward_applied_at = now() where id = $1', [questionId]);
}

async function buildGardenObjectDetail(userId: string, objectId: string, locale = 'de') {
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
          coalesce(requested_category.label, fallback_category.label, category.label, n.category) as "categoryLabel",
          n.is_drawn as "isDrawn",
          n.drawn_at as "drawnAt",
          n.created_at as "createdAt"
        from love_jar_notes n
        join profiles p on p.id = n.author_id
        left join content_categories category on category.content_type = 'love-jar-templates' and category.value = n.category
        left join content_category_translations requested_category
          on requested_category.category_id = category.id and requested_category.locale = $3
        left join content_category_translations fallback_category
          on fallback_category.category_id = category.id and fallback_category.locale = 'de'
        where n.id = $1 and n.couple_id = $2
      `,
      [object.sourceId, couple.id, locale],
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
          coalesce(
            requested_category.label,
            fallback_category.label,
            category.label,
            case
              when $3 = 'en' then
                case m.category
                  when 'everyday' then 'Everyday'
                  when 'date' then 'Date'
                  when 'travel' then 'Travel'
                  when 'milestone' then 'Milestone'
                  when 'funny' then 'Funny'
                  when 'special' then 'Special'
                end
              else
                case m.category
                  when 'everyday' then 'Alltag'
                  when 'date' then 'Date'
                  when 'travel' then 'Reise'
                  when 'milestone' then 'Meilenstein'
                  when 'funny' then 'Lustig'
                  when 'special' then 'Besonders'
                end
            end,
            m.category
          ) as "categoryLabel",
          m.created_at as "createdAt"
        from memory_entries m
        join profiles p on p.id = m.author_id
        left join content_categories category on category.content_type = 'memories' and category.value = m.category
        left join content_category_translations requested_category
          on requested_category.category_id = category.id and requested_category.locale = $3
        left join content_category_translations fallback_category
          on fallback_category.category_id = category.id and fallback_category.locale = 'de'
        where m.id = $1 and m.couple_id = $2
      `,
      [object.sourceId, couple.id, locale],
    );
    source = result.rows[0] ? { type: 'memory', ...result.rows[0] } : null;
  }

  if (object.sourceType === 'know_me') {
    const result = await pool.query(
      `
        select
          q.id,
          q.question_text as "questionText",
          q.options,
          q.correct_option_index as "correctOptionIndex",
          q.answered_at as "answeredAt",
          q.created_at as "createdAt",
          author.display_name as "authorName",
          guesser.display_name as "guessUserName",
          g.selected_option_index as "selectedOptionIndex",
          g.is_correct as "isCorrect",
          g.created_at as "guessCreatedAt"
        from know_me_questions q
        join profiles author on author.id = q.author_id
        left join know_me_guesses g on g.question_id = q.id
        left join profiles guesser on guesser.id = g.user_id
        where q.id = $1 and q.couple_id = $2
      `,
      [object.sourceId, couple.id],
    );
    source = result.rows[0] ? { type: 'know_me', ...result.rows[0] } : null;
  }

  return {
    couple,
    object: mapGardenObject(object),
    source,
  };
}

async function buildGardenProgress(coupleId: string) {
  const result = await pool.query(
    `
      select
        count(distinct dqi.id) filter (where dqi.reward_applied_at is not null)::int as "answeredQuestionCount",
        count(distinct cq.id) filter (where cq.status = 'completed')::int as "completedQuestCount",
        count(distinct n.id)::int as "loveJarNoteCount",
        count(distinct n.id) filter (where n.is_drawn = true)::int as "drawnLoveJarNoteCount",
        count(distinct m.id)::int as "memoryCount",
        count(distinct km.id) filter (where km.status = 'answered')::int as "knowMeRoundCount",
        count(distinct km.id) filter (where km.reward_applied_at is not null)::int as "knowMeHitCount",
        count(distinct go.id)::int as "gardenObjectCount",
        coalesce(max(go.created_at), c.created_at) as "lastGardenMomentAt"
      from couples c
      left join daily_question_instances dqi on dqi.couple_id = c.id
      left join couple_quests cq on cq.couple_id = c.id
      left join love_jar_notes n on n.couple_id = c.id
      left join memory_entries m on m.couple_id = c.id
      left join know_me_questions km on km.couple_id = c.id
      left join garden_objects go on go.couple_id = c.id
      where c.id = $1
      group by c.id
    `,
    [coupleId],
  );

  return (
    result.rows[0] ?? {
      answeredQuestionCount: 0,
      completedQuestCount: 0,
      loveJarNoteCount: 0,
      drawnLoveJarNoteCount: 0,
      memoryCount: 0,
      knowMeRoundCount: 0,
      knowMeHitCount: 0,
      gardenObjectCount: 0,
      lastGardenMomentAt: null,
    }
  );
}

async function buildLoveJarPayload(userId: string, locale = 'de') {
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
        coalesce(requested_category.label, fallback_category.label, category.label, n.category) as "categoryLabel",
        n.is_drawn as "isDrawn",
        n.drawn_at as "drawnAt",
        n.created_at as "createdAt"
      from love_jar_notes n
      join profiles p on p.id = n.author_id
      left join content_categories category on category.content_type = 'love-jar-templates' and category.value = n.category
      left join content_category_translations requested_category
        on requested_category.category_id = category.id and requested_category.locale = $2
      left join content_category_translations fallback_category
        on fallback_category.category_id = category.id and fallback_category.locale = 'de'
      where n.couple_id = $1
      order by n.created_at desc
    `,
    [couple.id, locale],
  );
  const statusResult = await pool.query(
    `
      select
        exists (
          select 1
          from love_jar_draws
          where couple_id = $1
            and user_id = $2
            and drawn_date = current_date
        ) as "drawnToday",
        count(*) filter (where author_id <> $2 and is_drawn = false)::int as "partnerUnreadCount",
        count(*) filter (where author_id = $2 and is_drawn = false)::int as "ownUnreadCount"
      from love_jar_notes
      where couple_id = $1
    `,
    [couple.id, userId],
  );
  const status = statusResult.rows[0];

  return {
    couple,
    notes: result.rows.map((note) => mapLoveJarNote(note, Boolean(note.isDrawn))),
    drawStatus: {
      drawnToday: Boolean(status.drawnToday),
      canDrawToday: !status.drawnToday && status.partnerUnreadCount > 0,
      partnerUnreadCount: status.partnerUnreadCount,
      ownUnreadCount: status.ownUnreadCount,
    },
  };
}

async function buildLoveJarTemplatePayload(locale = 'de') {
  const result = await pool.query(
    `
      select
        t.id,
        coalesce(requested.text, fallback.text, t.text) as text,
        t.category,
        coalesce(requested_category.label, fallback_category.label, category.label, t.category) as "categoryLabel"
      from love_jar_templates t
      left join love_jar_template_translations requested on requested.template_id = t.id and requested.locale = $1
      left join love_jar_template_translations fallback on fallback.template_id = t.id and fallback.locale = 'de'
      left join content_categories category on category.content_type = 'love-jar-templates' and category.value = t.category
      left join content_category_translations requested_category
        on requested_category.category_id = category.id and requested_category.locale = $1
      left join content_category_translations fallback_category
        on fallback_category.category_id = category.id and fallback_category.locale = 'de'
      where t.active = true
      order by t.sort_order, t.text
    `,
    [locale],
  );

  return {
    categories: await buildContentCategoryPayload('love-jar-templates', locale),
    templates: result.rows,
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

const inviteCodeWords: Record<string, string[]> = {
  de: [
    'abend',
    'anker',
    'apfel',
    'aster',
    'bach',
    'beere',
    'birke',
    'blume',
    'brise',
    'bruecke',
    'duft',
    'eiche',
    'falter',
    'feder',
    'feuer',
    'flamme',
    'garten',
    'glanz',
    'hafen',
    'herz',
    'himmel',
    'insel',
    'kakao',
    'kerze',
    'kirsch',
    'kleeblatt',
    'kompass',
    'kranz',
    'laterne',
    'lilie',
    'licht',
    'mandel',
    'meer',
    'melodie',
    'mond',
    'morgen',
    'muschel',
    'nebel',
    'nest',
    'olive',
    'pfad',
    'quelle',
    'regen',
    'rose',
    'schatz',
    'schimmer',
    'segel',
    'sonne',
    'stern',
    'strand',
    'tau',
    'traum',
    'ufer',
    'wald',
    'wiese',
    'wind',
    'wolke',
    'wunder',
  ],
  en: [
    'anchor',
    'apple',
    'beacon',
    'berry',
    'bloom',
    'bridge',
    'brook',
    'candle',
    'cedar',
    'charm',
    'clover',
    'cocoa',
    'comet',
    'compass',
    'dawn',
    'ember',
    'feather',
    'field',
    'flame',
    'garden',
    'glimmer',
    'harbor',
    'heart',
    'honey',
    'island',
    'lantern',
    'lily',
    'maple',
    'meadow',
    'melody',
    'moon',
    'nest',
    'olive',
    'pebble',
    'petal',
    'river',
    'rose',
    'sail',
    'shell',
    'shore',
    'spark',
    'spring',
    'star',
    'stone',
    'sun',
    'thread',
    'tide',
    'trail',
    'violet',
    'willow',
    'wind',
    'wonder',
  ],
};

function inviteCode(locale = 'de') {
  const words = inviteCodeWords[locale] ?? inviteCodeWords.de;
  const first = words[randomInt(words.length)];
  let second = words[randomInt(words.length)];
  while (second === first) {
    second = words[randomInt(words.length)];
  }
  const number = String(randomInt(1000, 10000));
  return `${first}-${second}-${number}`;
}

async function createUniqueInviteCode(locale = 'de') {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = inviteCode(locale);
    const result = await pool.query('select 1 from couples where lower(invite_code) = lower($1)', [code]);
    if (result.rowCount === 0) return code;
  }

  throw new Error('Could not create unique invite code');
}

export function apiRouter(): Router {
  const router = createRouter();

  router.post('/auth/register', async (request, response) => {
    const email = normalizeEmail(request.body.email);
    const displayName = normalizeText(request.body.displayName);
    const password = normalizeText(request.body.password);

    if (!email || !displayName || password.length < 8) {
      sendApiError(response, 400, 'auth.registrationInvalid');
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
        sendApiError(response, 409, 'auth.emailAlreadyRegistered');
        return;
      }
      handleError(response, error);
    }
  });

  router.post('/auth/login', async (request, response) => {
    const email = normalizeEmail(request.body.email);
    const password = normalizeText(request.body.password);

    if (!email || !password) {
      sendApiError(response, 400, 'auth.registrationInvalid');
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
        sendApiError(response, 401, 'auth.invalidCredentials');
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
    try {
      const [profile, couple] = await Promise.all([getPublicUser(user.id), getCurrentCouple(user.id)]);
      response.json({ user: profile ?? user, couple });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.patch('/me/preferences', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      const currentResult = await pool.query('select preferences from profiles where id = $1', [user.id]);
      const currentPreferences = currentResult.rows[0]?.preferences ?? {};
      const incomingPreferences = isRecord(request.body.preferences) ? request.body.preferences : request.body;
      const preferences = mergeUserPreferences(currentPreferences, incomingPreferences);
      const updated = await pool.query(
        `
          update profiles
          set preferences = $2::jsonb,
              updated_at = now()
          where id = $1
          returning id, email, display_name as "displayName", preferences
        `,
        [user.id, JSON.stringify(preferences)],
      );
      const couple = await getCurrentCouple(user.id);
      response.json({ user: publicUser(updated.rows[0]), couple });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/notifications', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      response.json(await buildNotificationPayload(user.id));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/notifications/read-all', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      await pool.query('update notifications set read_at = now() where user_id = $1 and read_at is null', [user.id]);
      response.json(await buildNotificationPayload(user.id));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/notifications/:notificationId/read', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      const result = await pool.query(
        `
          update notifications
          set read_at = coalesce(read_at, now())
          where id = $1 and user_id = $2
          returning id
        `,
        [request.params.notificationId, user.id],
      );

      if (!result.rows[0]) {
        sendApiError(response, 404, 'notification.notFound');
        return;
      }

      response.json(await buildNotificationPayload(user.id));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/me/export', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      const locale = await resolveLocale(request);
      const couple = await getCurrentCouple(user.id);
      const payload: Record<string, unknown> = {
        exportedAt: new Date().toISOString(),
        locale,
        user,
        couple,
      };

      if (couple) {
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
            [couple.id],
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
            [couple.id, locale],
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
            [couple.id, locale],
          ),
          pool.query('select * from garden_objects where couple_id = $1 order by created_at', [couple.id]),
          pool.query('select * from love_jar_notes where couple_id = $1 order by created_at', [couple.id]),
          pool.query('select * from memory_entries where couple_id = $1 order by date desc, created_at desc', [couple.id]),
            pool.query('select * from know_me_questions where couple_id = $1 order by created_at desc', [couple.id]),
            pool.query(
              `
                select g.*
                from know_me_guesses g
                join know_me_questions q on q.id = g.question_id
                where q.couple_id = $1
                order by g.created_at desc
              `,
              [couple.id],
            ),
            pool.query('select * from notifications where couple_id = $1 order by created_at desc', [couple.id]),
          ]);

        payload.data = {
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
      for (const membership of memberships.rows) {
        const partnerResult = await client.query(
          `
            select p.id
            from couple_members cm
            join profiles p on p.id = cm.user_id
            where cm.couple_id = $1 and cm.user_id <> $2
          `,
          [membership.couple_id, user.id],
        );
        await createNotifications(client, {
          coupleId: membership.couple_id,
          userIds: partnerResult.rows.map((row: { id: string }) => row.id),
          type: 'couple_disconnected',
          title: 'Paarung wurde getrennt',
          body: `${user.displayName} hat das Konto gelöscht. Eure Paarung wurde deshalb getrennt. Du kannst dich jetzt neu paaren.`,
          titleKey: 'notifications.titles.coupleDisconnected',
          bodyKey: 'notifications.bodies.coupleDisconnected',
          params: { name: user.displayName },
          sourceType: 'account_deletion',
          sourceId: null,
        });
        await client.query('delete from couple_members where couple_id = $1', [membership.couple_id]);
      }
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
        [user.id],
      );
      await client.query(
        `
          delete from garden_objects
          where source_type = 'love_jar'
            and source_id in (select id from love_jar_notes where author_id = $1)
        `,
        [user.id],
      );
      await client.query(
        `
          delete from garden_objects
          where source_type = 'memory'
            and source_id in (select id from memory_entries where author_id = $1)
        `,
        [user.id],
      );
      await client.query(
        `
          delete from garden_objects
          where source_type = 'know_me'
            and source_id in (select id from know_me_questions where author_id = $1)
        `,
        [user.id],
      );
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
      const locale = await resolveLocale(request);
      const existing = await getCurrentCouple(user.id);
      if (existing) {
        sendApiError(response, 409, 'couple.alreadyConnected');
        return;
      }

      const coupleId = randomUUID();
      const code = await createUniqueInviteCode(locale);
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
    const code = normalizeText(request.body.inviteCode).toLowerCase();

    if (!code) {
      sendApiError(response, 400, 'couple.inviteCodeRequired');
      return;
    }

    try {
      const existing = await getCurrentCouple(user.id);
      if (existing) {
        sendApiError(response, 409, 'couple.alreadyConnected');
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
          where lower(invite_code) = $1
        `,
        [code],
      );
      const couple = coupleResult.rows[0];
      if (!couple) {
        sendApiError(response, 404, 'couple.inviteCodeNotFound', { code });
        return;
      }

      const memberCount = await pool.query('select count(*)::int as count from couple_members where couple_id = $1', [
        couple.id,
      ]);
      if (memberCount.rows[0].count >= 2) {
        sendApiError(response, 409, 'couple.full');
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
        sendApiError(response, 409, 'couple.notConnected');
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

      response.json({ user: (await getPublicUser(user.id)) ?? user, couple: null });
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
      const locale = await resolveLocale(request);
      const payload = await buildTodayPayload(user.id, locale);
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
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
      sendApiError(response, 400, 'today.answerRequired');
      return;
    }

    const client = await pool.connect();
    try {
      const locale = await resolveLocale(request);
      const couple = await getCurrentCouple(user.id);
      if (!couple) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }

      const member = await ensureCoupleMembership(user.id, couple.id);
      if (!member) {
        sendApiError(response, 403, 'couple.accessDenied');
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
          where a.couple_id = $1
            and a.question_id = $2
            and a.created_at::date = $3::date
          order by a.created_at
        `,
        [couple.id, instance.questionId, instance.date],
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
        const memberIds = await getCoupleMemberIds(client, couple.id);
        await createNotifications(client, {
          coupleId: couple.id,
          userIds: memberIds,
          type: 'daily_revealed',
          title: 'Eure Antworten sind sichtbar',
          body: 'Aus euren Antworten ist ein neuer Gartenmoment gewachsen.',
          titleKey: 'notifications.titles.dailyRevealed',
          bodyKey: 'notifications.bodies.dailyRevealed',
          sourceType: 'today',
          sourceId: instance.id,
        });
      } else if (answersResult.rows.length === 1) {
        const memberIds = await getCoupleMemberIds(client, couple.id);
        await createNotifications(client, {
          coupleId: couple.id,
          userIds: memberIds.filter((memberId) => memberId !== user.id),
          type: 'daily_answer_waiting',
          title: 'Eine Antwort wartet',
          body: `${user.displayName} hat die Tagesfrage beantwortet. Wenn du antwortest, seht ihr beide eure Gedanken.`,
          titleKey: 'notifications.titles.dailyAnswerWaiting',
          bodyKey: 'notifications.bodies.dailyAnswerWaiting',
          params: { name: user.displayName },
          sourceType: 'today',
          sourceId: instance.id,
        });
      }

      await client.query('commit');

      const payload = await buildTodayPayload(user.id, locale);
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
      const locale = await resolveLocale(request);
      const payload = await buildQuestPayload(user.id, normalizeQuestFilters(request.query), locale);
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
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
      const locale = await resolveLocale(request);
      const couple = await getCurrentCouple(user.id);
      if (!couple) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }

      const questResult = await pool.query('select id from quests where id = $1', [request.params.questId]);
      if (!questResult.rows[0]) {
        sendApiError(response, 404, 'quest.notFound');
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

      const payload = await buildQuestPayload(user.id, {}, locale);
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/quests/:questId/complete', requireAuth, async (request, response) => {
    const user = currentUser(request);
    const client = await pool.connect();

    try {
      const locale = await resolveLocale(request);
      const couple = await getCurrentCouple(user.id);
      if (!couple) {
        sendApiError(response, 409, 'couple.notConnected');
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
        sendApiError(response, 404, 'quest.notFound');
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
        const memberIds = await getCoupleMemberIds(client, couple.id);
        await createNotifications(client, {
          coupleId: couple.id,
          userIds: memberIds,
          type: 'quest_completed',
          title: 'Quest abgeschlossen',
          body: `Eure Quest "${quest.title}" hat euren Garten wachsen lassen.`,
          titleKey: 'notifications.titles.questCompleted',
          bodyKey: 'notifications.bodies.questCompleted',
          params: { title: quest.title },
          sourceType: 'quest',
          sourceId: coupleQuestId,
        });
      } else if (!isCompleted) {
        const memberIds = await getCoupleMemberIds(client, couple.id);
        await createNotifications(client, {
          coupleId: couple.id,
          userIds: memberIds.filter((memberId) => memberId !== user.id),
          type: 'quest_waiting_confirmation',
          title: 'Quest wartet auf dich',
          body: `${user.displayName} hat "${quest.title}" bestätigt. Wenn es für dich auch passt, kannst du sie abschließen.`,
          titleKey: 'notifications.titles.questWaitingConfirmation',
          bodyKey: 'notifications.bodies.questWaitingConfirmation',
          params: { name: user.displayName, title: quest.title },
          sourceType: 'quest',
          sourceId: coupleQuestId,
        });
      }

      await client.query('commit');

      const payload = await buildQuestPayload(user.id, {}, locale);
      response.json(payload);
    } catch (error) {
      await client.query('rollback');
      handleError(response, error);
    } finally {
      client.release();
    }
  });

  router.get('/know-me', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      const locale = await resolveLocale(request);
      const payload = await buildKnowMePayload(user.id, locale);
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/know-me', requireAuth, async (request, response) => {
    const user = currentUser(request);
    const freeQuestionText = normalizeText(request.body.questionText);
    const catalogQuestionId = normalizeText(request.body.catalogQuestionId) || null;
    const options = Array.isArray(request.body.options)
      ? request.body.options.map((option: unknown) => normalizeText(option)).filter(Boolean)
      : [];
    const correctOptionIndex = Number(request.body.correctOptionIndex);

    if (catalogQuestionId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catalogQuestionId)) {
      sendApiError(response, 400, 'knowMe.invalidCatalogQuestionId');
      return;
    }

    if ((!catalogQuestionId && !freeQuestionText) || options.length < 2 || options.length > 4) {
      sendApiError(response, 400, 'knowMe.questionInvalid');
      return;
    }

    if (!Number.isInteger(correctOptionIndex) || correctOptionIndex < 0 || correctOptionIndex >= options.length) {
      sendApiError(response, 400, 'knowMe.correctOptionInvalid');
      return;
    }

    const client = await pool.connect();
    try {
      const locale = await resolveLocale(request);
      const couple = await getCurrentCouple(user.id);
      if (!couple) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }

      await client.query('begin');
      let questionText = freeQuestionText;
      if (catalogQuestionId) {
        const catalogResult = await client.query(
          `
            select coalesce(requested.question_text, fallback.question_text, c.question_text) as "questionText"
            from know_me_catalog_questions c
            left join know_me_catalog_question_translations requested
              on requested.catalog_question_id = c.id and requested.locale = $2
            left join know_me_catalog_question_translations fallback
              on fallback.catalog_question_id = c.id and fallback.locale = 'de'
            where c.id = $1 and c.active = true
          `,
          [catalogQuestionId, locale],
        );
        const catalogQuestion = catalogResult.rows[0];
        if (!catalogQuestion) {
          await client.query('rollback');
          sendApiError(response, 400, 'knowMe.catalogQuestionNotFound');
          return;
        }

        const alreadyUsedResult = await client.query(
          `
            select 1
            from know_me_questions
            where couple_id = $1
              and author_id = $2
              and catalog_question_id = $3
            limit 1
          `,
          [couple.id, user.id, catalogQuestionId],
        );
        if ((alreadyUsedResult.rowCount ?? 0) > 0) {
          await client.query('rollback');
          sendApiError(response, 409, 'knowMe.catalogQuestionAlreadyUsed');
          return;
        }

        questionText = catalogQuestion.questionText;
      }

      const questionId = randomUUID();
      const shuffled = shuffleKnowMeOptions(options, correctOptionIndex);
      await client.query(
        `
          insert into know_me_questions (
            id, couple_id, author_id, catalog_question_id, question_text, options, correct_option_index
          )
          values ($1, $2, $3, $4, $5, $6, $7)
        `,
        [questionId, couple.id, user.id, catalogQuestionId, questionText, JSON.stringify(shuffled.options), shuffled.correctOptionIndex],
      );
      const memberIds = await getCoupleMemberIds(client, couple.id);
      await createNotifications(client, {
        coupleId: couple.id,
        userIds: memberIds.filter((memberId) => memberId !== user.id),
        type: 'know_me_question',
        title: 'Eine Kennst-du-mich-Frage wartet',
        body: `${user.displayName} hat eine Frage über sich gestellt. Was schätzt du?`,
        titleKey: 'notifications.titles.knowMeQuestion',
        bodyKey: 'notifications.bodies.knowMeQuestion',
        params: { name: user.displayName },
        sourceType: 'know_me',
        sourceId: questionId,
      });
      await client.query('commit');

      response.status(201).json(await buildKnowMePayload(user.id, locale));
    } catch (error) {
      await client.query('rollback');
      handleError(response, error);
    } finally {
      client.release();
    }
  });

  router.post('/know-me/:questionId/guess', requireAuth, async (request, response) => {
    const user = currentUser(request);
    const selectedOptionIndex = Number(request.body.selectedOptionIndex);

    if (!Number.isInteger(selectedOptionIndex) || selectedOptionIndex < 0 || selectedOptionIndex > 3) {
      sendApiError(response, 400, 'knowMe.selectedOptionInvalid');
      return;
    }

    const client = await pool.connect();
    try {
      const locale = await resolveLocale(request);
      const couple = await getCurrentCouple(user.id);
      if (!couple) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }

      await client.query('begin');
      const questionResult = await client.query(
        `
          select
            q.id,
            q.author_id as "authorId",
            q.question_text as "questionText",
            q.options,
            q.correct_option_index as "correctOptionIndex",
            q.status,
            q.reward_applied_at as "rewardAppliedAt",
            p.display_name as "authorName"
          from know_me_questions q
          join profiles p on p.id = q.author_id
          where q.id = $1 and q.couple_id = $2
          for update
        `,
        [request.params.questionId, couple.id],
      );
      const question = questionResult.rows[0];
      if (!question) {
        await client.query('rollback');
        sendApiError(response, 404, 'knowMe.questionNotFound');
        return;
      }

      if (question.authorId === user.id) {
        await client.query('rollback');
        sendApiError(response, 403, 'knowMe.authorCannotGuessOwnQuestion');
        return;
      }

      if (question.status !== 'open') {
        await client.query('rollback');
        sendApiError(response, 409, 'knowMe.questionAlreadyAnswered');
        return;
      }

      if (selectedOptionIndex >= question.options.length) {
        await client.query('rollback');
        sendApiError(response, 400, 'knowMe.optionDoesNotExist');
        return;
      }

      const isCorrect = selectedOptionIndex === question.correctOptionIndex;
      await client.query(
        `
          insert into know_me_guesses (id, question_id, user_id, selected_option_index, is_correct)
          values ($1, $2, $3, $4, $5)
        `,
        [randomUUID(), question.id, user.id, selectedOptionIndex, isCorrect],
      );
      await client.query("update know_me_questions set status = 'answered', answered_at = now() where id = $1", [
        question.id,
      ]);

      if (isCorrect && !question.rewardAppliedAt) {
        await createKnowMeFlower(client, couple.id, question.id);
      }

      await createNotifications(client, {
        coupleId: couple.id,
        userIds: [question.authorId],
        type: 'know_me_answered',
        title: isCorrect ? 'Treffer im Kennst-du-mich-Spiel' : 'Eine Antwort ist da',
        body: isCorrect
          ? `${user.displayName} hat dich richtig eingeschätzt. Eine besondere Blume ist gewachsen.`
          : `${user.displayName} hat geraten. Nicht getroffen, aber ein neuer Gesprächsanlass.`,
        titleKey: isCorrect ? 'notifications.titles.knowMeAnsweredHit' : 'notifications.titles.knowMeAnsweredMiss',
        bodyKey: isCorrect ? 'notifications.bodies.knowMeAnsweredHit' : 'notifications.bodies.knowMeAnsweredMiss',
        params: { name: user.displayName },
        sourceType: 'know_me',
        sourceId: question.id,
      });

      await client.query('commit');
      response.json(await buildKnowMePayload(user.id, locale));
    } catch (error) {
      await client.query('rollback');
      handleError(response, error);
    } finally {
      client.release();
    }
  });

  router.get('/love-jar/templates', requireAuth, async (request, response) => {
    try {
      const locale = await resolveLocale(request);
      response.json(await buildLoveJarTemplatePayload(locale));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/love-jar', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      const locale = await resolveLocale(request);
      const payload = await buildLoveJarPayload(user.id, locale);
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
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

    if (!text) {
      sendApiError(response, 400, 'loveJar.noteRequired');
      return;
    }

    const client = await pool.connect();
    try {
      const locale = await resolveLocale(request);
      if (!(await isActiveContentCategory('love-jar-templates', category))) {
        sendApiError(response, 400, 'loveJar.invalidCategory');
        return;
      }
      const couple = await getCurrentCouple(user.id);
      if (!couple) {
        sendApiError(response, 409, 'couple.notConnected');
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
      const memberIds = await getCoupleMemberIds(client, couple.id);
      await createNotifications(client, {
        coupleId: couple.id,
        userIds: memberIds.filter((memberId) => memberId !== user.id),
        type: 'love_jar_note',
        title: 'Ein neuer Zettel wartet',
        body: `${user.displayName} hat etwas in euren Love Jar gelegt.`,
        titleKey: 'notifications.titles.loveJarNote',
        bodyKey: 'notifications.bodies.loveJarNote',
        params: { name: user.displayName },
        sourceType: 'love_jar',
        sourceId: noteId,
      });
      await client.query('commit');

      const payload = await buildLoveJarPayload(user.id, locale);
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
    const client = await pool.connect();

    try {
      const locale = await resolveLocale(request);
      const couple = await getCurrentCouple(user.id);
      if (!couple) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }

      await client.query('begin');

      const alreadyDrawnResult = await client.query(
        `
          select 1
          from love_jar_draws
          where couple_id = $1
            and user_id = $2
            and drawn_date = current_date
          for update
        `,
        [couple.id, user.id],
      );

      if ((alreadyDrawnResult.rowCount ?? 0) > 0) {
        await client.query('rollback');
        sendApiError(response, 409, 'loveJar.alreadyDrawnToday');
        return;
      }

      const noteResult = await client.query(
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
            order by
              random()
            limit 1
            for update skip locked
          )
          returning id
        `,
        [couple.id, user.id],
      );

      if (!noteResult.rows[0]) {
        await client.query('rollback');
        sendApiError(response, 404, 'loveJar.noUnreadNote');
        return;
      }

      await client.query(
        `
          insert into love_jar_draws (id, couple_id, user_id, note_id, drawn_date)
          values ($1, $2, $3, $4, current_date)
        `,
        [randomUUID(), couple.id, user.id, noteResult.rows[0].id],
      );
      await client.query('commit');

      const payload = await buildLoveJarPayload(user.id, locale);
      response.json(payload);
    } catch (error) {
      await client.query('rollback');
      handleError(response, error);
    } finally {
      client.release();
    }
  });

  router.get('/memories', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      const locale = await resolveLocale(request);
      const payload = await buildMemoryPayload(user.id, locale);
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
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

    if (!title) {
      sendApiError(response, 400, 'memory.titleRequired');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      sendApiError(response, 400, 'memory.invalidDate');
      return;
    }

    const client = await pool.connect();
    try {
      const locale = await resolveLocale(request);
      if (!(await isActiveContentCategory('memories', category))) {
        sendApiError(response, 400, 'memory.invalidCategory');
        return;
      }
      const couple = await getCurrentCouple(user.id);
      if (!couple) {
        sendApiError(response, 409, 'couple.notConnected');
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
      const memberIds = await getCoupleMemberIds(client, couple.id);
      await createNotifications(client, {
        coupleId: couple.id,
        userIds: memberIds.filter((memberId) => memberId !== user.id),
        type: 'memory_created',
        title: 'Neue Erinnerung',
        body: `${user.displayName} hat "${title}" in eure Timeline gelegt.`,
        titleKey: 'notifications.titles.memoryCreated',
        bodyKey: 'notifications.bodies.memoryCreated',
        params: { name: user.displayName, title },
        sourceType: 'memory',
        sourceId: memoryId,
      });
      await client.query('commit');

      const payload = await buildMemoryPayload(user.id, locale);
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
      sendApiError(response, 409, 'couple.notConnected');
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
        progress: await buildGardenProgress(couple.id),
      });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/garden/objects/:objectId', requireAuth, async (request, response) => {
    const user = currentUser(request);
    const objectId = String(request.params.objectId);

    try {
      const locale = await resolveLocale(request);
      const payload = await buildGardenObjectDetail(user.id, objectId, locale);
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }
      if (!payload.object) {
        sendApiError(response, 404, 'garden.objectNotFound');
        return;
      }
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  return router;
}
