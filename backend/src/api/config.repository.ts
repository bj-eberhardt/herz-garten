import { pool } from '../db.js';

export async function listSupportedLocales() {
  const result = await pool.query<{ locale: string; label: string; isDefault: boolean }>(
    `
      select locale, label, is_default as "isDefault"
      from supported_locales
      where active = true
      order by is_default desc, locale
    `,
  );

  return result.rows;
}
