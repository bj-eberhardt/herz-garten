import type { Queryable } from '../support.repository.js';

export async function insertMemory(
  client: Queryable,
  input: {
    id: string;
    coupleId: string;
    authorId: string;
    title: string;
    description: string | null;
    date: string;
    category: string;
  },
) {
  await client.query(
    `
      insert into memory_entries (id, couple_id, author_id, title, description, date, category)
      values ($1, $2, $3, $4, $5, $6, $7)
    `,
    [input.id, input.coupleId, input.authorId, input.title, input.description, input.date, input.category],
  );
}

export async function linkMemoryGardenObject(client: Queryable, memoryId: string, gardenObjectId: string) {
  await client.query('update memory_entries set linked_garden_object_id = $1 where id = $2', [gardenObjectId, memoryId]);
}
