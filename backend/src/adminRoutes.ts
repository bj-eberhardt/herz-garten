import { randomUUID } from 'node:crypto';
import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { requireAdminAuth, signAdminToken } from './adminAuth.js';
import { config } from './config.js';
import { pool } from './db.js';
import { handleError, sendApiError } from './errors.js';

type ContentType = 'daily-questions' | 'quests' | 'know-me-catalog' | 'love-jar-templates';

const effortLevels = new Set(['low', 'medium', 'high']);

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
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

function normalizeBoolean(value: unknown, fallback = true) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeInteger(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

function pagination(request: Request) {
  const limit = Math.min(Math.max(normalizeInteger(request.query.limit, 25), 1), 100);
  const offset = Math.max(normalizeInteger(request.query.offset, 0), 0);
  return { limit, offset };
}

function requestedFormat(request: Request) {
  return normalizeText(request.query.format) === 'csv' ? 'csv' : 'json';
}

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return '';
  const text = Array.isArray(value) ? value.join('; ') : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function sendCsv(response: Response, filename: string, rows: Record<string, unknown>[]) {
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const body = [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))]
    .filter(Boolean)
    .join('\n');

  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  response.send(body);
}

async function audit(action: string, resourceType: string, resourceId: string | null, metadata: Record<string, unknown> = {}) {
  await pool.query(
    `
      insert into admin_audit_log (id, action, resource_type, resource_id, metadata)
      values ($1, $2, $3, $4, $5)
    `,
    [randomUUID(), action, resourceType, resourceId, JSON.stringify(metadata)],
  );
}

function translationsFromBody(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, Record<string, unknown>>;
}

async function supportedLocales() {
  const result = await pool.query(
    `
      select locale, label, active, is_default as "isDefault"
      from supported_locales
      order by is_default desc, locale
    `,
  );
  return result.rows;
}

async function categoryExists(contentType: ContentType, value: string) {
  const result = await pool.query(
    'select 1 from content_categories where content_type = $1 and value = $2 limit 1',
    [contentType, value],
  );
  return (result.rowCount ?? 0) > 0;
}

async function categoryUsage(contentType: ContentType, value: string) {
  const table =
    contentType === 'daily-questions'
      ? 'daily_questions'
      : contentType === 'quests'
        ? 'quests'
        : contentType === 'know-me-catalog'
          ? 'know_me_catalog_questions'
          : 'love_jar_templates';
  const result = await pool.query(`select count(*)::int as count from ${table} where category = $1`, [value]);
  return result.rows[0]?.count ?? 0;
}

async function listCategories(type?: ContentType, locale = 'de') {
  const params: unknown[] = [];
  const where = type ? 'where c.content_type = $1' : '';
  if (type) params.push(type);
  params.push(locale);
  const result = await pool.query(
    `
      select
        c.id,
        c.content_type as "contentType",
        c.value,
        coalesce(requested.label, fallback.label, c.label) as label,
        c.label as "defaultLabel",
        c.active,
        c.sort_order as "sortOrder",
        c.created_at as "createdAt",
        c.updated_at as "updatedAt",
        coalesce(json_object_agg(t.locale, json_build_object('label', t.label)) filter (where t.locale is not null), '{}'::json) as translations
      from content_categories c
      left join content_category_translations t on t.category_id = c.id
      left join content_category_translations requested on requested.category_id = c.id and requested.locale = $${params.length}
      left join content_category_translations fallback on fallback.category_id = c.id and fallback.locale = 'de'
      ${where}
      group by c.id, requested.label, fallback.label
      order by c.content_type, c.active desc, c.sort_order, c.label
    `,
    params,
  );

  const items = [];
  for (const row of result.rows) {
    items.push({
      ...row,
      usageCount: await categoryUsage(row.contentType, row.value),
    });
  }
  return items;
}

