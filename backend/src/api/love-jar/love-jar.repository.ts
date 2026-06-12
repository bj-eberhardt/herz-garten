import { randomUUID } from 'node:crypto';
import type { Queryable } from '../support.repository.js';

export async function insertLoveJarNote(
  client: Queryable,
  input: { id: string; coupleId: string; authorId: string; text: string; category: string },
) {
  await client.query(
    `
      insert into love_jar_notes (id, couple_id, author_id, text, category)
      values ($1, $2, $3, $4, $5)
    `,
    [input.id, input.coupleId, input.authorId, input.text, input.category],
  );
}

export async function hasDrawnLoveJarToday(client: Queryable, coupleId: string, userId: string) {
  const result = await client.query(
    `
      select 1
      from love_jar_draws
      where couple_id = $1
        and user_id = $2
        and drawn_date = current_date
      for update
    `,
    [coupleId, userId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function drawPartnerLoveJarNote(client: Queryable, coupleId: string, userId: string) {
  const result = await client.query(
    `
      update love_jar_notes
      set is_drawn = true,
          drawn_at = now()
      where id = (
        select id
        from love_jar_notes
        where couple_id = $1
          and author_id <> $2
          and is_drawn = false
        order by
          random()
        limit 1
        for update skip locked
      )
      returning id
    `,
    [coupleId, userId],
  );
  return result.rows[0]?.id ?? null;
}

export async function insertLoveJarDraw(client: Queryable, coupleId: string, userId: string, noteId: string) {
  await client.query(
    `
      insert into love_jar_draws (id, couple_id, user_id, note_id, drawn_date)
      values ($1, $2, $3, $4, current_date)
    `,
    [randomUUID(), coupleId, userId, noteId],
  );
}
