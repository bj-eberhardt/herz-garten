import { pool } from '../../db.js';

export interface MessageTemplateRow {
  key: string;
  namespace: string;
  description: string;
  requiredParams: string[];
  active: boolean;
  translations: Record<string, { text: string }>;
}

export interface MessageTemplateTranslationInput {
  locale: string;
  text: string;
}

export async function listMessageTemplates(namespace = 'notifications') {
  const result = await pool.query<MessageTemplateRow>(
    `
      select
        template.key,
        template.namespace,
        template.description,
        template.required_params as "requiredParams",
        template.active,
        coalesce(
          json_object_agg(
            translation.locale,
            json_build_object('text', translation.text)
            order by translation.locale
          ) filter (where translation.locale is not null),
          '{}'::json
        ) as translations
      from message_templates template
      left join message_template_translations translation on translation.template_key = template.key
      where template.namespace = $1
      group by template.key
      order by template.key
    `,
    [namespace],
  );
  return result.rows;
}

export async function findMessageTemplate(key: string) {
  const result = await pool.query<Pick<MessageTemplateRow, 'key' | 'namespace' | 'description' | 'requiredParams' | 'active'>>(
    `
      select
        key,
        namespace,
        description,
        required_params as "requiredParams",
        active
      from message_templates
      where key = $1
    `,
    [key],
  );
  return result.rows[0] ?? null;
}

export async function replaceMessageTemplateTranslations(key: string, translations: MessageTemplateTranslationInput[]) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query('delete from message_template_translations where template_key = $1', [key]);

    for (const translation of translations) {
      await client.query(
        `
          insert into message_template_translations (template_key, locale, text)
          values ($1, $2, $3)
          on conflict (template_key, locale) do update
          set text = excluded.text,
              updated_at = now()
        `,
        [key, translation.locale, translation.text],
      );
    }

    await client.query('update message_templates set updated_at = now() where key = $1', [key]);
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}