async function saveCategory(body: Record<string, unknown>, id: string = randomUUID()) {
  const contentType = normalizeText(body.contentType);
  const value = normalizeText(body.value).toLowerCase().replaceAll(' ', '_');
  const label = normalizeText(body.label);
  if (!isContentType(contentType) || !/^[a-z0-9_-]+$/.test(value) || !label) {
    throw new Error('invalid category');
  }

  await pool.query(
    `
      insert into content_categories (id, content_type, value, label, active, sort_order, updated_at)
      values ($1, $2, $3, $4, $5, $6, now())
      on conflict (id) do update set
        label = excluded.label,
        active = excluded.active,
        sort_order = excluded.sort_order,
        updated_at = now()
    `,
    [id, contentType, value, label, normalizeBoolean(body.active), normalizeInteger(body.sortOrder, 0)],
  );

  const translations = translationsFromBody(body.translations);
  for (const [locale, translation] of Object.entries(translations)) {
    const translatedLabel = normalizeText(translation.label);
    if (!translatedLabel) continue;
    await pool.query(
      `
        insert into content_category_translations (category_id, locale, label)
        values ($1, $2, $3)
        on conflict (category_id, locale) do update set label = excluded.label
      `,
      [id, locale, translatedLabel],
    );
  }

  return id;
}

async function deleteCategory(id: string) {
  const categoryResult = await pool.query('select content_type as "contentType", value from content_categories where id = $1', [
    id,
  ]);
  const category = categoryResult.rows[0];
  if (!category) return { deleted: false, reason: 'not_found' };
  const usageCount = await categoryUsage(category.contentType, category.value);
  if (usageCount > 0) return { deleted: false, reason: 'in_use', usageCount };
  await pool.query('delete from content_categories where id = $1', [id]);
  return { deleted: true, reason: null };
}

async function buildOverview() {
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

async function listUsers(request: Request) {
  const { limit, offset } = pagination(request);
  const search = normalizeText(request.query.search);
  const params: unknown[] = [];
  const where: string[] = [];

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(`(lower(p.email) like $${params.length} or lower(p.display_name) like $${params.length})`);
  }

  params.push(limit, offset);
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
      ${where.length ? `where ${where.join(' and ')}` : ''}
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
      ${where.length ? `where ${where.join(' and ')}` : ''}
    `,
    params.slice(0, params.length - 2),
  );

  return { items: result.rows, total: countResult.rows[0]?.total ?? 0, limit, offset };
}

async function listCouples(request: Request) {
  const { limit, offset } = pagination(request);
  const search = normalizeText(request.query.search);
  const params: unknown[] = [];
  const where: string[] = [];

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(`(
      lower(c.invite_code) like $${params.length}
      or exists (
        select 1
        from couple_members scm
        join profiles sp on sp.id = scm.user_id
        where scm.couple_id = c.id
          and (lower(sp.email) like $${params.length} or lower(sp.display_name) like $${params.length})
      )
    )`);
  }

  params.push(limit, offset);
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
            json_build_object(
              'id', p.id,
              'email', p.email,
              'displayName', p.display_name,
              'role', cm.role,
              'joinedAt', cm.joined_at
            )
            order by cm.joined_at
          ) filter (where p.id is not null),
          '[]'::json
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
      ${where.length ? `where ${where.join(' and ')}` : ''}
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
      ${where.length ? `where ${where.join(' and ')}` : ''}
    `,
    params.slice(0, params.length - 2),
  );

  return { items: result.rows, total: countResult.rows[0]?.total ?? 0, limit, offset };
}

async function getCoupleDetail(id: string) {
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

async function listDailyQuestions(request: Request) {
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
    where.push(`lower(q.text) like $${params.length}`);
  }
  const result = await pool.query(
    `
      select
        q.id,
        q.text,
        q.category,
        q.depth_level as "depthLevel",
        q.long_distance_suitable as "longDistanceSuitable",
        q.active,
        coalesce(json_object_agg(t.locale, json_build_object('text', t.text)) filter (where t.locale is not null), '{}'::json) as translations
      from daily_questions q
      left join daily_question_translations t on t.question_id = q.id
      ${where.length ? `where ${where.join(' and ')}` : ''}
      group by q.id
      order by q.active desc, q.category, q.text
    `,
    params,
  );
  return result.rows;
}

