import { withTransaction } from '../../db/transaction.js';
import {
  buildTodayPayload,
  createNotifications,
  ensureCoupleMembership,
  gardenStageAfterReward,
  getCoupleMemberIds,
  getCurrentCouple,
  getOrCreateTodayInstance,
  highestUnlockedAreaForReward,
  nextGardenPlacement,
} from '../support.repository.js';
import {
  addDailyRewardPoints,
  insertDailyGardenReward,
  listAnswersForDailyInstance,
  markDailyRewardApplied,
  upsertDailyAnswer,
} from './today.repository.js';

export async function answerTodayQuestion(user: { id: string; displayName: string }, answerText: string, locale: string) {
  const couple = await getCurrentCouple(user.id);
  if (!couple) return { status: 'notConnected' as const };

  const member = await ensureCoupleMembership(user.id, couple.id);
  if (!member) return { status: 'accessDenied' as const };

  await withTransaction(async (client) => {
    const instance = await getOrCreateTodayInstance(client, couple.id);
    await upsertDailyAnswer(client, { coupleId: couple.id, questionId: instance.questionId, userId: user.id, answerText });
    const answers = await listAnswersForDailyInstance(client, couple.id, instance.questionId, instance.date);

    if (answers.length >= 2 && !instance.rewardAppliedAt) {
      const areaKey = highestUnlockedAreaForReward(await gardenStageAfterReward(client, couple.id, 10), 'question');
      const placement = await nextGardenPlacement(client, couple.id, areaKey);
      await insertDailyGardenReward(client, {
        coupleId: couple.id,
        instanceId: instance.id,
        areaKey,
        assetKey: 'conversation_flower',
        ...placement,
      });
      await addDailyRewardPoints(client, couple.id);
      await markDailyRewardApplied(client, instance.id);
      const memberIds = await getCoupleMemberIds(client, couple.id);
      await createNotifications(client, {
        coupleId: couple.id,
        userIds: memberIds,
        type: 'daily_revealed',
        titleKey: 'notifications.titles.dailyRevealed',
        bodyKey: 'notifications.bodies.dailyRevealed',
        sourceType: 'today',
        sourceId: instance.id,
      });
    } else if (answers.length === 1) {
      const memberIds = await getCoupleMemberIds(client, couple.id);
      await createNotifications(client, {
        coupleId: couple.id,
        userIds: memberIds.filter((memberId) => memberId !== user.id),
        type: 'daily_answer_waiting',
        titleKey: 'notifications.titles.dailyAnswerWaiting',
        bodyKey: 'notifications.bodies.dailyAnswerWaiting',
        params: { name: user.displayName },
        sourceType: 'today',
        sourceId: instance.id,
      });
    }
  });

  return { status: 'answered' as const, payload: await buildTodayPayload(user.id, locale) };
}
