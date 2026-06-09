import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { config } from './config.js';

interface AppliedMigration {
  filename: string;
  checksum: string;
}

const migrationTableSql = `
  create table if not exists schema_migrations (
    filename text primary key,
    checksum text not null,
    executed_at timestamptz not null default now()
  );
`;

function resolveMigrationsDir() {
  if (path.isAbsolute(config.migrationsDir)) {
    return config.migrationsDir;
  }

  const backendDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(backendDir, '..', config.migrationsDir);
}

function checksum(content: string) {
  return createHash('sha256').update(content).digest('hex');
}

async function runMigrations() {
  const pool = new pg.Pool({
    connectionString: config.databaseUrl,
  });
  const client = await pool.connect();

  try {
    await client.query(migrationTableSql);

    const appliedResult = await client.query<AppliedMigration>(
      'select filename, checksum from schema_migrations order by filename',
    );
    const applied = new Map(appliedResult.rows.map((row) => [row.filename, row.checksum]));

    const migrationsDir = resolveMigrationsDir();
    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort((left, right) => left.localeCompare(right));

    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      const sql = await readFile(fullPath, 'utf8');
      const fileChecksum = checksum(sql);
      const appliedChecksum = applied.get(file);

      if (appliedChecksum === fileChecksum) {
        console.log(`Migration already applied: ${file}`);
        continue;
      }

      if (appliedChecksum && appliedChecksum !== fileChecksum) {
        throw new Error(`Migration checksum changed after apply: ${file}`);
      }

      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('insert into schema_migrations (filename, checksum) values ($1, $2)', [
          file,
          fileChecksum,
        ]);
        await client.query('commit');
        console.log(`Migration applied: ${file}`);
      } catch (error) {
        await client.query('rollback');
        throw error;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((error) => {
  console.error(error);
  process.exit(1);
});
