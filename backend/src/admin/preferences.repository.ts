import { randomUUID } from 'node:crypto';
import { config as appConfig } from '../config.js';
import { pool } from '../db.js';

export type PreferenceKind = 'relationshipModes' | 'contentStyles';

const preferenceTables = {
  relationshipModes: {
    table: 'relationship_modes',
    translationTable: 'relationship_mode_translations',
    idColumn: 'mode_id',
  },
  contentStyles: {
    table: 'content_styles',
    translationTable: 'content_style_translations',
    idColumn: 'style_id',
  },
} as const;

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
  return appConfig.i18nDefaultLocale;
}

function preferenceTranslations(body: Record<string, unknown>) {
  const translations = translationsFromBody(body.translations);
  const locale = defaultLocale();
  translations[locale] ??= {};
  const label = normalizeText(body.label);
  if (label && !normalizeText(translations[locale].label)) {
    translations[locale].label = label;
  }
  return translations;
}

export async function listPreferences(kind: PreferenceKind, locale = 'de', activeOnly = false) {
  const preference = preferenceTables[kind];
  const result = await pool.query(
    `
      select
        item.id,
        item.value,
        coalesce(requested.label, fallback.label) as label,
        fallback.label as "defaultLabel",
        item.active,
        item.sort_order as "sortOrder",
        item.created_at as "createdAt",
        item.updated_at as "updatedAt",
        coalesce(json_object_agg(t.locale, json_build_object('label', t.label)) filter (where t.locale is not null), '{}'::json) as translations
      from ${preference.table} item
      left join ${preference.translationTable} t on t.${preference.idColumn} = item.id
      left join ${preference.translationTable} requested on requested.${preference.idColumn} = item.id and requested.locale = $1
      left join ${preference.translationTable} fallback on fallback.${preference.idColumn} = item.id and fallback.locale = $2
      ${activeOnly ? 'where item.active = true' : ''}
      group by item.id, requested.label, fallback.label
      order by item.active desc, item.sort_order, label
    `,
    [locale, defaultLocale()],
  );
  return result.rows;
}

export async function preferenceValueExists(kind: PreferenceKind, value: string, activeOnly = true) {
  const preference = preferenceTables[kind];
  const result = await pool.query(
    `select 1 from ${preference.table} where value = $1 ${activeOnly ? 'and active = true' : ''} limit 1`,
    [value],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function savePreference(kind: PreferenceKind, body: Record<string, unknown>, id: string = randomUUID()) {
  const preference = preferenceTables[kind];
  const value = normalizeText(body.value).toLowerCase().replaceAll(' ', '_');
  const translations = preferenceTranslations(body);
  const label = normalizeText(translations[defaultLocale()]?.label);
  if (!/^[a-z0-9_-]+$/.test(value) || !label) {
    throw new Error('invalid preference');
  }

  await pool.query(
    `
      insert into ${preference.table} (id, value, active, sort_order, updated_at)
      values ($1, $2, $3, $4, now())
      on conflict (id) do update set
        active = excluded.active,
        sort_order = excluded.sort_order,
        updated_at = now()
    `,
    [id, value, normalizeBoolean(body.active), normalizeInteger(body.sortOrder, 0)],
  );

  for (const [locale, translation] of Object.entries(translations)) {
    const translatedLabel = normalizeText(translation.label);
    if (!translatedLabel) continue;
    await pool.query(
      `
        insert into ${preference.translationTable} (${preference.idColumn}, locale, label)
        values ($1, $2, $3)
        on conflict (${preference.idColumn}, locale) do update set label = excluded.label
      `,
      [id, locale, translatedLabel],
    );
  }

  return id;
}

export async function listPreferenceOptions(locale = 'de') {
  const [relationshipModes, contentStyles] = await Promise.all([
    listPreferences('relationshipModes', locale, true),
    listPreferences('contentStyles', locale, true),
  ]);
  return { relationshipModes, contentStyles };
}
