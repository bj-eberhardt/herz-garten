import { randomUUID } from 'node:crypto';
import { pool } from '../../db.js';
import {
  isContentType,
  usageTableForContentType,
  type ContentType,
} from '../contentTypes.js';

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeBoolean(value: unknown, fallback = true) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeInteger(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

function translationsFromBody(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, Record<string, unknown>>;
}

export async function categoryExists(contentType: ContentType, value: string) {
  const result = await pool.query(
    'select 1 from content_categories where content_type = $1 and value = $2 limit 1',
    [contentType, value],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function categoryUsage(contentType: ContentType, value: string) {
  const table = usageTableForContentType(contentType);
  const result = await pool.query(`select count(*)::int as count from ${table} where category = $1`, [value]);
  return result.rows[0]?.count ?? 0;
}

export async function listCategories(type?: ContentType, locale = 'de') {
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

export async function saveCategory(body: Record<string, unknown>, id: string = randomUUID()) {
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

export async function deleteCategory(id: string) {
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
