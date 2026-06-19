import { pool } from '../../db.js';

interface MessageTemplateTranslationRow {
  text: string | null;
}

export async function findNotificationMessageTemplateText(key: string, locale: string, fallbackLocale: string) {
  const result = await pool.query<MessageTemplateTranslationRow>(
    `
      select coalesce(requested.text, fallback.text) as text
      from message_templates template
      left join message_template_translations requested
        on requested.template_key = template.key and requested.locale = $2
      left join message_template_translations fallback
        on fallback.template_key = template.key and fallback.locale = $3
      where template.key = $1 and template.active = true
      limit 1
    `,
    [key, locale, fallbackLocale],
  );
  return result.rows[0]?.text ?? null;
}

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
