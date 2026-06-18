import { randomUUID } from 'node:crypto';
import { withTransaction } from '../../db/transaction.js';
import {
  deleteCoupleMember,
  deleteEmptyCouple,
  findCoupleByInviteCode,
  insertCouple,
  insertCoupleMember,
} from './couples.repository.js';
import { preferenceValueExists } from '../../admin/preferences.repository.js';
import { createNotifications, createUniqueInviteCode, getCoupleMemberIds, getCurrentCouple, getPublicUser } from '../support.repository.js';

export async function createCoupleForUser(userId: string, locale: string, relationshipType: string, contentPreference: string) {
  if (await getCurrentCouple(userId)) return { status: 'alreadyConnected' as const };
  if (
    !(await preferenceValueExists('relationshipModes', relationshipType, true)) ||
    !(await preferenceValueExists('contentStyles', contentPreference, true))
  ) {
    return { status: 'invalidPreferences' as const };
  }

  const coupleId = randomUUID();
  const code = await createUniqueInviteCode(locale);
  const couple = await insertCouple(coupleId, code, relationshipType, contentPreference);
  await insertCoupleMember(coupleId, userId, 'owner');
  return { status: 'created' as const, couple: { ...couple, memberCount: 1 } };
}

export async function joinCoupleForUser(userId: string, inviteCode: string) {
  if (await getCurrentCouple(userId)) return { status: 'alreadyConnected' as const };

  const joinedUser = await getPublicUser(userId);

  return withTransaction(async (client) => {
    const couple = await findCoupleByInviteCode(inviteCode, client);
    if (!couple) return { status: 'notFound' as const };

    const existingMemberIds = await getCoupleMemberIds(client, couple.id);
    if (existingMemberIds.length >= 2) return { status: 'full' as const };

    await insertCoupleMember(couple.id, userId, 'partner', client);

    const memberCount = existingMemberIds.length + 1;
    if (memberCount === 2) {
      await createNotifications(client, {
        coupleId: couple.id,
        userIds: existingMemberIds.filter((memberId) => memberId !== userId),
        type: 'couple_joined',
        sourceType: 'couple',
        sourceId: couple.id,
        titleKey: 'notifications.titles.coupleJoined',
        bodyKey: 'notifications.bodies.coupleJoined',
        params: { name: joinedUser?.displayName ?? 'Dein Partner' },
      });
    }

    return { status: 'joined' as const, couple: { ...couple, memberCount } };
  });
}

export async function leaveCoupleForUser(userId: string) {
  const couple = await getCurrentCouple(userId);
  if (!couple) return null;

  await withTransaction(async (client) => {
    await deleteCoupleMember(client, couple.id, userId);
    await deleteEmptyCouple(client, couple.id);
  });

  return { user: await getPublicUser(userId), couple: null };
}
