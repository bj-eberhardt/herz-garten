import { randomInt, randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { pool } from '../db.js';
import { type NotificationMessageKey, translateNotificationBackend } from '../i18n/messages.js';
import {
  normalizePushNotificationMode,
  shouldSendPushForMode,
  type PushNotificationMode,
} from './notifications/notificationPolicy.js';
import { sendPushNotifications, type PushNotificationPayload } from './push/push.service.js';
import { fallbackAreaKey, gardenAssetObjectType, listGardenAreas, type GardenArea } from './garden/catalog.js';
import {
  addCoupleHeartPoints,
  gardenStageAfterReward,
  gardenStageForPoints,
  nextGardenUnlock,
} from './garden/levels.repository.js';

export { fallbackAreaKey, gardenStageAfterReward, gardenStageForPoints, nextGardenUnlock };

export interface Queryable {
  query: typeof pool.query;
}

export interface PublicUserRow {
  id: string;
  email: string;
  displayName: string;
  preferences?: unknown;
}

export interface CurrentCouple {
  id: string;
  inviteCode: string;
  relationshipType: string;
  relationshipTypeLabel?: string;
  contentPreference: string;
  contentPreferenceLabel?: string;
  heartPoints: number;
  gardenStage: number;
  createdAt: Date | string;
  memberCount: number;
}

export interface GardenObjectRow {
  id: string;
  coupleId: string;
  type: string;
  sourceType: string;
  sourceId: string | null;
  label: string;
  areaKey: string | null;
  assetKey: string | null;
  historyTitle?: string | null;
  positionX: number;
  positionY: number;
  zIndex: number | null;
  scale: number | string | null;
  rotation: number | null;
  placedByUser: boolean;
  rewardPoints: number | string | null;
  level: number;
  createdAt: Date | string;
}

export interface QuestRow {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  estimatedMinutes: number;
  effortLevel: string;
  rewardPoints: number;
  rewardSeedType: string | null;
  requiresBothPartners: boolean;
  coupleQuestId: string | null;
  status: string;
  completedByUserIds: string[];
  completedAt: Date | string | null;
  rewardAppliedAt: Date | string | null;
}

export interface QuestRewardSource {
  title: string;
  category: string;
  rewardPoints: number;
}

export interface LoveJarNoteRow {
  id: string;
  coupleId: string;
  authorId: string;
  authorName: string;
  text: string | null;
  category: string;
  categoryLabel: string;
  isDrawn: boolean;
  drawnAt: Date | string | null;
  createdAt: Date | string;
}

export interface LoveJarDrawStatusRow {
  drawnToday: boolean;
  partnerUnreadCount: number;
  ownUnreadCount: number;
}

export interface LoveJarTemplateRow {
  id: string;
  text: string;
  category: string;
  categoryLabel: string;
}

export interface GardenProgressRow {
  answeredQuestionCount: number;
  completedQuestCount: number;
  loveJarNoteCount: number;
  drawnLoveJarNoteCount: number;
  memoryCount: number;
  knowMeRoundCount: number;
  knowMeHitCount: number;
  gardenObjectCount: number;
  lastGardenMomentAt: Date | string | null;
}

export interface QuestionDetailRow {
  id: string;
  date: Date | string;
  question: string;
  answers: Array<{ displayName: string; answerText: string | null; createdAt: Date | string }>;
}

export interface QuestDetailRow {
  id: string;
  title: string;
  description: string;
  category: string;
  rewardPoints: number;
  completedAt: Date | string | null;
}

export interface LoveJarDetailRow {
  id: string;
  authorName: string;
  text: string | null;
  category: string;
  categoryLabel: string;
  isDrawn: boolean;
  drawnAt: Date | string | null;
  createdAt: Date | string;
}

export interface MemoryDetailRow {
  id: string;
  authorName: string;
  title: string;
  description: string | null;
  date: Date | string;
  category: string;
  categoryLabel: string;
  createdAt: Date | string;
}

export interface KnowMeDetailRow {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  answeredAt: Date | string | null;
  createdAt: Date | string;
  authorName: string;
  guessUserName: string | null;
  selectedOptionIndex: number | null;
  isCorrect: boolean | null;
  guessCreatedAt: Date | string | null;
}

export type GardenObjectDetailSource =
  | ({ type: 'question' } & QuestionDetailRow)
  | ({ type: 'quest' } & QuestDetailRow)
  | ({ type: 'love_jar' } & LoveJarDetailRow)
  | ({ type: 'memory' } & MemoryDetailRow)
  | ({ type: 'know_me' } & KnowMeDetailRow);

export interface GardenObjectDetailPayload {
  couple: CurrentCouple;
  object: ReturnType<typeof mapGardenObject> | null;
  source: GardenObjectDetailSource | null;
}

export interface MemoryEntryRow {
  id: string;
  coupleId: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string | null;
  date: Date | string;
  imageUrl?: string | null;
  category: string;
  categoryLabel: string;
  linkedGardenObjectId?: string | null;
  createdAt: Date | string;
}

export interface KnowMeRoundRow {
  id: string;
  coupleId: string;
  authorId: string;
  authorName: string;
  catalogQuestionId: string | null;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  status: string;
  rewardAppliedAt: Date | string | null;
  answeredAt: Date | string | null;
  createdAt: Date | string;
  guessId: string | null;
  guessUserId: string | null;
  guessUserName: string | null;
  selectedOptionIndex: number | null;
  isCorrect: boolean | null;
  guessCreatedAt: Date | string | null;
}

export interface KnowMeCatalogQuestionRow {
  id: string;
  questionText: string;
  category: string;
}

export interface NotificationRow {
  id: string;
  coupleId: string | null;
  userId: string;
  type: string;
  title: string;
  body: string;
  titleKey: string | null;
  bodyKey: string | null;
  params: Record<string, unknown> | null;
  sourceType: string;
  sourceId: string | null;
  readAt: Date | string | null;
  createdAt: Date | string;
}

export interface CategoryOptionRow {
  value: string;
  label: string;
}

export const defaultFeatureExplainerPreferences: Record<string, boolean> = {
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

export function normalizeEmail(email: unknown) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function shuffleKnowMeOptions(options: string[], correctOptionIndex: number) {
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

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function normalizeLocale(value: unknown) {
  if (typeof value !== 'string') return '';
  const locale = value.trim().toLowerCase().split(';')[0]?.split(',')[0]?.replace('_', '-') ?? '';
  return locale.split('-')[0] ?? '';
}

export function parseAcceptLanguage(headerValue: string | undefined) {
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

export async function resolveLocale(request: Request) {
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

export function publicUser(row: PublicUserRow) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    preferences: normalizeUserPreferences('preferences' in row ? row.preferences : undefined),
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function normalizeBooleanRecord(value: unknown) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean'));
}

export function normalizeUserPreferences(value: unknown) {
  const preferences = isRecord(value) ? value : {};
  return {
    ...preferences,
    featureExplainers: {
      ...defaultFeatureExplainerPreferences,
      ...normalizeBooleanRecord(preferences.featureExplainers),
    },
    pushNotificationMode: normalizePushNotificationMode(preferences.pushNotificationMode),
  };
}

export function mergeUserPreferences(current: unknown, patch: unknown) {
  const normalizedCurrent = normalizeUserPreferences(current);
  if (!isRecord(patch)) return normalizedCurrent;

  return {
    ...normalizedCurrent,
    ...patch,
    featureExplainers: {
      ...normalizedCurrent.featureExplainers,
      ...normalizeBooleanRecord(patch.featureExplainers),
    },
    pushNotificationMode:
      'pushNotificationMode' in patch
        ? normalizePushNotificationMode(patch.pushNotificationMode)
        : normalizedCurrent.pushNotificationMode,
  };
}

async function pushNotificationModesForUsers(client: Queryable, userIds: string[]) {
  if (userIds.length === 0) return new Map<string, PushNotificationMode>();

  const result = await client.query<{ id: string; preferences: unknown }>(
    `
      select id, preferences
      from profiles
      where id = any($1::uuid[])
    `,
    [userIds],
  );

  return new Map(
    result.rows.map((row) => [row.id, normalizeUserPreferences(row.preferences).pushNotificationMode as PushNotificationMode]),
  );
}

export async function getPublicUser(userId: string) {
  const result = await pool.query<PublicUserRow>(
    `
      select id, email, display_name as "displayName", preferences
      from profiles
      where id = $1
    `,
    [userId],
  );
  return result.rows[0] ? publicUser(result.rows[0]) : null;
}

export async function getCurrentCouple(userId: string, locale = 'de') {
  const result = await pool.query<CurrentCouple>(
    `
      select
        c.id,
        c.invite_code as "inviteCode",
        c.relationship_type as "relationshipType",
        coalesce(requested_mode.label, fallback_mode.label, mode.label, c.relationship_type) as "relationshipTypeLabel",
        c.content_preference as "contentPreference",
        coalesce(requested_style.label, fallback_style.label, style.label, c.content_preference) as "contentPreferenceLabel",
        c.heart_points as "heartPoints",
        c.garden_stage as "gardenStage",
        c.created_at as "createdAt",
        count(cm.user_id)::int as "memberCount"
      from couples c
      join couple_members own_membership on own_membership.couple_id = c.id
      join couple_members cm on cm.couple_id = c.id
      left join relationship_modes mode on mode.value = c.relationship_type
      left join relationship_mode_translations requested_mode on requested_mode.mode_id = mode.id and requested_mode.locale = $2
      left join relationship_mode_translations fallback_mode on fallback_mode.mode_id = mode.id and fallback_mode.locale = 'de'
      left join content_styles style on style.value = c.content_preference
      left join content_style_translations requested_style on requested_style.style_id = style.id and requested_style.locale = $2
      left join content_style_translations fallback_style on fallback_style.style_id = style.id and fallback_style.locale = 'de'
      where own_membership.user_id = $1
      group by c.id, requested_mode.label, fallback_mode.label, mode.label, requested_style.label, fallback_style.label, style.label
      order by c.created_at desc
      limit 1
    `,
    [userId, locale],
  );

  return result.rows[0] ?? null;
}

export async function getCoupleMemberIds(client: Queryable, coupleId: string) {
  const result = await client.query('select user_id as "userId" from couple_members where couple_id = $1', [coupleId]);
  return result.rows.map((row: { userId: string }) => row.userId);
}

export async function createNotifications(
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
    sourceType: string;
    sourceId?: string | null;
    titleKey: NotificationMessageKey;
    bodyKey: NotificationMessageKey;
    params?: Record<string, unknown>;
  },
) {
  const uniqueUserIds = [...new Set(options.userIds)].filter(Boolean);
  const params = options.params ?? {};
  const title = await translateNotificationBackend(options.titleKey, params);
  const body = await translateNotificationBackend(options.bodyKey, params);
  const pushPayloads: PushNotificationPayload[] = [];
  const pushModes = await pushNotificationModesForUsers(client, uniqueUserIds);

  for (const userId of uniqueUserIds) {
    const result = await client.query<{ id: string; userId: string }>(
      `
        insert into notifications (id, couple_id, user_id, type, title, body, source_type, source_id, title_key, body_key, params)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        on conflict do nothing
        returning id, user_id as "userId"
      `,
      [
        randomUUID(),
        options.coupleId,
        userId,
        options.type,
        title,
        body,
        options.sourceType,
        options.sourceId ?? null,
        options.titleKey,
        options.bodyKey,
        JSON.stringify(params),
      ],
    );

    const inserted = result.rows[0];
    const pushMode = pushModes.get(userId) ?? 'all';
    if (inserted && shouldSendPushForMode(pushMode, options.type)) {
      pushPayloads.push({
        notificationId: inserted.id,
        userId: inserted.userId,
        title,
        body,
        url: `/notifications?notification=${inserted.id}`,
      });
    }
  }

  sendPushNotifications(pushPayloads).catch((error) => {
    console.warn('Push notification dispatch failed', error);
  });
}

export async function getOrCreateTodayInstance(client: Queryable, coupleId: string) {
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
      left join content_categories category on category.content_type = 'daily-questions' and category.value = q.category
      left join unanswered_previous_questions upq on upq.question_id = q.id
      where q.active = true
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
        case when c.relationship_type = any(coalesce(category.relationship_modes, '{}')) then 0 else 1 end,
        case when c.content_preference = any(coalesce(category.content_styles, '{}')) then 0 else 1 end,
        case when coalesce(cardinality(category.relationship_modes), 0) = 0 and coalesce(cardinality(category.content_styles), 0) = 0 then 0 else 1 end,
        coalesce(category.sort_order, 9999),
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

export async function ensureCoupleMembership(userId: string, coupleId: string) {
  const result = await pool.query<{ one: number }>(
    'select 1 from couple_members where user_id = $1 and couple_id = $2',
    [userId, coupleId],
  );
  return (result.rowCount ?? 0) > 0;
}

export function mapGardenObject(row: GardenObjectRow) {
  return {
    id: row.id,
    coupleId: row.coupleId,
    type: row.type,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    label: row.label,
    areaKey: row.areaKey ?? fallbackAreaKey,
    assetKey: row.assetKey ?? assetKeyForGardenObject(String(row.type), String(row.sourceType)),
    historyTitle: row.historyTitle ?? row.label,
    positionX: row.positionX,
    positionY: row.positionY,
    zIndex: row.zIndex ?? 1,
    scale: Number(row.scale ?? 1),
    rotation: row.rotation ?? 0,
    placedByUser: Boolean(row.placedByUser),
    rewardPoints: Number(row.rewardPoints ?? 0),
    level: row.level,
    createdAt: row.createdAt,
  };
}

export function areaForStage(stage: number, areas: GardenArea[]) {
  return areas.filter((area) => area.stageUnlock <= Math.max(1, stage));
}

export function areaKeyForSource(sourceType: string, questCategory = '') {
  if (sourceType === 'love_jar') return 'light_meadow';
  if (sourceType === 'memory') return 'memory_tree';
  if (sourceType === 'know_me') return 'flower_meadow';
  if (sourceType === 'quest') {
    if (questCategory === 'date' || questCategory === 'romance') return 'picnic';
    if (questCategory === 'memory') return 'memory_tree';
    if (questCategory === 'teamwork') return 'bench_grove';
    if (questCategory === 'long_distance') return 'star_meadow';
    return 'flower_meadow';
  }
  if (sourceType === 'milestone') return 'wishing_well';
  return 'heart_bed';
}

export function assetKeyForQuest(category: string) {
  if (category === 'date') return 'picnic_blanket';
  if (category === 'romance') return 'date_pavilion';
  if (category === 'memory') return 'polaroid_frame';
  if (category === 'teamwork') return 'memory_tree';
  if (category === 'long_distance') return 'distance_bridge';
  if (category === 'humor') return 'garden_decor';
  return 'warm_lantern';
}

export function assetKeyForGardenObject(type: string, sourceType: string, category = '') {
  if (sourceType === 'question') return 'conversation_flower';
  if (sourceType === 'love_jar') return 'warm_lantern';
  if (sourceType === 'memory') return 'memory_stone';
  if (sourceType === 'know_me') return 'heart_flower';
  if (sourceType === 'quest') return assetKeyForQuest(category);
  if (type === 'tree') return 'memory_tree';
  if (type === 'bench') return 'couple_bench';
  if (type === 'pond') return 'quiet_pond';
  if (type === 'stone') return 'memory_stone';
  if (type === 'light') return 'warm_lantern';
  return 'garden_decor';
}

export async function highestUnlockedAreaForReward(coupleStage: number, sourceType: string, questCategory = '', client: Queryable = pool) {
  const areas = await listGardenAreas('de', client);
  const targetAreaKey = areaKeyForSource(sourceType, questCategory);
  const unlockedAreas = areaForStage(coupleStage, areas);
  const targetArea = unlockedAreas.find((area) => area.key === targetAreaKey);
  return targetArea?.key ?? unlockedAreas[unlockedAreas.length - 1]?.key ?? fallbackAreaKey;
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export async function nextGardenPlacement(client: Queryable, coupleId: string, areaKey: string) {
  const result = await client.query<{ count: number }>(
    'select count(*)::int as count from garden_objects where couple_id = $1 and area_key = $2',
    [coupleId, areaKey],
  );
  const index = Number(result.rows[0]?.count ?? 0);
  const columns = [18, 34, 50, 66, 82];
  const rows = [70, 58, 78, 48, 66, 54];
  return {
    positionX: columns[index % columns.length],
    positionY: rows[Math.floor(index / columns.length) % rows.length],
    zIndex: 1 + Math.round(rows[Math.floor(index / columns.length) % rows.length] / 10),
  };
}

export function mapQuest(row: QuestRow) {
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

export async function buildTodayPayload(userId: string, locale = 'de') {
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

export interface QuestFilters {
  category?: string;
  effortLevel?: string;
  maxMinutes?: number;
  mode?: string;
}

export function normalizeQuestFilters(query: Request['query']): QuestFilters {
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

export async function buildQuestPayload(userId: string, filters: QuestFilters = {}, locale = 'de') {
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

  const result = await pool.query<QuestRow>(
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
      order by
        ${filters.category || filters.mode ? '' : `
        case when $${params.length + 1} = any(coalesce(category.relationship_modes, '{}')) then 0 else 1 end,
        case when $${params.length + 2} = any(coalesce(category.content_styles, '{}')) then 0 else 1 end,
        case when coalesce(cardinality(category.relationship_modes), 0) = 0 and coalesce(cardinality(category.content_styles), 0) = 0 then 0 else 1 end,
        coalesce(category.sort_order, 9999),
        `}
        coalesce(requested.title, fallback.title, q.title)
    `,
    filters.category || filters.mode ? params : [...params, couple.relationshipType, couple.contentPreference],
  );
  const categoryResult = await pool.query<CategoryOptionRow>(
    `
      select
        c.value,
        coalesce(requested.label, fallback.label, c.label) as label
      from content_categories c
      left join content_category_translations requested on requested.category_id = c.id and requested.locale = $1
      left join content_category_translations fallback on fallback.category_id = c.id and fallback.locale = 'de'
      where c.content_type = 'quests' and c.active = true
      order by
        case when $2 = any(coalesce(c.relationship_modes, '{}')) then 0 else 1 end,
        case when $3 = any(coalesce(c.content_styles, '{}')) then 0 else 1 end,
        case when coalesce(cardinality(c.relationship_modes), 0) = 0 and coalesce(cardinality(c.content_styles), 0) = 0 then 0 else 1 end,
        c.sort_order,
        label
    `,
    [locale, couple.relationshipType, couple.contentPreference],
  );

  return {
    couple,
    locale,
    categories: categoryResult.rows,
    quests: result.rows.map(mapQuest),
    filters,
  };
}

export async function buildContentCategoryPayload(contentType: string, locale = 'de', couple?: Pick<CurrentCouple, 'relationshipType' | 'contentPreference'> | null) {
  const result = await pool.query<CategoryOptionRow>(
    `
      select
        c.value,
        coalesce(requested.label, fallback.label, c.label) as label
      from content_categories c
      left join content_category_translations requested on requested.category_id = c.id and requested.locale = $2
      left join content_category_translations fallback on fallback.category_id = c.id and fallback.locale = 'de'
      where c.content_type = $1 and c.active = true
      order by
        case when $3 = any(coalesce(c.relationship_modes, '{}')) then 0 else 1 end,
        case when $4 = any(coalesce(c.content_styles, '{}')) then 0 else 1 end,
        case when coalesce(cardinality(c.relationship_modes), 0) = 0 and coalesce(cardinality(c.content_styles), 0) = 0 then 0 else 1 end,
        c.sort_order,
        label
    `,
    [contentType, locale, couple?.relationshipType ?? '', couple?.contentPreference ?? ''],
  );
  return result.rows;
}

export async function isActiveContentCategory(contentType: string, value: string) {
  const result = await pool.query<{ one: number }>(
    'select 1 from content_categories where content_type = $1 and value = $2 and active = true limit 1',
    [contentType, value],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function applyQuestReward(client: Queryable, coupleId: string, coupleQuestId: string, quest: QuestRewardSource) {
  const category = quest.category;
  const rewardPoints = quest.rewardPoints;
  const areaKey = await highestUnlockedAreaForReward(await gardenStageAfterReward(client, coupleId, rewardPoints), 'quest', category, client);
  const assetKey = assetKeyForQuest(category);
  const placement = await nextGardenPlacement(client, coupleId, areaKey);

  await client.query(
    `
      insert into garden_objects (
        id, couple_id, type, source_type, source_id, label, area_key, asset_key, position_x, position_y, z_index, reward_points, level
      )
      values ($1, $2, $3, 'quest', $4, $5, $6, $7, $8, $9, $10, $11, 1)
      on conflict do nothing
    `,
    [
      randomUUID(),
      coupleId,
      await gardenAssetObjectType(assetKey, client),
      coupleQuestId,
      quest.title,
      areaKey,
      assetKey,
      placement.positionX,
      placement.positionY,
      placement.zIndex,
      rewardPoints,
    ],
  );
  await addCoupleHeartPoints(client, coupleId, rewardPoints);
  await client.query('update couple_quests set reward_applied_at = now() where id = $1', [coupleQuestId]);
}

export function mapLoveJarNote(row: LoveJarNoteRow, revealText = true) {
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

export function mapMemoryEntry(row: MemoryEntryRow) {
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

export function mapKnowMeRound(row: KnowMeRoundRow) {
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

export function mapKnowMeCatalogQuestion(row: KnowMeCatalogQuestionRow) {
  return {
    id: row.id,
    questionText: row.questionText,
    category: row.category,
  };
}

export function mapNotification(row: NotificationRow) {
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

export async function buildNotificationPayload(userId: string) {
  const result = await pool.query<NotificationRow>(
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

function routeForNotification(notification: NotificationRow) {
  if (notification.sourceType === 'account_deletion') return '/onboarding';
  if (notification.type === 'daily_revealed' || notification.type === 'quest_completed') return '/garden';
  if (notification.sourceType === 'today') return '/today';
  if (notification.sourceType === 'quest') return '/quests';
  if (notification.sourceType === 'love_jar') return '/love-jar';
  if (notification.sourceType === 'know_me') return '/know-me';
  if (notification.sourceType === 'memory') return '/memories';
  return '/garden';
}

function gardenSourceTypeForNotification(notification: NotificationRow) {
  if (notification.sourceType === 'today' && notification.type === 'daily_revealed') return 'question';
  if (notification.sourceType === 'quest') return 'quest';
  if (notification.sourceType === 'love_jar') return 'love_jar';
  if (notification.sourceType === 'know_me') return 'know_me';
  if (notification.sourceType === 'memory') return 'memory';
  return '';
}

async function buildKnowMeNotificationSource(coupleId: string, questionId: string) {
  const result = await pool.query<KnowMeDetailRow>(
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
    [questionId, coupleId],
  );
  return result.rows[0] ? { type: 'know_me' as const, ...result.rows[0] } : null;
}

export async function buildNotificationDetailPayload(userId: string, notificationId: string, locale = 'de') {
  const notificationResult = await pool.query<NotificationRow>(
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
      where id = $1 and user_id = $2
    `,
    [notificationId, userId],
  );
  const notification = notificationResult.rows[0];
  if (!notification) return null;

  let gardenDetail: GardenObjectDetailPayload | null = null;
  const couple = notification.coupleId ? await getCurrentCouple(userId, locale) : null;
  const gardenSourceType = gardenSourceTypeForNotification(notification);
  if (notification.coupleId && notification.sourceId && gardenSourceType) {
    const objectResult = await pool.query<{ id: string }>(
      `
        select id
        from garden_objects
        where couple_id = $1 and source_type = $2 and source_id = $3
        order by created_at desc
        limit 1
      `,
      [notification.coupleId, gardenSourceType, notification.sourceId],
    );
    const objectId = objectResult.rows[0]?.id;
    if (objectId) {
      gardenDetail = await buildGardenObjectDetail(userId, objectId, locale);
    }

    if (!gardenDetail && notification.sourceType === 'know_me' && couple?.id === notification.coupleId) {
      gardenDetail = {
        couple,
        object: null,
        source: await buildKnowMeNotificationSource(notification.coupleId, notification.sourceId),
      };
    }
  }

  return {
    notification: mapNotification(notification),
    targetRoute: routeForNotification(notification),
    gardenDetail,
  };
}

export async function buildMemoryPayload(userId: string, locale = 'de') {
  const couple = await getCurrentCouple(userId);
  if (!couple) {
    return null;
  }

  const result = await pool.query<MemoryEntryRow>(
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
    categories: await buildContentCategoryPayload('memories', locale, couple),
    memories: result.rows.map(mapMemoryEntry),
  };
}

export async function buildKnowMePayload(userId: string, locale = 'de') {
  const couple = await getCurrentCouple(userId);
  if (!couple) {
    return null;
  }

  const result = await pool.query<KnowMeRoundRow>(
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

  const catalogResult = await pool.query<KnowMeCatalogQuestionRow>(
    `
      select
        c.id,
        coalesce(requested.question_text, fallback.question_text, c.question_text) as "questionText",
        coalesce(requested.category_label, fallback.category_label, category_label.label, c.category) as category
      from know_me_catalog_questions c
      left join know_me_catalog_question_translations requested
        on requested.catalog_question_id = c.id and requested.locale = $3
      left join know_me_catalog_question_translations fallback
        on fallback.catalog_question_id = c.id and fallback.locale = 'de'
      left join content_categories category on category.content_type = 'know-me-catalog' and category.value = c.category
      left join content_category_translations requested_category
        on requested_category.category_id = category.id and requested_category.locale = $3
      left join content_category_translations fallback_category
        on fallback_category.category_id = category.id and fallback_category.locale = 'de'
      left join lateral (
        select coalesce(requested_category.label, fallback_category.label, category.label) as label
      ) category_label on true
      where c.active = true
        and not exists (
          select 1
          from know_me_questions q
          where q.couple_id = $1
            and q.author_id = $2
            and q.catalog_question_id = c.id
        )
      order by
        case when $4 = any(coalesce(category.relationship_modes, '{}')) then 0 else 1 end,
        case when $5 = any(coalesce(category.content_styles, '{}')) then 0 else 1 end,
        case when coalesce(cardinality(category.relationship_modes), 0) = 0 and coalesce(cardinality(category.content_styles), 0) = 0 then 0 else 1 end,
        coalesce(category.sort_order, 9999),
        c.sort_order,
        coalesce(requested.question_text, fallback.question_text, c.question_text)
    `,
    [couple.id, userId, locale, couple.relationshipType, couple.contentPreference],
  );

  return {
    couple,
    locale,
    rounds: result.rows.map(mapKnowMeRound),
    catalogQuestions: catalogResult.rows.map(mapKnowMeCatalogQuestion),
  };
}

export async function createMemoryStone(client: Queryable, coupleId: string, memoryId: string, title: string) {
  const areaKey = await highestUnlockedAreaForReward(await gardenStageAfterReward(client, coupleId, 8), 'memory', '', client);
  const assetKey = 'memory_stone';
  const placement = await nextGardenPlacement(client, coupleId, areaKey);

  const result = await client.query(
    `
      insert into garden_objects (
        id, couple_id, type, source_type, source_id, label, area_key, asset_key, position_x, position_y, z_index, reward_points, level
      )
      values ($1, $2, 'stone', 'memory', $3, $4, $5, $6, $7, $8, $9, 8, 1)
      on conflict do nothing
      returning id
    `,
    [randomUUID(), coupleId, memoryId, title, areaKey, assetKey, placement.positionX, placement.positionY, placement.zIndex],
  );

  await addCoupleHeartPoints(client, coupleId, 8);

  return result.rows[0]?.id as string | undefined;
}

export async function createKnowMeFlower(client: Queryable, coupleId: string, questionId: string) {
  const areaKey = await highestUnlockedAreaForReward(await gardenStageAfterReward(client, coupleId, 12), 'know_me', '', client);
  const assetKey = 'heart_flower';
  const placement = await nextGardenPlacement(client, coupleId, areaKey);

  await client.query(
    `
      insert into garden_objects (
        id, couple_id, type, source_type, source_id, label, area_key, asset_key, position_x, position_y, z_index, reward_points, level
      )
      values ($1, $2, 'flower', 'know_me', $3, 'Kennst-du-mich-Blume', $4, $5, $6, $7, $8, 12, 1)
      on conflict do nothing
    `,
    [randomUUID(), coupleId, questionId, areaKey, assetKey, placement.positionX, placement.positionY, placement.zIndex],
  );
  await addCoupleHeartPoints(client, coupleId, 12);
  await client.query('update know_me_questions set reward_applied_at = now() where id = $1', [questionId]);
}

export async function buildGardenObjectDetail(userId: string, objectId: string, locale = 'de') {
  const couple = await getCurrentCouple(userId);
  if (!couple) {
    return null;
  }

  const objectResult = await pool.query<GardenObjectRow>(
    `
      select
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
      from garden_objects
      where id = $1 and couple_id = $2
    `,
    [objectId, couple.id],
  );
  const object = objectResult.rows[0];

  if (!object) {
    return { couple, object: null, source: null };
  }

  let source: GardenObjectDetailSource | null = null;

  if (object.sourceType === 'question') {
    const result = await pool.query<QuestionDetailRow>(
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
    const result = await pool.query<QuestDetailRow>(
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
    const result = await pool.query<LoveJarDetailRow>(
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
    const result = await pool.query<MemoryDetailRow>(
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
    const result = await pool.query<KnowMeDetailRow>(
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

export async function buildGardenProgress(coupleId: string) {
  const result = await pool.query<GardenProgressRow>(
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

export async function buildLoveJarPayload(userId: string, locale = 'de') {
  const couple = await getCurrentCouple(userId);
  if (!couple) {
    return null;
  }

  const result = await pool.query<LoveJarNoteRow>(
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
  const statusResult = await pool.query<LoveJarDrawStatusRow>(
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

export async function buildLoveJarTemplatePayload(userId: string, locale = 'de') {
  const couple = await getCurrentCouple(userId, locale);
  const result = await pool.query<LoveJarTemplateRow>(
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
      order by
        case when $2 = any(coalesce(category.relationship_modes, '{}')) then 0 else 1 end,
        case when $3 = any(coalesce(category.content_styles, '{}')) then 0 else 1 end,
        case when coalesce(cardinality(category.relationship_modes), 0) = 0 and coalesce(cardinality(category.content_styles), 0) = 0 then 0 else 1 end,
        coalesce(category.sort_order, 9999),
        t.sort_order,
        t.text
    `,
    [locale, couple?.relationshipType ?? '', couple?.contentPreference ?? ''],
  );

  return {
    categories: await buildContentCategoryPayload('love-jar-templates', locale, couple),
    templates: result.rows,
  };
}

export async function createLoveJarLight(client: Queryable, coupleId: string, noteId: string) {
  const areaKey = await highestUnlockedAreaForReward(await gardenStageAfterReward(client, coupleId, 5), 'love_jar', '', client);
  const assetKey = 'warm_lantern';
  const placement = await nextGardenPlacement(client, coupleId, areaKey);

  const insertResult = await client.query(
    `
      insert into garden_objects (
        id, couple_id, type, source_type, source_id, label, area_key, asset_key, position_x, position_y, z_index, reward_points, level
      )
      values ($1, $2, 'light', 'love_jar', $3, 'Liebesglas-Licht', $4, $5, $6, $7, $8, 5, 1)
      on conflict do nothing
    `,
    [randomUUID(), coupleId, noteId, areaKey, assetKey, placement.positionX, placement.positionY, placement.zIndex],
  );
  if ((insertResult.rowCount ?? 0) === 0) return;

  await addCoupleHeartPoints(client, coupleId, 5);
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

export function inviteCode(locale = 'de') {
  const words = inviteCodeWords[locale] ?? inviteCodeWords.de;
  const first = words[randomInt(words.length)];
  let second = words[randomInt(words.length)];
  while (second === first) {
    second = words[randomInt(words.length)];
  }
  const number = String(randomInt(1000, 10000));
  return `${first}-${second}-${number}`;
}

export async function createUniqueInviteCode(locale = 'de') {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = inviteCode(locale);
    const result = await pool.query('select 1 from couples where lower(invite_code) = lower($1)', [code]);
    if (result.rowCount === 0) return code;
  }

  throw new Error('Could not create unique invite code');
}


