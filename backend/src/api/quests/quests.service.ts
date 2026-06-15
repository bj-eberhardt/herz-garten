import { withTransaction } from '../../db/transaction.js';
import {
  applyQuestReward,
  buildQuestPayload,
  createNotifications,
  getCoupleMemberIds,
  getCurrentCouple,
} from '../support.repository.js';
import {
  acceptQuestForCouple,
  countCoupleMembers,
  ensureCoupleQuest,
  findActiveQuestForCompletion,
  findActiveQuestId,
  lockCoupleQuest,
  updateCoupleQuestCompletion,
} from './quests.repository.js';

export async function acceptQuest(userId: string, questId: string, locale: string) {
  const couple = await getCurrentCouple(userId);
  if (!couple) return { status: 'notConnected' as const };
  if (!(await findActiveQuestId(questId))) return { status: 'notFound' as const };

  await acceptQuestForCouple(couple.id, questId);
  return { status: 'accepted' as const, payload: await buildQuestPayload(userId, {}, locale) };
}

export async function completeQuest(user: { id: string; displayName: string }, questId: string, locale: string) {
  const couple = await getCurrentCouple(user.id);
  if (!couple) return { status: 'notConnected' as const };

  const result = await withTransaction(async (client) => {
    const quest = await findActiveQuestForCompletion(client, questId, locale);
    if (!quest) return { status: 'notFound' as const };

    const coupleQuestId = (await ensureCoupleQuest(client, couple.id, questId)).id;
    const coupleQuest = await lockCoupleQuest(client, coupleQuestId);
    const completedBy = new Set<string>(coupleQuest.completedByUserIds ?? []);
    completedBy.add(user.id);
    const completedByUserIds = [...completedBy];

    const requiredConfirmations = quest.requiresBothPartners ? 2 : 1;
    const hasEnoughMembers = (await countCoupleMembers(client, couple.id)) >= requiredConfirmations;
    const isCompleted = hasEnoughMembers && completedByUserIds.length >= requiredConfirmations;

    await updateCoupleQuestCompletion(client, coupleQuestId, isCompleted ? 'completed' : 'accepted', completedByUserIds);

    if (isCompleted && !coupleQuest.rewardAppliedAt) {
      await applyQuestReward(client, couple.id, coupleQuestId, quest);
      const memberIds = await getCoupleMemberIds(client, couple.id);
      await createNotifications(client, {
        coupleId: couple.id,
        userIds: memberIds,
        type: 'quest_completed',
        titleKey: 'notifications.titles.questCompleted',
        bodyKey: 'notifications.bodies.questCompleted',
        params: { title: quest.title },
        sourceType: 'quest',
        sourceId: coupleQuestId,
      });
    } else if (!isCompleted) {
      const memberIds = await getCoupleMemberIds(client, couple.id);
      await createNotifications(client, {
        coupleId: couple.id,
        userIds: memberIds.filter((memberId) => memberId !== user.id),
        type: 'quest_waiting_confirmation',
        titleKey: 'notifications.titles.questWaitingConfirmation',
        bodyKey: 'notifications.bodies.questWaitingConfirmation',
        params: { name: user.displayName, title: quest.title },
        sourceType: 'quest',
        sourceId: coupleQuestId,
      });
    }

    return { status: 'completed' as const };
  });

  if (result.status === 'notFound') return result;
  return { status: 'completed' as const, payload: await buildQuestPayload(user.id, {}, locale) };
}
