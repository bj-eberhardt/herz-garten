import { pool } from '../../db.js';

export async function markAllNotificationsRead(userId: string) {
  await pool.query('update notifications set read_at = now() where user_id = $1 and read_at is null', [userId]);
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const result = await pool.query(
    `
      update notifications
      set read_at = coalesce(read_at, now())
      where id = $1 and user_id = $2
      returning id
    `,
    [notificationId, userId],
  );
  return Boolean(result.rows[0]);
}
