import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { pool } from '../db.js';
import { withTransaction } from '../db/transaction.js';
import { SqlWhereBuilder } from '../db/queryBuilder.js';
import { normalizeLocale, parseAcceptLanguage } from '../i18n/locales.js';
import { validateBody } from '../validation.js';
import { createNotifications } from '../api/support.repository.js';
import { renderEmailTemplate, sendMail } from '../email/email.service.js';
import { contentBodySchema } from './bodySchemas.js';
import {
  isContentType,
  isEditableContentType,
  type ContentType,
  type EditableContentType,
} from './contentTypes.js';
import { categoryExists } from './categories/categories.repository.js';

export { isContentType, isEditableContentType, type ContentType, type EditableContentType };

export const effortLevels = new Set(['low', 'medium', 'high']);

export function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export { normalizeLocale, parseAcceptLanguage };

export function normalizeBoolean(value: unknown, fallback = true) {
  return typeof value === 'boolean' ? value : fallback;
}

export function normalizeInteger(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

export function pagination(request: Request) {
  const limit = Math.min(Math.max(normalizeInteger(request.query.limit, 25), 1), 100);
  const offset = Math.max(normalizeInteger(request.query.offset, 0), 0);
  return { limit, offset };
}

export function requestedFormat(request: Request) {
  return normalizeText(request.query.format) === 'csv' ? 'csv' : 'json';
}

export function csvEscape(value: unknown) {
  if (value === null || value === undefined) return '';
  const text = Array.isArray(value) ? value.join('; ') : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function sendCsv(response: Response, filename: string, rows: Record<string, unknown>[]) {
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const body = [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))]
    .filter(Boolean)
    .join('\n');

  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  response.send(body);
}

export function translationsFromBody(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, Record<string, unknown>>;
}

function defaultLocale() {
  return normalizeLocale(config.i18nDefaultLocale) || 'de';
}

function contentTranslations(body: Record<string, unknown>) {
  const translations = translationsFromBody(body.translations);
  const locale = defaultLocale();
  translations[locale] ??= {};
  for (const field of ['text', 'title', 'description', 'questionText'] as const) {
    const value = normalizeText(body[field]);
    if (value && !normalizeText(translations[locale]?.[field])) {
      translations[locale][field] = value;
    }
  }
  return translations;
}

function requiredTranslation(
  translations: Record<string, Record<string, unknown>>,
  fields: string[],
  error = 'default_locale_translation_required',
) {
  const locale = defaultLocale();
  const translation = translations[locale];
  if (!translation) throw new Error(error);
  for (const field of fields) {
    if (!normalizeText(translation[field])) throw new Error(error);
  }
  return { locale, translation };
}

export async function supportedLocales() {
  const result = await pool.query(
    `
      select locale, label, active, is_default as "isDefault"
      from supported_locales
      order by is_default desc, locale
    `,
  );
  return result.rows;
}

export async function buildOverview() {
  const result = await pool.query(
    `
      select
        (select count(*)::int from profiles) as "userCount",
        (select count(*)::int from couples) as "coupleCount",
        (select coalesce(sum(heart_points), 0)::int from couples) as "totalHeartPoints",
        (select count(*)::int from daily_questions where active = true) as "activeDailyQuestionCount",
        (select count(*)::int from quests) as "questCount",
        (select count(*)::int from know_me_catalog_questions where active = true) as "activeKnowMeQuestionCount",
        (select count(*)::int from love_jar_templates where active = true) as "activeLoveJarTemplateCount"
    `,
  );

  return {
    ...result.rows[0],
    usesDefaultAdminPassword: config.adminPassword === 'admin',
  };
}

