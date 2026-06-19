import 'dotenv/config';
import { fileURLToPath } from 'node:url';

const defaultJwtSecret = 'dev-only-herzgarten-secret';
const defaultAdminPassword = 'admin';
const defaultUploadDir = fileURLToPath(new URL('../../public/uploads', import.meta.url));
const nodeEnv = process.env.NODE_ENV ?? 'development';
const pushEnabledEnv = process.env.PUSH_ENABLED?.trim().toLowerCase();
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? '';
const pushKeysConfigured = Boolean(vapidPublicKey && vapidPrivateKey);

export const config = {
  nodeEnv,
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://herzgarten:herzgarten@localhost:5432/herzgarten',
  migrationsDir: process.env.MIGRATIONS_DIR ?? '../database/migrations',
  i18nDefaultLocale: process.env.I18N_DEFAULT_LOCALE ?? 'de',
  jwtSecret: process.env.JWT_SECRET ?? defaultJwtSecret,
  adminPassword: process.env.ADMIN_PASSWORD ?? defaultAdminPassword,
  adminJwtSecret: process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET ?? defaultJwtSecret,
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  staticDir: process.env.STATIC_DIR ?? '',
  uploadDir: process.env.UPLOAD_DIR ?? defaultUploadDir,
  jwtIssuer: process.env.JWT_ISSUER ?? 'herzgarten',
  userJwtAudience: process.env.JWT_AUDIENCE ?? 'herzgarten-app',
  adminJwtAudience: process.env.ADMIN_JWT_AUDIENCE ?? 'herzgarten-admin',
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 1000),
  vapidPublicKey,
  vapidPrivateKey,
  vapidSubject: process.env.VAPID_SUBJECT ?? 'mailto:admin@herzgarten.local',
  pushEnabled:
    pushEnabledEnv === 'true' || pushEnabledEnv === '1'
      ? true
      : pushEnabledEnv === 'false' || pushEnabledEnv === '0'
        ? false
        : pushKeysConfigured,
};

if (config.nodeEnv === 'production') {
  const unsafeSettings = [
    !process.env.JWT_SECRET || config.jwtSecret === defaultJwtSecret ? 'JWT_SECRET' : '',
    !process.env.ADMIN_JWT_SECRET || config.adminJwtSecret === defaultJwtSecret ? 'ADMIN_JWT_SECRET' : '',
    !process.env.ADMIN_PASSWORD || config.adminPassword === defaultAdminPassword ? 'ADMIN_PASSWORD' : '',
    config.pushEnabled && !pushKeysConfigured ? 'VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY' : '',
  ].filter(Boolean);

  if (unsafeSettings.length > 0) {
    throw new Error(`Unsafe production configuration: set ${unsafeSettings.join(', ')}`);
  }
}
