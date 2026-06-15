import { randomUUID } from 'node:crypto';
import { pool } from '../../db.js';

export interface PushSubscriptionRow {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastSuccessAt: Date | string | null;
  lastFailureAt: Date | string | null;
  failureCount: number;
  disabledAt: Date | string | null;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function mapPushSubscription(row: PushSubscriptionRow) {
  return {
    id: row.id,
    endpoint: row.endpoint,
    userAgent: row.userAgent,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastSuccessAt: row.lastSuccessAt,
    lastFailureAt: row.lastFailureAt,
    failureCount: row.failureCount,
    disabledAt: row.disabledAt,
  };
}

export async function upsertPushSubscription(userId: string, subscription: PushSubscriptionInput, userAgent = '') {
  const result = await pool.query<PushSubscriptionRow>(
    `
      insert into push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent)
      values ($1, $2, $3, $4, $5, $6)
      on conflict (endpoint) do update set
        user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        user_agent = excluded.user_agent,
        updated_at = now(),
        disabled_at = null
      returning
        id,
        user_id as "userId",
        endpoint,
        p256dh,
        auth,
        user_agent as "userAgent",
        created_at as "createdAt",
        updated_at as "updatedAt",
        last_success_at as "lastSuccessAt",
        last_failure_at as "lastFailureAt",
        failure_count as "failureCount",
        disabled_at as "disabledAt"
    `,
    [randomUUID(), userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, userAgent || null],
  );

  return result.rows[0];
}

export async function listActivePushSubscriptions(userId: string) {
  const result = await pool.query<PushSubscriptionRow>(
    `
      select
        id,
        user_id as "userId",
        endpoint,
        p256dh,
        auth,
        user_agent as "userAgent",
        created_at as "createdAt",
        updated_at as "updatedAt",
        last_success_at as "lastSuccessAt",
        last_failure_at as "lastFailureAt",
        failure_count as "failureCount",
        disabled_at as "disabledAt"
      from push_subscriptions
      where user_id = $1 and disabled_at is null
      order by updated_at desc
    `,
    [userId],
  );

  return result.rows;
}

export async function disablePushSubscriptions(userId: string, endpoint?: string) {
  const result = await pool.query(
    `
      update push_subscriptions
      set disabled_at = now(), updated_at = now()
      where user_id = $1
        and disabled_at is null
        and ($2::text is null or endpoint = $2)
    `,
    [userId, endpoint ?? null],
  );

  return result.rowCount ?? 0;
}

export async function markPushSubscriptionSuccess(subscriptionId: string) {
  await pool.query(
    `
      update push_subscriptions
      set last_success_at = now(), updated_at = now(), failure_count = 0
      where id = $1
    `,
    [subscriptionId],
  );
}

export async function markPushSubscriptionFailure(subscriptionId: string, disable: boolean) {
  await pool.query(
    `
      update push_subscriptions
      set
        last_failure_at = now(),
        updated_at = now(),
        failure_count = failure_count + 1,
        disabled_at = case when $2 then now() else disabled_at end
      where id = $1
    `,
    [subscriptionId, disable],
  );
}