export async function listUsers(request: Request) {
  const { limit, offset } = pagination(request);
  const search = normalizeText(request.query.search);
  const filters = new SqlWhereBuilder();

  if (search) {
    filters.add('(lower(p.email) like $param1 or lower(p.display_name) like $param1)', `%${search.toLowerCase()}%`);
  }

  const params = [...filters.params, limit, offset];
  const result = await pool.query(
    `
      select
        p.id,
        p.email,
        p.display_name as "displayName",
        p.created_at as "createdAt",
        coalesce(
          json_agg(
            json_build_object(
              'coupleId', c.id,
              'inviteCode', c.invite_code,
              'role', cm.role,
              'joinedAt', cm.joined_at,
              'heartPoints', c.heart_points,
              'gardenStage', c.garden_stage
            )
            order by cm.joined_at desc
          ) filter (where c.id is not null),
          '[]'::json
        ) as couples
      from profiles p
      left join couple_members cm on cm.user_id = p.id
      left join couples c on c.id = cm.couple_id
      ${filters.clause()}
      group by p.id
      order by p.created_at desc
      limit $${params.length - 1} offset $${params.length}
    `,
    params,
  );

  const countResult = await pool.query(
    `
      select count(*)::int as total
      from profiles p
      ${filters.clause()}
    `,
    filters.params,
  );

  return { items: result.rows, total: countResult.rows[0]?.total ?? 0, limit, offset };
}

export async function resetUserPasswordByAdmin(userId: string, password: string, locale = config.i18nDefaultLocale) {
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await withTransaction(async (client) => {
    const result = await client.query<{ id: string; email: string; displayName: string }>(
      `
        update profiles
        set password_hash = $2,
            updated_at = now()
        where id = $1
        returning id, email, display_name as "displayName"
      `,
      [userId, passwordHash],
    );

    const user = result.rows[0];
    if (!user) return null;

    await client.query('update password_reset_tokens set used_at = now() where user_id = $1 and used_at is null', [userId]);
    await createNotifications(client, {
      coupleId: null,
      userIds: [userId],
      type: 'admin_password_reset',
      titleKey: 'notifications.titles.adminPasswordReset',
      bodyKey: 'notifications.bodies.adminPasswordReset',
      sourceType: 'account',
      sourceId: userId,
    });

    return user;
  });

  if (user) {
    try {
      await sendMail({
        to: user.email,
        subject: await renderEmailTemplate('emails.adminPasswordReset.subject', {}, locale),
        text: await renderEmailTemplate('emails.adminPasswordReset.body', { displayName: user.displayName }, locale),
      });
    } catch (error) {
      console.error('[admin] password reset email delivery failed', error);
    }
  }

  return user;
}

