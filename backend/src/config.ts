import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://herzgarten:herzgarten@localhost:5432/herzgarten',
  migrationsDir: process.env.MIGRATIONS_DIR ?? '../database/migrations',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-herzgarten-secret',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin',
  adminJwtSecret: process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET ?? 'dev-only-herzgarten-secret',
  adminTokenTtl: process.env.ADMIN_TOKEN_TTL ?? '8h',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};
