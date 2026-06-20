import { pool } from '../db.js';
import { config } from '../config.js';

export interface AdminSettingsPayload {
  auth: {
    adminJwtTtlMinutes: number;
    userJwtTtlMinutes: number;
  };
  server: {
    publicBaseUrl: string;
  };
  passwordReset: {
    ttlMinutes: number;
    limitPer24h: number;
  };
  email: {
    enabled: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    smtpPassword?: string;
    smtpPasswordConfigured?: boolean;
    fromAddress: string;
    fromName: string;
    replyTo: string;
  };
}

export const defaultAuthSettings = {
  adminJwtTtlMinutes: 60,
  userJwtTtlMinutes: 10080,
} satisfies AdminSettingsPayload['auth'];

export function defaultEmailSettings(): AdminSettingsPayload['email'] {
  return {
    enabled: config.emailEnabled,
    smtpHost: config.emailSmtpHost,
    smtpPort: Number.isInteger(config.emailSmtpPort) && config.emailSmtpPort > 0 ? config.emailSmtpPort : 587,
    smtpSecure: config.emailSmtpSecure,
    smtpUser: config.emailSmtpUser,
    smtpPassword: config.emailSmtpPassword,
    smtpPasswordConfigured: Boolean(config.emailSmtpPassword),
    fromAddress: config.emailFromAddress,
    fromName: config.emailFromName,
    replyTo: config.emailReplyTo,
  };
}

export function defaultServerSettings(): AdminSettingsPayload['server'] {
  return {
    publicBaseUrl: config.publicBaseUrl,
  };
}

export function defaultPasswordResetSettings(): AdminSettingsPayload['passwordReset'] {
  return {
    ttlMinutes:
      Number.isInteger(config.passwordResetTtlMinutes) && config.passwordResetTtlMinutes >= 15 && config.passwordResetTtlMinutes <= 1440
        ? config.passwordResetTtlMinutes
        : 30,
    limitPer24h:
      Number.isInteger(config.passwordResetLimitPer24h) && config.passwordResetLimitPer24h > 0
        ? config.passwordResetLimitPer24h
        : 3,
  };
}