export async function listCouples(request: Request) {
  const { limit, offset } = pagination(request);
  const search = normalizeText(request.query.search);
  const filters = new SqlWhereBuilder();

  if (search) {
    filters.add(`(
      lower(c.invite_code) like $param1
      or exists (
        select 1
        from couple_members scm
        join profiles sp on sp.id = scm.user_id
        where scm.couple_id = c.id
          and (lower(sp.email) like $param1 or lower(sp.display_name) like $param1)
      )
    )`, `%${search.toLowerCase()}%`);
  }

  const params = [...filters.params, limit, offset];
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
        coalesce(
          jsonb_agg(
            distinct jsonb_build_object(
              'id', p.id,
              'email', p.email,
              'displayName', p.display_name,
              'role', cm.role,
              'joinedAt', cm.joined_at
            )
          ) filter (where p.id is not null),
          '[]'::jsonb
        ) as members,
        count(distinct dqa.id)::int as "dailyAnswerCount",
        count(distinct cq.id) filter (where cq.status = 'completed')::int as "completedQuestCount",
        count(distinct ljn.id)::int as "loveJarNoteCount",
        count(distinct me.id)::int as "memoryCount",
        count(distinct km.id) filter (where km.status = 'answered')::int as "knowMeRoundCount"
      from couples c
      left join couple_members cm on cm.couple_id = c.id
      left join profiles p on p.id = cm.user_id
      left join daily_question_answers dqa on dqa.couple_id = c.id
      left join couple_quests cq on cq.couple_id = c.id
      left join love_jar_notes ljn on ljn.couple_id = c.id
      left join memory_entries me on me.couple_id = c.id
      left join know_me_questions km on km.couple_id = c.id
      ${filters.clause()}
      group by c.id
      order by c.created_at desc
      limit $${params.length - 1} offset $${params.length}
    `,
    params,
  );

  const countResult = await pool.query(
    `
      select count(*)::int as total
      from couples c
      ${filters.clause()}
    `,
    filters.params,
  );

  return { items: result.rows, total: countResult.rows[0]?.total ?? 0, limit, offset };
}

export async function getCoupleDetail(id: string) {
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
        coalesce(
          json_agg(
            distinct jsonb_build_object(
              'id', p.id,
              'email', p.email,
              'displayName', p.display_name,
              'role', cm.role,
              'joinedAt', cm.joined_at
            )
          ) filter (where p.id is not null),
          '[]'::json
        ) as members,
        count(distinct dqi.id) filter (where dqi.reward_applied_at is not null)::int as "answeredQuestionCount",
        count(distinct dqa.id)::int as "dailyAnswerCount",
        count(distinct cq.id) filter (where cq.status = 'completed')::int as "completedQuestCount",
        count(distinct ljn.id)::int as "loveJarNoteCount",
        count(distinct ljn.id) filter (where ljn.is_drawn = true)::int as "drawnLoveJarNoteCount",
        count(distinct me.id)::int as "memoryCount",
        count(distinct km.id) filter (where km.status = 'answered')::int as "knowMeRoundCount",
        count(distinct km.id) filter (where km.reward_applied_at is not null)::int as "knowMeHitCount",
        count(distinct go.id)::int as "gardenObjectCount",
        coalesce(max(go.created_at), c.created_at) as "lastGardenMomentAt"
      from couples c
      left join couple_members cm on cm.couple_id = c.id
      left join profiles p on p.id = cm.user_id
      left join daily_question_instances dqi on dqi.couple_id = c.id
      left join daily_question_answers dqa on dqa.couple_id = c.id
      left join couple_quests cq on cq.couple_id = c.id
      left join love_jar_notes ljn on ljn.couple_id = c.id
      left join memory_entries me on me.couple_id = c.id
      left join know_me_questions km on km.couple_id = c.id
      left join garden_objects go on go.couple_id = c.id
      where c.id = $1
      group by c.id
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function updateCouplePreferences(id: string, relationshipType: string, contentPreference: string) {
  await pool.query(
    `
      update couples
      set relationship_type = $2,
          content_preference = $3
      where id = $1
    `,
    [id, relationshipType, contentPreference],
  );
  return getCoupleDetail(id);
}

export async function listDailyQuestions(request: Request) {
  const active = normalizeText(request.query.active);
  const search = normalizeText(request.query.search);
  const category = normalizeText(request.query.category);
  const params: unknown[] = [];
  const where: string[] = [];
  if (active === 'true') where.push('q.active = true');
  if (active === 'false') where.push('q.active = false');
  if (category) {
    params.push(category);
    where.push(`q.category = $${params.length}`);
  }
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(`lower(default_translation.text) like $${params.length}`);
  }
  params.push(defaultLocale());
  const defaultLocaleParam = params.length;
  const result = await pool.query(
    `
      select
        q.id,
        default_translation.text,
        q.category,
        q.depth_level as "depthLevel",
        q.long_distance_suitable as "longDistanceSuitable",
        q.active,
        coalesce(json_object_agg(t.locale, json_build_object('text', t.text)) filter (where t.locale is not null), '{}'::json) as translations
      from daily_questions q
      left join daily_question_translations t on t.question_id = q.id
      left join daily_question_translations default_translation
        on default_translation.question_id = q.id and default_translation.locale = $${defaultLocaleParam}
      ${where.length ? `where ${where.join(' and ')}` : ''}
      group by q.id, default_translation.text
      order by q.active desc, q.category, default_translation.text
    `,
    params,
  );
  return result.rows;
}

export async function saveDailyQuestion(body: Record<string, unknown>, id: string = randomUUID()) {
  const translations = contentTranslations(body);
  const { locale, translation } = requiredTranslation(translations, ['text']);
  const text = normalizeText(translation.text);
  const category = normalizeText(body.category);
  const depthLevel = normalizeInteger(body.depthLevel, 1);
  if (!text || !category || depthLevel < 1 || depthLevel > 4 || !(await categoryExists('daily-questions', category))) {
    throw new Error('invalid daily question');
  }

  await pool.query(
    `
      insert into daily_questions (id, category, depth_level, long_distance_suitable, active)
      values ($1, $2, $3, $4, $5)
      on conflict (id) do update set
        category = excluded.category,
        depth_level = excluded.depth_level,
        long_distance_suitable = excluded.long_distance_suitable,
        active = excluded.active
    `,
    [id, category, depthLevel, normalizeBoolean(body.longDistanceSuitable), normalizeBoolean(body.active)],
  );

  for (const [locale, translation] of Object.entries(translations)) {
    const translatedText = normalizeText(translation.text);
    if (!translatedText) continue;
    await pool.query(
      `
        insert into daily_question_translations (question_id, locale, text)
        values ($1, $2, $3)
        on conflict (question_id, locale) do update set text = excluded.text
      `,
      [id, locale, translatedText],
    );
  }

  if (!translations[locale]) throw new Error('default_locale_translation_required');
  return id;
}

export async function listQuests(request: Request) {
  const active = normalizeText(request.query.active);
  const search = normalizeText(request.query.search);
  const category = normalizeText(request.query.category);
  const params: unknown[] = [];
  const where: string[] = [];
  if (active === 'true') where.push('q.active = true');
  if (active === 'false') where.push('q.active = false');
  if (category) {
    params.push(category);
    where.push(`q.category = $${params.length}`);
  }
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(`(lower(default_translation.title) like $${params.length} or lower(default_translation.description) like $${params.length})`);
  }
  params.push(defaultLocale());
  const defaultLocaleParam = params.length;
  const result = await pool.query(
    `
      select
        q.id,
        default_translation.title,
        default_translation.description,
        q.category,
        q.estimated_minutes as "estimatedMinutes",
        q.effort_level as "effortLevel",
        q.reward_points as "rewardPoints",
        q.reward_seed_type as "rewardSeedType",
        q.requires_both_partners as "requiresBothPartners",
        coalesce(q.active, true) as active,
        coalesce(json_object_agg(t.locale, json_build_object('title', t.title, 'description', t.description)) filter (where t.locale is not null), '{}'::json) as translations
      from quests q
      left join quest_translations t on t.quest_id = q.id
      left join quest_translations default_translation
        on default_translation.quest_id = q.id and default_translation.locale = $${defaultLocaleParam}
      ${where.length ? `where ${where.join(' and ')}` : ''}
      group by q.id, default_translation.title, default_translation.description
      order by coalesce(q.active, true) desc, q.category, default_translation.title
    `,
    params,
  );
  return result.rows;
}

export async function saveQuest(body: Record<string, unknown>, id: string = randomUUID()) {
  const translations = contentTranslations(body);
  const { translation } = requiredTranslation(translations, ['title', 'description']);
  const title = normalizeText(translation.title);
  const description = normalizeText(translation.description);
  const category = normalizeText(body.category);
  const effortLevel = normalizeText(body.effortLevel);
  const estimatedMinutes = normalizeInteger(body.estimatedMinutes, 0);
  const rewardPoints = normalizeInteger(body.rewardPoints, 0);
  if (
    !title ||
    !description ||
    estimatedMinutes <= 0 ||
    rewardPoints <= 0 ||
    !(await categoryExists('quests', category)) ||
    !effortLevels.has(effortLevel)
  ) {
    throw new Error('invalid quest');
  }

  await pool.query(
    `
      insert into quests (
        id, category, estimated_minutes, effort_level, reward_points, reward_seed_type,
        requires_both_partners, active
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict (id) do update set
        category = excluded.category,
        estimated_minutes = excluded.estimated_minutes,
        effort_level = excluded.effort_level,
        reward_points = excluded.reward_points,
        reward_seed_type = excluded.reward_seed_type,
        requires_both_partners = excluded.requires_both_partners,
        active = excluded.active
    `,
    [
      id,
      category,
      estimatedMinutes,
      effortLevel,
      rewardPoints,
      normalizeText(body.rewardSeedType) || null,
      normalizeBoolean(body.requiresBothPartners),
      normalizeBoolean(body.active),
    ],
  );

  for (const [locale, translation] of Object.entries(translations)) {
    const translatedTitle = normalizeText(translation.title);
    const translatedDescription = normalizeText(translation.description);
    if (!translatedTitle || !translatedDescription) continue;
    await pool.query(
      `
        insert into quest_translations (quest_id, locale, title, description)
        values ($1, $2, $3, $4)
        on conflict (quest_id, locale) do update set title = excluded.title, description = excluded.description
      `,
      [id, locale, translatedTitle, translatedDescription],
    );
  }

  return id;
}

export async function listKnowMeCatalog(request: Request) {
  const active = normalizeText(request.query.active);
  const search = normalizeText(request.query.search);
  const category = normalizeText(request.query.category);
  const params: unknown[] = [];
  const where: string[] = [];
  if (active === 'true') where.push('q.active = true');
  if (active === 'false') where.push('q.active = false');
  if (category) {
    params.push(category);
    where.push(`q.category = $${params.length}`);
  }
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(`lower(default_translation.question_text) like $${params.length}`);
  }
  params.push(defaultLocale());
  const defaultLocaleParam = params.length;
  const result = await pool.query(
    `
      select
        q.id,
        default_translation.question_text as "questionText",
        q.category,
        q.active,
        q.sort_order as "sortOrder",
        q.created_at as "createdAt",
        coalesce(json_object_agg(t.locale, json_build_object('questionText', t.question_text, 'categoryLabel', t.category_label)) filter (where t.locale is not null), '{}'::json) as translations
      from know_me_catalog_questions q
      left join know_me_catalog_question_translations t on t.catalog_question_id = q.id
      left join know_me_catalog_question_translations default_translation
        on default_translation.catalog_question_id = q.id and default_translation.locale = $${defaultLocaleParam}
      ${where.length ? `where ${where.join(' and ')}` : ''}
      group by q.id, default_translation.question_text
      order by q.active desc, q.sort_order, default_translation.question_text
    `,
    params,
  );
  return result.rows;
}

export async function saveKnowMeCatalog(body: Record<string, unknown>, id: string = randomUUID()) {
  const translations = contentTranslations(body);
  const { translation } = requiredTranslation(translations, ['questionText']);
  const questionText = normalizeText(translation.questionText);
  const category = normalizeText(body.category);
  if (!questionText || !category || !(await categoryExists('know-me-catalog', category))) {
    throw new Error('invalid know me question');
  }

  await pool.query(
    `
      insert into know_me_catalog_questions (id, category, active, sort_order)
      values ($1, $2, $3, $4)
      on conflict (id) do update set
        category = excluded.category,
        active = excluded.active,
        sort_order = excluded.sort_order
    `,
    [id, category, normalizeBoolean(body.active), normalizeInteger(body.sortOrder, 0)],
  );

  for (const [locale, translation] of Object.entries(translations)) {
    const translatedQuestion = normalizeText(translation.questionText);
    const categoryLabel = normalizeText(translation.categoryLabel) || category;
    if (!translatedQuestion) continue;
    await pool.query(
      `
        insert into know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label)
        values ($1, $2, $3, $4)
        on conflict (catalog_question_id, locale) do update set
          question_text = excluded.question_text,
          category_label = excluded.category_label
      `,
      [id, locale, translatedQuestion, categoryLabel],
    );
  }

  return id;
}

export async function listLoveJarTemplates(request: Request) {
  const active = normalizeText(request.query.active);
  const search = normalizeText(request.query.search);
  const category = normalizeText(request.query.category);
  const params: unknown[] = [];
  const where: string[] = [];
  if (active === 'true') where.push('t.active = true');
  if (active === 'false') where.push('t.active = false');
  if (category) {
    params.push(category);
    where.push(`t.category = $${params.length}`);
  }
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(`lower(default_translation.text) like $${params.length}`);
  }
  params.push(defaultLocale());
  const defaultLocaleParam = params.length;
  const result = await pool.query(
    `
      select
        t.id,
        default_translation.text,
        t.category,
        t.active,
        t.sort_order as "sortOrder",
        t.created_at as "createdAt",
        t.updated_at as "updatedAt",
        coalesce(json_object_agg(tr.locale, json_build_object('text', tr.text)) filter (where tr.locale is not null), '{}'::json) as translations
      from love_jar_templates t
      left join love_jar_template_translations tr on tr.template_id = t.id
      left join love_jar_template_translations default_translation
        on default_translation.template_id = t.id and default_translation.locale = $${defaultLocaleParam}
      ${where.length ? `where ${where.join(' and ')}` : ''}
      group by t.id, default_translation.text
      order by t.active desc, t.sort_order, default_translation.text
    `,
    params,
  );
  return result.rows;
}

export async function saveLoveJarTemplate(body: Record<string, unknown>, id: string = randomUUID()) {
  const translations = contentTranslations(body);
  const { translation } = requiredTranslation(translations, ['text']);
  const text = normalizeText(translation.text);
  const category = normalizeText(body.category);
  if (!text || !category || !(await categoryExists('love-jar-templates', category))) throw new Error('invalid love jar template');

  await pool.query(
    `
      insert into love_jar_templates (id, category, active, sort_order, updated_at)
      values ($1, $2, $3, $4, now())
      on conflict (id) do update set
        category = excluded.category,
        active = excluded.active,
        sort_order = excluded.sort_order,
        updated_at = now()
    `,
    [id, category, normalizeBoolean(body.active), normalizeInteger(body.sortOrder, 0)],
  );

  for (const [locale, translation] of Object.entries(translations)) {
    const translatedText = normalizeText(translation.text);
    if (!translatedText) continue;
    await pool.query(
      `
        insert into love_jar_template_translations (template_id, locale, text)
        values ($1, $2, $3)
        on conflict (template_id, locale) do update set text = excluded.text
      `,
      [id, locale, translatedText],
    );
  }

  return id;
}

export async function listContent(type: EditableContentType, request: Request) {
  if (type === 'daily-questions') return listDailyQuestions(request);
  if (type === 'quests') return listQuests(request);
  if (type === 'know-me-catalog') return listKnowMeCatalog(request);
  return listLoveJarTemplates(request);
}

export async function saveContent(type: EditableContentType, body: Record<string, unknown>, id?: string) {
  if (type === 'daily-questions') return saveDailyQuestion(body, id);
  if (type === 'quests') return saveQuest(body, id);
  if (type === 'know-me-catalog') return saveKnowMeCatalog(body, id);
  return saveLoveJarTemplate(body, id);
}

export const validateEditableContentBody = (request: Request, response: Response, next: () => void) => {
  const type = String(request.params.type);
  if (!isEditableContentType(type)) {
    next();
    return;
  }
  validateBody(contentBodySchema(type))(request, response, next);
};


