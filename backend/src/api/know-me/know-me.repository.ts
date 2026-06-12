import { randomUUID } from 'node:crypto';
import type { Queryable } from '../support.repository.js';

export async function findCatalogQuestionText(client: Queryable, catalogQuestionId: string, locale: string) {
  const result = await client.query(
    `
      select coalesce(requested.question_text, fallback.question_text, c.question_text) as "questionText"
      from know_me_catalog_questions c
      left join know_me_catalog_question_translations requested
        on requested.catalog_question_id = c.id and requested.locale = $2
      left join know_me_catalog_question_translations fallback
        on fallback.catalog_question_id = c.id and fallback.locale = 'de'
      where c.id = $1 and c.active = true
    `,
    [catalogQuestionId, locale],
  );
  return result.rows[0] ?? null;
}

export async function hasAuthorUsedCatalogQuestion(
  client: Queryable,
  coupleId: string,
  authorId: string,
  catalogQuestionId: string,
) {
  const result = await client.query(
    `
      select 1
      from know_me_questions
      where couple_id = $1
        and author_id = $2
        and catalog_question_id = $3
      limit 1
    `,
    [coupleId, authorId, catalogQuestionId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function insertKnowMeQuestion(
  client: Queryable,
  input: {
    coupleId: string;
    authorId: string;
    catalogQuestionId: string | null;
    questionText: string;
    options: string[];
    correctOptionIndex: number;
  },
) {
  const questionId = randomUUID();
  await client.query(
    `
      insert into know_me_questions (
        id, couple_id, author_id, catalog_question_id, question_text, options, correct_option_index
      )
      values ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      questionId,
      input.coupleId,
      input.authorId,
      input.catalogQuestionId,
      input.questionText,
      JSON.stringify(input.options),
      input.correctOptionIndex,
    ],
  );
  return questionId;
}

export async function lockKnowMeQuestion(client: Queryable, questionId: string, coupleId: string) {
  const result = await client.query(
    `
      select
        q.id,
        q.author_id as "authorId",
        q.question_text as "questionText",
        q.options,
        q.correct_option_index as "correctOptionIndex",
        q.status,
        q.reward_applied_at as "rewardAppliedAt",
        p.display_name as "authorName"
      from know_me_questions q
      join profiles p on p.id = q.author_id
      where q.id = $1 and q.couple_id = $2
      for update
    `,
    [questionId, coupleId],
  );
  return result.rows[0] ?? null;
}

export async function insertKnowMeGuess(
  client: Queryable,
  questionId: string,
  userId: string,
  selectedOptionIndex: number,
  isCorrect: boolean,
) {
  await client.query(
    `
      insert into know_me_guesses (id, question_id, user_id, selected_option_index, is_correct)
      values ($1, $2, $3, $4, $5)
    `,
    [randomUUID(), questionId, userId, selectedOptionIndex, isCorrect],
  );
}

export async function markKnowMeQuestionAnswered(client: Queryable, questionId: string) {
  await client.query("update know_me_questions set status = 'answered', answered_at = now() where id = $1", [questionId]);
}
