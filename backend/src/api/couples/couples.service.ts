import { randomUUID } from 'node:crypto';
import { withTransaction } from '../../db/transaction.js';
import {
  countCoupleMembers,
  deleteCoupleMember,
  deleteEmptyCouple,
  findCoupleByInviteCode,
  insertCouple,
  insertCoupleMember,
} from './couples.repository.js';
import { createUniqueInviteCode, getCurrentCouple, getPublicUser } from '../support.repository.js';

export async function createCoupleForUser(userId: string, locale: string, relationshipType: string, contentPreference: string) {
  if (await getCurrentCouple(userId)) return { status: 'alreadyConnected' as const };

  const coupleId = randomUUID();
  const code = await createUniqueInviteCode(locale);
  const couple = await insertCouple(coupleId, code, relationshipType, contentPreference);
  await insertCoupleMember(coupleId, userId, 'owner');
  return { status: 'created' as const, couple: { ...couple, memberCount: 1 } };
}

export async function joinCoupleForUser(userId: string, inviteCode: string) {
  if (await getCurrentCouple(userId)) return { status: 'alreadyConnected' as const };

  const couple = await findCoupleByInviteCode(inviteCode);
  if (!couple) return { status: 'notFound' as const };

  const memberCount = await countCoupleMembers(couple.id);
  if (memberCount >= 2) return { status: 'full' as const };

  await insertCoupleMember(couple.id, userId, 'partner');
  return { status: 'joined' as const, couple: { ...couple, memberCount: memberCount + 1 } };
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
