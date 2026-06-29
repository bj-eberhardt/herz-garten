import { randomUUID } from 'node:crypto';
import { config } from '../../config.js';
import { pool } from '../../db.js';
import {
  isContentType,
  usageTableForContentType,
  type ContentType,
} from '../contentTypes.js';
import { preferenceValueExists } from '../preferences.repository.js';

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

function defaultLocale() {
  return config.i18nDefaultLocale;
}

export const defaultTranslationMissingMessage = 'default translation missing';

function categoryTranslations(body: Record<string, unknown>) {
  return translationsFromBody(body.translations);
}

function stringArrayFromBody(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(normalizeText).filter(Boolean))];
}

async function validatePreferenceValues(kind: 'relationshipModes' | 'contentStyles', values: string[]) {
  for (const value of values) {
    if (!(await preferenceValueExists(kind, value, true))) return false;
  }
  return true;
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
  params.push(defaultLocale());
  const result = await pool.query(
    `
      select
        c.id,
        c.content_type as "contentType",
        c.value,
        coalesce(requested.label, fallback.label) as label,
        fallback.label as "defaultLabel",
        c.active,
        c.sort_order as "sortOrder",
        c.relationship_modes as "relationshipModes",
        c.content_styles as "contentStyles",
        c.created_at as "createdAt",
        c.updated_at as "updatedAt",
        coalesce(json_object_agg(t.locale, json_build_object('label', t.label)) filter (where t.locale is not null), '{}'::json) as translations
      from content_categories c
      left join content_category_translations t on t.category_id = c.id
      left join content_category_translations requested on requested.category_id = c.id and requested.locale = $${params.length - 1}
      left join content_category_translations fallback on fallback.category_id = c.id and fallback.locale = $${params.length}
      ${where}
      group by c.id, requested.label, fallback.label
      order by c.content_type, c.active desc, c.sort_order, label
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
  const translations = categoryTranslations(body);
  const label = normalizeText(translations[defaultLocale()]?.label);
  const relationshipModes = stringArrayFromBody(body.relationshipModes);
  const contentStyles = stringArrayFromBody(body.contentStyles);
  if (!label) {
    throw new Error(defaultTranslationMissingMessage);
  }
  if (!isContentType(contentType) || !/^[a-z0-9_-]+$/.test(value)) {
    throw new Error('invalid category');
  }
  if (!(await validatePreferenceValues('relationshipModes', relationshipModes))) {
    throw new Error('invalid relationship modes');
  }
  if (!(await validatePreferenceValues('contentStyles', contentStyles))) {
    throw new Error('invalid content styles');
  }

  await pool.query(
    `
      insert into content_categories (id, content_type, value, active, sort_order, relationship_modes, content_styles, updated_at)
      values ($1, $2, $3, $4, $5, $6, $7, now())
      on conflict (id) do update set
        active = excluded.active,
        sort_order = excluded.sort_order,
        relationship_modes = excluded.relationship_modes,
        content_styles = excluded.content_styles,
        updated_at = now()
    `,
    [id, contentType, value, normalizeBoolean(body.active), normalizeInteger(body.sortOrder, 0), relationshipModes, contentStyles],
  );

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
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return { deleted: false, reason: 'not_found' };
  }

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
