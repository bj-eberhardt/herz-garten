import {randomUUID} from 'node:crypto';
import {config as appConfig} from '../config.js';
import {pool} from '../db.js';

export type PreferenceKind = 'relationshipModes' | 'contentStyles';
export type PreferenceSaveStatus = 'saved' | 'invalid' | 'defaultTranslationMissing' | 'exists' | 'notFound';

export interface PreferenceSaveResult {
  status: PreferenceSaveStatus;
  id?: string;
}

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

const valuePattern = /^[A-Za-z0-9_]+$/;
const localePattern = /^[a-z]{2}(?:-[A-Z]{2})?$/;

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function defaultLocale() {
  return appConfig.i18nDefaultLocale;
}

function translationsFromBody(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, Record<string, unknown>>;
}

async function supportedLocaleCodes() {
  const result = await pool.query<{ locale: string }>('select locale from supported_locales where active = true');
  return new Set(result.rows.map((row) => row.locale));
}

async function findPreferenceValueById(kind: PreferenceKind, id: string) {
  const preference = preferenceTables[kind];
  const result = await pool.query<{ value: string }>(`select value from ${preference.table} where id = $1 limit 1`, [id]);
  return result.rows[0]?.value ?? null;
}

async function preferenceExistsByValue(kind: PreferenceKind, value: string, id?: string) {
  const preference = preferenceTables[kind];
  const result = await pool.query(
    `select 1 from ${preference.table} where value = $1 ${id ? 'and id <> $2' : ''} limit 1`,
    id ? [value, id] : [value],
  );
  return (result.rowCount ?? 0) > 0;
}

async function preferenceTranslations(body: Record<string, unknown>) {
  const translations = translationsFromBody(body.translations);
  if (!translations) return null;

  const activeLocales = await supportedLocaleCodes();
  const normalized: Record<string, { label: string }> = {};
  const defaultLocaleCode = defaultLocale();

  for (const [locale, translation] of Object.entries(translations)) {
    if (!localePattern.test(locale) || !activeLocales.has(locale)) return null;
    if (!translation || typeof translation !== 'object' || Array.isArray(translation)) return null;
    const label = normalizeText(translation.label);
    if (!label) {
      if (locale === defaultLocaleCode) return null;
      continue;
    }
    if (label.length > 200) return null;
    normalized[locale] = { label };
  }

  if (!normalized[defaultLocaleCode]?.label) return null;
  return normalized;
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

export async function savePreference(kind: PreferenceKind, body: Record<string, unknown>, id?: string): Promise<PreferenceSaveResult> {
  if (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return { status: 'notFound' };
  }

  const preference = preferenceTables[kind];
  const isUpdate = Boolean(id);
  const preferenceId = id ?? randomUUID();
  const value = normalizeText(body.value);
  const defaultLocaleCode = defaultLocale();
  const rawTranslations = translationsFromBody(body.translations);
  if (!rawTranslations || !normalizeText(rawTranslations[defaultLocaleCode]?.label)) {
    return { status: 'defaultTranslationMissing' };
  }

  const translations = await preferenceTranslations(body);

  if (!value || value.length > 100 || !valuePattern.test(value) || !translations) {
    return { status: 'invalid' };
  }

  if (isUpdate) {
    const currentValue = await findPreferenceValueById(kind, preferenceId);
    if (!currentValue) return { status: 'notFound' };
    if (currentValue !== value) return { status: 'invalid' };
  }

  if (await preferenceExistsByValue(kind, value, preferenceId)) {
    return { status: 'exists' };
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
    [preferenceId, value, body.active, body.sortOrder],
  );

  for (const [locale, translation] of Object.entries(translations)) {
    await pool.query(
      `
        insert into ${preference.translationTable} (${preference.idColumn}, locale, label)
        values ($1, $2, $3)
        on conflict (${preference.idColumn}, locale) do update set label = excluded.label
      `,
      [preferenceId, locale, translation.label],
    );
  }

  return { status: 'saved', id: preferenceId };
}

export async function listPreferenceOptions(locale = 'de') {
  const [relationshipModes, contentStyles] = await Promise.all([
    listPreferences('relationshipModes', locale, true),
    listPreferences('contentStyles', locale, true),
  ]);
  return { relationshipModes, contentStyles };
}
