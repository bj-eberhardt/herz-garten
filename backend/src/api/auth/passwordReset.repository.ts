import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { pool } from '../../db.js';

export interface PasswordResetUser {
  id: string;
  email: string;
  displayName: string;
}

export interface PasswordResetTokenRow {
  id: string;
  userId: string;
}

export async function findPasswordResetUserByEmail(email: string) {
  const result = await pool.query<PasswordResetUser>(
    `
      select id, email, display_name as "displayName"
      from profiles
      where email = $1
    `,
    [email],
  );
  return result.rows[0] ?? null;
}

export async function countRecentPasswordResetRequests(emailHash: string) {
  const result = await pool.query<{ count: string }>(
    `
      select count(*)::text as count
      from password_reset_requests
      where email_hash = $1
        and created_at >= now() - interval '24 hours'
    `,
    [emailHash],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function insertPasswordResetRequest(emailHash: string) {
  await pool.query(
    `
      insert into password_reset_requests (id, email_hash)
      values ($1, $2)
    `,
    [randomUUID(), emailHash],
  );
}

export async function createPasswordResetToken(userId: string, tokenHash: string, ttlMinutes: number) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query(
      `
        update password_reset_tokens
        set used_at = coalesce(used_at, now())
        where user_id = $1
          and used_at is null
      `,
      [userId],
    );
    await client.query(
      `
        insert into password_reset_tokens (id, user_id, token_hash, expires_at)
        values ($1, $2, $3, now() + ($4::int * interval '1 minute'))
      `,
      [randomUUID(), userId, tokenHash, ttlMinutes],
    );
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function findValidPasswordResetToken(tokenHash: string) {
  const result = await pool.query<PasswordResetTokenRow>(
    `
      select id, user_id as "userId"
      from password_reset_tokens
      where token_hash = $1
        and used_at is null
        and expires_at > now()
      limit 1
    `,
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function applyPasswordReset(tokenId: string, userId: string, passwordHash: string) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const tokenResult = await client.query(
      `
        update password_reset_tokens
        set used_at = now()
        where id = $1
          and user_id = $2
          and used_at is null
          and expires_at > now()
        returning id
      `,
      [tokenId, userId],
    );
    if ((tokenResult.rowCount ?? 0) === 0) {
      await client.query('rollback');
      return false;
    }

    await updatePasswordHash(client, userId, passwordHash);
    await client.query(
      `
        update password_reset_tokens
        set used_at = coalesce(used_at, now())
        where user_id = $1
          and used_at is null
      `,
      [userId],
    );
    await client.query('commit');
    return true;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function updatePasswordHash(client: PoolClient, userId: string, passwordHash: string) {
  await client.query(
    `
      update profiles
      set password_hash = $2,
          updated_at = now()
      where id = $1
    `,
    [userId, passwordHash],
  );
}