async function saveDailyQuestion(body: Record<string, unknown>, id: string = randomUUID()) {
  const text = normalizeText(body.text);
  const category = normalizeText(body.category);
  const depthLevel = normalizeInteger(body.depthLevel, 1);
  if (!text || !category || depthLevel < 1 || depthLevel > 4 || !(await categoryExists('daily-questions', category))) {
    throw new Error('invalid daily question');
  }

  await pool.query(
    `
      insert into daily_questions (id, text, category, depth_level, long_distance_suitable, active)
      values ($1, $2, $3, $4, $5, $6)
      on conflict (id) do update set
        text = excluded.text,
        category = excluded.category,
        depth_level = excluded.depth_level,
        long_distance_suitable = excluded.long_distance_suitable,
        active = excluded.active
    `,
    [id, text, category, depthLevel, normalizeBoolean(body.longDistanceSuitable), normalizeBoolean(body.active)],
  );

  const translations = translationsFromBody(body.translations);
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

  return id;
}

async function listQuests(request: Request) {
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
    where.push(`(lower(q.title) like $${params.length} or lower(q.description) like $${params.length})`);
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
        coalesce(q.active, true) as active,
        coalesce(json_object_agg(t.locale, json_build_object('title', t.title, 'description', t.description)) filter (where t.locale is not null), '{}'::json) as translations
      from quests q
      left join quest_translations t on t.quest_id = q.id
      ${where.length ? `where ${where.join(' and ')}` : ''}
      group by q.id
      order by coalesce(q.active, true) desc, q.category, q.title
    `,
    params,
  );
  return result.rows;
}

async function saveQuest(body: Record<string, unknown>, id: string = randomUUID()) {
  const title = normalizeText(body.title);
  const description = normalizeText(body.description);
  const category = normalizeText(body.category);
  const effortLevel = normalizeText(body.effortLevel);
  if (!title || !description || !(await categoryExists('quests', category)) || !effortLevels.has(effortLevel)) {
    throw new Error('invalid quest');
  }

  await pool.query(
    `
      insert into quests (
        id, title, description, category, estimated_minutes, effort_level, reward_points, reward_seed_type,
        requires_both_partners, active
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      on conflict (id) do update set
        title = excluded.title,
        description = excluded.description,
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
      title,
      description,
      category,
      Math.max(normalizeInteger(body.estimatedMinutes, 10), 1),
      effortLevel,
      Math.max(normalizeInteger(body.rewardPoints, 0), 0),
      normalizeText(body.rewardSeedType) || null,
      normalizeBoolean(body.requiresBothPartners),
      normalizeBoolean(body.active),
    ],
  );

  const translations = translationsFromBody(body.translations);
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

async function listKnowMeCatalog(request: Request) {
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
    where.push(`lower(q.question_text) like $${params.length}`);
  }
  const result = await pool.query(
    `
      select
        q.id,
        q.question_text as "questionText",
        q.category,
        q.active,
        q.sort_order as "sortOrder",
        q.created_at as "createdAt",
        coalesce(json_object_agg(t.locale, json_build_object('questionText', t.question_text, 'categoryLabel', t.category_label)) filter (where t.locale is not null), '{}'::json) as translations
      from know_me_catalog_questions q
      left join know_me_catalog_question_translations t on t.catalog_question_id = q.id
      ${where.length ? `where ${where.join(' and ')}` : ''}
      group by q.id
      order by q.active desc, q.sort_order, q.question_text
    `,
    params,
  );
  return result.rows;
}

async function saveKnowMeCatalog(body: Record<string, unknown>, id: string = randomUUID()) {
  const questionText = normalizeText(body.questionText);
  const category = normalizeText(body.category);
  if (!questionText || !category || !(await categoryExists('know-me-catalog', category))) {
    throw new Error('invalid know me question');
  }

  await pool.query(
    `
      insert into know_me_catalog_questions (id, question_text, category, active, sort_order)
      values ($1, $2, $3, $4, $5)
      on conflict (id) do update set
        question_text = excluded.question_text,
        category = excluded.category,
        active = excluded.active,
        sort_order = excluded.sort_order
    `,
    [id, questionText, category, normalizeBoolean(body.active), normalizeInteger(body.sortOrder, 0)],
  );

  const translations = translationsFromBody(body.translations);
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

async function listLoveJarTemplates(request: Request) {
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
    where.push(`lower(t.text) like $${params.length}`);
  }
  const result = await pool.query(
    `
      select
        t.id,
        t.text,
        t.category,
        t.active,
        t.sort_order as "sortOrder",
        t.created_at as "createdAt",
        t.updated_at as "updatedAt",
        coalesce(json_object_agg(tr.locale, json_build_object('text', tr.text)) filter (where tr.locale is not null), '{}'::json) as translations
      from love_jar_templates t
      left join love_jar_template_translations tr on tr.template_id = t.id
      ${where.length ? `where ${where.join(' and ')}` : ''}
      group by t.id
      order by t.active desc, t.sort_order, t.text
    `,
    params,
  );
  return result.rows;
}

