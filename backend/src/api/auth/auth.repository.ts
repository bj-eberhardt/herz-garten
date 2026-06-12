import { randomUUID } from 'node:crypto';
import { pool } from '../../db.js';

export async function insertProfile(email: string, displayName: string, passwordHash: string) {
  const result = await pool.query(
    `
      insert into profiles (id, email, display_name, password_hash)
      values ($1, $2, $3, $4)
      returning id, email, display_name as "displayName"
    `,
    [randomUUID(), email, displayName, passwordHash],
  );
  return result.rows[0];
}

export async function findProfileByEmailWithPassword(email: string) {
  const result = await pool.query(
    `
      select id, email, display_name as "displayName", password_hash as "passwordHash"
      from profiles
      where email = $1
    `,
    [email],
  );
  return result.rows[0] ?? null;
}