const settingsKeys = {
  adminJwtTtlMinutes: 'auth.adminJwtTtlMinutes',
  userJwtTtlMinutes: 'auth.userJwtTtlMinutes',
  emailEnabled: 'email.enabled',
  emailSmtpHost: 'email.smtpHost',
  emailSmtpPort: 'email.smtpPort',
  emailSmtpSecure: 'email.smtpSecure',
  emailSmtpUser: 'email.smtpUser',
  emailSmtpPassword: 'email.smtpPassword',
  emailFromAddress: 'email.fromAddress',
  emailFromName: 'email.fromName',
  emailReplyTo: 'email.replyTo',
  publicBaseUrl: 'server.publicBaseUrl',
  legacyPasswordResetBaseUrl: 'email.passwordResetBaseUrl',
  passwordResetTtlMinutes: 'passwordReset.ttlMinutes',
  legacyPasswordResetTtlMinutes: 'email.passwordResetTtlMinutes',
  passwordResetLimitPer24h: 'passwordReset.limitPer24h',
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

function settingString(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

function settingBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
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

export async function loadEmailSettings(): Promise<AdminSettingsPayload['email']> {
  const result = await pool.query<SettingRow>(
    `
      select key, value
      from app_settings
      where key = any($1::text[])
    `,
    [[
      settingsKeys.emailEnabled,
      settingsKeys.emailSmtpHost,
      settingsKeys.emailSmtpPort,
      settingsKeys.emailSmtpSecure,
      settingsKeys.emailSmtpUser,
      settingsKeys.emailSmtpPassword,
      settingsKeys.emailFromAddress,
      settingsKeys.emailFromName,
      settingsKeys.emailReplyTo,
    ]],
  );
  const defaults = defaultEmailSettings();
  const values = new Map(result.rows.map((row) => [row.key, row.value]));
  const smtpPassword = settingString(values.get(settingsKeys.emailSmtpPassword), defaults.smtpPassword ?? '');

  return {
    enabled: settingBoolean(values.get(settingsKeys.emailEnabled), defaults.enabled),
    smtpHost: settingString(values.get(settingsKeys.emailSmtpHost), defaults.smtpHost),
    smtpPort: settingNumber(values.get(settingsKeys.emailSmtpPort), defaults.smtpPort),
    smtpSecure: settingBoolean(values.get(settingsKeys.emailSmtpSecure), defaults.smtpSecure),
    smtpUser: settingString(values.get(settingsKeys.emailSmtpUser), defaults.smtpUser),
    smtpPassword,
    smtpPasswordConfigured: Boolean(smtpPassword),
    fromAddress: settingString(values.get(settingsKeys.emailFromAddress), defaults.fromAddress),
    fromName: settingString(values.get(settingsKeys.emailFromName), defaults.fromName),
    replyTo: settingString(values.get(settingsKeys.emailReplyTo), defaults.replyTo),
  };
}

export async function loadPasswordResetSettings(): Promise<AdminSettingsPayload['passwordReset']> {
  const result = await pool.query<SettingRow>(
    `
      select key, value
      from app_settings
      where key = any($1::text[])
    `,
    [[settingsKeys.passwordResetTtlMinutes, settingsKeys.legacyPasswordResetTtlMinutes, settingsKeys.passwordResetLimitPer24h]],
  );
  const defaults = defaultPasswordResetSettings();
  const values = new Map(result.rows.map((row) => [row.key, row.value]));
  return {
    ttlMinutes: settingNumber(
      values.get(settingsKeys.passwordResetTtlMinutes),
      settingNumber(values.get(settingsKeys.legacyPasswordResetTtlMinutes), defaults.ttlMinutes),
    ),
    limitPer24h: settingNumber(values.get(settingsKeys.passwordResetLimitPer24h), defaults.limitPer24h),
  };
}

export async function loadServerSettings(): Promise<AdminSettingsPayload['server']> {
  const result = await pool.query<SettingRow>(
    `
      select key, value
      from app_settings
      where key = any($1::text[])
    `,
    [[settingsKeys.publicBaseUrl, settingsKeys.legacyPasswordResetBaseUrl]],
  );
  const defaults = defaultServerSettings();
  const values = new Map(result.rows.map((row) => [row.key, row.value]));
  return {
    publicBaseUrl: settingString(
      values.get(settingsKeys.publicBaseUrl),
      settingString(values.get(settingsKeys.legacyPasswordResetBaseUrl), defaults.publicBaseUrl),
    ),
  };
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
  const email = await loadEmailSettings();
  return {
    auth: await getAuthSettings(),
    server: await loadServerSettings(),
    passwordReset: await loadPasswordResetSettings(),
    email: {
      ...email,
      smtpPassword: undefined,
      smtpPasswordConfigured: email.smtpPasswordConfigured,
    },
  };
}

export async function saveAdminSettings(input: AdminSettingsPayload): Promise<AdminSettingsPayload> {
  const currentEmail = await loadEmailSettings();
  const smtpPassword =
    typeof input.email.smtpPassword === 'string' && input.email.smtpPassword.length > 0
      ? input.email.smtpPassword
      : (currentEmail.smtpPassword ?? '');

  await pool.query(
    `
      insert into app_settings (key, value, updated_at)
      values
        ($1, to_jsonb($2::int), now()),
        ($3, to_jsonb($4::int), now()),
        ($5, to_jsonb($6::boolean), now()),
        ($7, to_jsonb($8::text), now()),
        ($9, to_jsonb($10::int), now()),
        ($11, to_jsonb($12::boolean), now()),
        ($13, to_jsonb($14::text), now()),
        ($15, to_jsonb($16::text), now()),
        ($17, to_jsonb($18::text), now()),
        ($19, to_jsonb($20::text), now()),
        ($21, to_jsonb($22::text), now()),
        ($23, to_jsonb($24::text), now()),
        ($25, to_jsonb($26::int), now()),
        ($27, to_jsonb($28::int), now())
      on conflict (key) do update
      set value = excluded.value,
          updated_at = now()
    `,
    [
      settingsKeys.adminJwtTtlMinutes,
      input.auth.adminJwtTtlMinutes,
      settingsKeys.userJwtTtlMinutes,
      input.auth.userJwtTtlMinutes,
      settingsKeys.emailEnabled,
      input.email.enabled,
      settingsKeys.emailSmtpHost,
      input.email.smtpHost,
      settingsKeys.emailSmtpPort,
      input.email.smtpPort,
      settingsKeys.emailSmtpSecure,
      input.email.smtpSecure,
      settingsKeys.emailSmtpUser,
      input.email.smtpUser,
      settingsKeys.emailSmtpPassword,
      smtpPassword,
      settingsKeys.emailFromAddress,
      input.email.fromAddress,
      settingsKeys.emailFromName,
      input.email.fromName,
      settingsKeys.emailReplyTo,
      input.email.replyTo,
      settingsKeys.publicBaseUrl,
      input.server.publicBaseUrl,
      settingsKeys.passwordResetTtlMinutes,
      input.passwordReset.ttlMinutes,
      settingsKeys.passwordResetLimitPer24h,
      input.passwordReset.limitPer24h,
    ],
  );

  cachedAuthSettings = { ...input.auth };
  cacheLoadedAt = Date.now();
  return {
    auth: cachedAuthSettings,
    server: { ...input.server },
    passwordReset: { ...input.passwordReset },
    email: {
      ...input.email,
      smtpPassword: undefined,
      smtpPasswordConfigured: Boolean(smtpPassword),
    },
  };
}
