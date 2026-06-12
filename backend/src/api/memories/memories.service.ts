import { randomUUID } from 'node:crypto';
import { withTransaction } from '../../db/transaction.js';
import {
  buildMemoryPayload,
  createMemoryStone,
  createNotifications,
  getCoupleMemberIds,
  getCurrentCouple,
  isActiveContentCategory,
} from '../support.repository.js';
import { insertMemory, linkMemoryGardenObject } from './memories.repository.js';

export async function createMemoryForUser(
  user: { id: string; displayName: string },
  input: { title: string; description: string | null; date: string; category: string },
  locale: string,
) {
  if (!(await isActiveContentCategory('memories', input.category))) return { status: 'invalidCategory' as const };
  const couple = await getCurrentCouple(user.id);
  if (!couple) return { status: 'notConnected' as const };

  await withTransaction(async (client) => {
    const memoryId = randomUUID();
    await insertMemory(client, {
      id: memoryId,
      coupleId: couple.id,
      authorId: user.id,
      ...input,
    });
    const gardenObjectId = await createMemoryStone(client, couple.id, memoryId, input.title);
    if (gardenObjectId) {
      await linkMemoryGardenObject(client, memoryId, gardenObjectId);
    }
    const memberIds = await getCoupleMemberIds(client, couple.id);
    await createNotifications(client, {
      coupleId: couple.id,
      userIds: memberIds.filter((memberId) => memberId !== user.id),
      type: 'memory_created',
      titleKey: 'notifications.titles.memoryCreated',
      bodyKey: 'notifications.bodies.memoryCreated',
      params: { name: user.displayName, title: input.title },
      sourceType: 'memory',
      sourceId: memoryId,
    });
  });

  return { status: 'created' as const, payload: await buildMemoryPayload(user.id, locale) };
}