async function saveLoveJarTemplate(body: Record<string, unknown>, id: string = randomUUID()) {
  const text = normalizeText(body.text);
  const category = normalizeText(body.category) || 'compliment';
  if (!text || !(await categoryExists('love-jar-templates', category))) throw new Error('invalid love jar template');

  await pool.query(
    `
      insert into love_jar_templates (id, text, category, active, sort_order, updated_at)
      values ($1, $2, $3, $4, $5, now())
      on conflict (id) do update set
        text = excluded.text,
        category = excluded.category,
        active = excluded.active,
        sort_order = excluded.sort_order,
        updated_at = now()
    `,
    [id, text, category, normalizeBoolean(body.active), normalizeInteger(body.sortOrder, 0)],
  );

  const translations = translationsFromBody(body.translations);
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

async function listContent(type: ContentType, request: Request) {
  if (type === 'daily-questions') return listDailyQuestions(request);
  if (type === 'quests') return listQuests(request);
  if (type === 'know-me-catalog') return listKnowMeCatalog(request);
  return listLoveJarTemplates(request);
}

async function saveContent(type: ContentType, body: Record<string, unknown>, id?: string) {
  if (type === 'daily-questions') return saveDailyQuestion(body, id);
  if (type === 'quests') return saveQuest(body, id);
  if (type === 'know-me-catalog') return saveKnowMeCatalog(body, id);
  return saveLoveJarTemplate(body, id);
}

function isContentType(value: string): value is ContentType {
  return ['daily-questions', 'quests', 'know-me-catalog', 'love-jar-templates'].includes(value);
}

export function adminRouter(): Router {
  const router = createRouter();

  router.post('/auth/login', (request, response) => {
    const password = normalizeText(request.body.password);
    if (!password || password !== config.adminPassword) {
      sendApiError(response, 401, 'auth.invalidCredentials');
      return;
    }

    response.json({
      token: signAdminToken(),
      usesDefaultAdminPassword: config.adminPassword === 'admin',
    });
  });

  router.get('/auth/me', requireAdminAuth, (_request, response) => {
    response.json({ admin: true, usesDefaultAdminPassword: config.adminPassword === 'admin' });
  });

  router.get('/overview', requireAdminAuth, async (_request, response) => {
    try {
      response.json(await buildOverview());
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/users', requireAdminAuth, async (request, response) => {
    try {
      const payload = await listUsers(request);
      if (requestedFormat(request) === 'csv') {
        sendCsv(
          response,
          'herzgarten-users.csv',
          payload.items.map((user) => ({
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            createdAt: user.createdAt,
            couples: user.couples.map((couple: { inviteCode: string }) => couple.inviteCode),
          })),
        );
        return;
      }
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/couples', requireAdminAuth, async (request, response) => {
    try {
      const payload = await listCouples(request);
      if (requestedFormat(request) === 'csv') {
        sendCsv(
          response,
          'herzgarten-couples.csv',
          payload.items.map((couple) => ({
            id: couple.id,
            inviteCode: couple.inviteCode,
            relationshipType: couple.relationshipType,
            contentPreference: couple.contentPreference,
            heartPoints: couple.heartPoints,
            gardenStage: couple.gardenStage,
            createdAt: couple.createdAt,
            members: couple.members.map((member: { email: string }) => member.email),
          })),
        );
        return;
      }
      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/couples/:id', requireAdminAuth, async (request, response) => {
    try {
      const couple = await getCoupleDetail(String(request.params.id));
      if (!couple) {
        response.status(404).json({ errorKey: 'couple.notFound', error: 'Paarraum nicht gefunden.' });
        return;
      }
      response.json({ couple });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/audit-log', requireAdminAuth, async (_request, response) => {
    try {
      const result = await pool.query(
        `
          select id, action, resource_type as "resourceType", resource_id as "resourceId", metadata, created_at as "createdAt"
          from admin_audit_log
          order by created_at desc
          limit 100
        `,
      );
      response.json({ items: result.rows });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/content/locales', requireAdminAuth, async (_request, response) => {
    try {
      response.json({ locales: await supportedLocales() });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/categories', requireAdminAuth, async (request, response) => {
    try {
      const type = normalizeText(request.query.type);
      const locale = normalizeLocale(request.query.lang) || parseAcceptLanguage(request.header('accept-language')) || 'de';
      if (type && !isContentType(type)) {
        response.status(404).json({ errorKey: 'content.notFound', error: 'Content-Typ nicht gefunden.' });
        return;
      }
      response.json({ items: await listCategories(type ? (type as ContentType) : undefined, locale) });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/categories', requireAdminAuth, async (request, response) => {
    try {
      const id = await saveCategory(request.body);
      await audit('create', 'category', id, { contentType: request.body.contentType, value: request.body.value });
      response.status(201).json({ id, items: await listCategories() });
    } catch {
      response.status(400).json({ errorKey: 'admin.categoryInvalid', error: 'Kategorie-Daten sind ungueltig.' });
    }
  });

  router.patch('/categories/:id', requireAdminAuth, async (request, response) => {
    try {
      const id = await saveCategory(request.body, String(request.params.id));
      await audit('update', 'category', id, { contentType: request.body.contentType, value: request.body.value });
      response.json({ id, items: await listCategories() });
    } catch {
      response.status(400).json({ errorKey: 'admin.categoryInvalid', error: 'Kategorie-Daten sind ungueltig.' });
    }
  });

  router.delete('/categories/:id', requireAdminAuth, async (request, response) => {
    try {
      const result = await deleteCategory(String(request.params.id));
      if (result.reason === 'not_found') {
        response.status(404).json({ errorKey: 'admin.categoryNotFound', error: 'Kategorie nicht gefunden.' });
        return;
      }
      if (result.reason === 'in_use') {
        response.status(409).json({
          errorKey: 'admin.categoryInUse',
          error: 'Kategorie wird noch verwendet.',
          usageCount: result.usageCount,
        });
        return;
      }
      await audit('delete', 'category', String(request.params.id));
      response.json({ items: await listCategories() });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/content/:type', requireAdminAuth, async (request, response) => {
    try {
      const type = String(request.params.type);
      if (!isContentType(type)) {
        response.status(404).json({ errorKey: 'content.notFound', error: 'Content-Typ nicht gefunden.' });
        return;
      }
      response.json({ items: await listContent(type, request) });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/content/:type', requireAdminAuth, async (request, response) => {
    try {
      const type = String(request.params.type);
      if (!isContentType(type)) {
        response.status(404).json({ errorKey: 'content.notFound', error: 'Content-Typ nicht gefunden.' });
        return;
      }
      const id = await saveContent(type, request.body);
      await audit('create', type, id, { fields: Object.keys(request.body ?? {}) });
      response.status(201).json({ id, items: await listContent(type, request) });
    } catch (error) {
      response.status(400).json({ errorKey: 'admin.contentInvalid', error: 'Content-Daten sind ungueltig.' });
    }
  });

  router.patch('/content/:type/:id', requireAdminAuth, async (request, response) => {
    try {
      const type = String(request.params.type);
      if (!isContentType(type)) {
        response.status(404).json({ errorKey: 'content.notFound', error: 'Content-Typ nicht gefunden.' });
        return;
      }
      const id = await saveContent(type, request.body, String(request.params.id));
      await audit('update', type, id, { fields: Object.keys(request.body ?? {}) });
      response.json({ id, items: await listContent(type, request) });
    } catch (error) {
      response.status(400).json({ errorKey: 'admin.contentInvalid', error: 'Content-Daten sind ungueltig.' });
    }
  });

  return router;
}
