import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
});

export async function checkDatabase() {
  const result = await pool.query<{ now: Date }>('select now()');
  return result.rows[0]?.now;
}

