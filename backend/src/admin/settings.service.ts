import { pool } from '../db.js';

export interface AdminSettingsPayload {
  auth: {
    adminJwtTtlMinutes: number;
    userJwtTtlMinutes: number;
  };
}

export const defaultAuthSettings = {
  adminJwtTtlMinutes: 60,
  userJwtTtlMinutes: 10080,
} satisfies AdminSettingsPayload['auth'];

const settingsKeys = {
  adminJwtTtlMinutes: 'auth.adminJwtTtlMinutes',
  userJwtTtlMinutes: 'auth.userJwtTtlMinutes',
} as const;

const cacheTtlMs = 5 * 60 * 1000;
let cachedAuthSettings: AdminSettingsPayload['auth'] | null = null;
let cacheLoadedAt = 0;

interface SettingRow {
  key: string;
  value: unknown;
}

function settingNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : fallback;
}

function normalizeAuthSettings(rows: SettingRow[]) {
  const values = new Map(rows.map((row) => [row.key, row.value]));
  return {
    adminJwtTtlMinutes: settingNumber(values.get(settingsKeys.adminJwtTtlMinutes), defaultAuthSettings.adminJwtTtlMinutes),
    userJwtTtlMinutes: settingNumber(values.get(settingsKeys.userJwtTtlMinutes), defaultAuthSettings.userJwtTtlMinutes),
  };
}

export async function loadAuthSettings() {
  const result = await pool.query<SettingRow>(
    `
      select key, value
      from app_settings
      where key = any($1::text[])
    `,
    [Object.values(settingsKeys)],
  );
  return normalizeAuthSettings(result.rows);
}

export async function getAuthSettings() {
  const now = Date.now();
  if (cachedAuthSettings && now - cacheLoadedAt < cacheTtlMs) {
    return cachedAuthSettings;
  }

  try {
    cachedAuthSettings = await loadAuthSettings();
    cacheLoadedAt = now;
  } catch (error) {
    if (!cachedAuthSettings) {
      cachedAuthSettings = defaultAuthSettings;
    }
    cacheLoadedAt = now;
  }

  return cachedAuthSettings ?? defaultAuthSettings;
}

export async function getAdminSettings(): Promise<AdminSettingsPayload> {
  return { auth: await getAuthSettings() };
}

export async function saveAdminSettings(input: AdminSettingsPayload): Promise<AdminSettingsPayload> {
  await pool.query(
    `
      insert into app_settings (key, value, updated_at)
      values
        ($1, to_jsonb($2::int), now()),
        ($3, to_jsonb($4::int), now())
      on conflict (key) do update
      set value = excluded.value,
          updated_at = now()
    `,
    [
      settingsKeys.adminJwtTtlMinutes,
      input.auth.adminJwtTtlMinutes,
      settingsKeys.userJwtTtlMinutes,
      input.auth.userJwtTtlMinutes,
    ],
  );

  cachedAuthSettings = { ...input.auth };
  cacheLoadedAt = Date.now();
  return { auth: cachedAuthSettings };
}
