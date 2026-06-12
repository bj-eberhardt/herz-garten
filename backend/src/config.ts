import 'dotenv/config';

const defaultJwtSecret = 'dev-only-herzgarten-secret';
const defaultAdminPassword = 'admin';
const nodeEnv = process.env.NODE_ENV ?? 'development';

export const config = {
  nodeEnv,
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://herzgarten:herzgarten@localhost:5432/herzgarten',
  migrationsDir: process.env.MIGRATIONS_DIR ?? '../database/migrations',
  jwtSecret: process.env.JWT_SECRET ?? defaultJwtSecret,
  adminPassword: process.env.ADMIN_PASSWORD ?? defaultAdminPassword,
  adminJwtSecret: process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET ?? defaultJwtSecret,
  adminTokenTtl: process.env.ADMIN_TOKEN_TTL ?? '8h',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  jwtIssuer: process.env.JWT_ISSUER ?? 'herzgarten',
  userJwtAudience: process.env.JWT_AUDIENCE ?? 'herzgarten-app',
  adminJwtAudience: process.env.ADMIN_JWT_AUDIENCE ?? 'herzgarten-admin',
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 1000),
};

if (config.nodeEnv === 'production') {
  const unsafeSettings = [
    !process.env.JWT_SECRET || config.jwtSecret === defaultJwtSecret ? 'JWT_SECRET' : '',
    !process.env.ADMIN_JWT_SECRET || config.adminJwtSecret === defaultJwtSecret ? 'ADMIN_JWT_SECRET' : '',
    !process.env.ADMIN_PASSWORD || config.adminPassword === defaultAdminPassword ? 'ADMIN_PASSWORD' : '',
  ].filter(Boolean);

  if (unsafeSettings.length > 0) {
    throw new Error(`Unsafe production configuration: set ${unsafeSettings.join(', ')}`);
  }
}
