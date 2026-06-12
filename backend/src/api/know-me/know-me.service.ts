import { withTransaction } from '../../db/transaction.js';
import {
  buildKnowMePayload,
  createKnowMeFlower,
  createNotifications,
  getCoupleMemberIds,
  getCurrentCouple,
  shuffleKnowMeOptions,
} from '../support.js';
import {
  findCatalogQuestionText,
  hasAuthorUsedCatalogQuestion,
  insertKnowMeGuess,
  insertKnowMeQuestion,
  lockKnowMeQuestion,
  markKnowMeQuestionAnswered,
} from './know-me.repository.js';

export async function createKnowMeQuestionForUser(
  user: { id: string; displayName: string },
  input: { questionText: string; catalogQuestionId: string | null; options: string[]; correctOptionIndex: number },
  locale: string,
) {
  const couple = await getCurrentCouple(user.id);
  if (!couple) return { status: 'notConnected' as const };

  const result = await withTransaction(async (client) => {
    let questionText = input.questionText;
    if (input.catalogQuestionId) {
      const catalogQuestion = await findCatalogQuestionText(client, input.catalogQuestionId, locale);
      if (!catalogQuestion) return { status: 'catalogNotFound' as const };
      if (await hasAuthorUsedCatalogQuestion(client, couple.id, user.id, input.catalogQuestionId)) {
        return { status: 'catalogAlreadyUsed' as const };
      }
      questionText = catalogQuestion.questionText;
    }

    const shuffled = shuffleKnowMeOptions(input.options, input.correctOptionIndex);
    const questionId = await insertKnowMeQuestion(client, {
      coupleId: couple.id,
      authorId: user.id,
      catalogQuestionId: input.catalogQuestionId,
      questionText,
      options: shuffled.options,
      correctOptionIndex: shuffled.correctOptionIndex,
    });
    const memberIds = await getCoupleMemberIds(client, couple.id);
    await createNotifications(client, {
      coupleId: couple.id,
      userIds: memberIds.filter((memberId) => memberId !== user.id),
      type: 'know_me_question',
      title: 'Eine Kennst-du-mich-Frage wartet',
      body: `${user.displayName} hat eine Frage Ã¼ber sich gestellt. Was schÃ¤tzt du?`,
      titleKey: 'notifications.titles.knowMeQuestion',
      bodyKey: 'notifications.bodies.knowMeQuestion',
      params: { name: user.displayName },
      sourceType: 'know_me',
      sourceId: questionId,
    });
    return { status: 'created' as const };
  });

  if (result.status !== 'created') return result;
  return { status: 'created' as const, payload: await buildKnowMePayload(user.id, locale) };
}

export async function guessKnowMeQuestionForUser(
  user: { id: string; displayName: string },
  questionId: string,
  selectedOptionIndex: number,
  locale: string,
) {
  const couple = await getCurrentCouple(user.id);
  if (!couple) return { status: 'notConnected' as const };

  const result = await withTransaction(async (client) => {
    const question = await lockKnowMeQuestion(client, questionId, couple.id);
    if (!question) return { status: 'notFound' as const };
    if (question.authorId === user.id) return { status: 'ownQuestion' as const };
    if (question.status !== 'open') return { status: 'alreadyAnswered' as const };
    if (selectedOptionIndex >= question.options.length) return { status: 'optionDoesNotExist' as const };

    const isCorrect = selectedOptionIndex === question.correctOptionIndex;
    await insertKnowMeGuess(client, question.id, user.id, selectedOptionIndex, isCorrect);
    await markKnowMeQuestionAnswered(client, question.id);

    if (isCorrect && !question.rewardAppliedAt) {
      await createKnowMeFlower(client, couple.id, question.id);
    }

    await createNotifications(client, {
      coupleId: couple.id,
      userIds: [question.authorId],
      type: 'know_me_answered',
      title: isCorrect ? 'Treffer im Kennst-du-mich-Spiel' : 'Eine Antwort ist da',
      body: isCorrect
        ? `${user.displayName} hat dich richtig eingeschÃ¤tzt. Eine besondere Blume ist gewachsen.`
        : `${user.displayName} hat geraten. Nicht getroffen, aber ein neuer GesprÃ¤chsanlass.`,
      titleKey: isCorrect ? 'notifications.titles.knowMeAnsweredHit' : 'notifications.titles.knowMeAnsweredMiss',
      bodyKey: isCorrect ? 'notifications.bodies.knowMeAnsweredHit' : 'notifications.bodies.knowMeAnsweredMiss',
      params: { name: user.displayName },
      sourceType: 'know_me',
      sourceId: question.id,
    });

    return { status: 'guessed' as const };
  });

  if (result.status !== 'guessed') return result;
  return { status: 'guessed' as const, payload: await buildKnowMePayload(user.id, locale) };
}
