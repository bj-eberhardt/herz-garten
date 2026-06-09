import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://herzgarten:herzgarten@localhost:5432/herzgarten',
  migrationsDir: process.env.MIGRATIONS_DIR ?? '../database/migrations',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-herzgarten-secret',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};
