import { randomUUID } from 'node:crypto';
import { withTransaction } from '../../db/transaction.js';
import {
  buildLoveJarPayload,
  createLoveJarLight,
  createNotifications,
  getCoupleMemberIds,
  getCurrentCouple,
  isActiveContentCategory,
} from '../support.js';
import {
  drawPartnerLoveJarNote,
  hasDrawnLoveJarToday,
  insertLoveJarDraw,
  insertLoveJarNote,
} from './love-jar.repository.js';

export async function createLoveJarNoteForUser(
  user: { id: string; displayName: string },
  input: { text: string; category: string },
  locale: string,
) {
  if (!(await isActiveContentCategory('love-jar-templates', input.category))) return { status: 'invalidCategory' as const };
  const couple = await getCurrentCouple(user.id);
  if (!couple) return { status: 'notConnected' as const };

  await withTransaction(async (client) => {
    const noteId = randomUUID();
    await insertLoveJarNote(client, { id: noteId, coupleId: couple.id, authorId: user.id, ...input });
    await createLoveJarLight(client, couple.id, noteId);
    const memberIds = await getCoupleMemberIds(client, couple.id);
    await createNotifications(client, {
      coupleId: couple.id,
      userIds: memberIds.filter((memberId) => memberId !== user.id),
      type: 'love_jar_note',
      title: 'Ein neuer Zettel wartet',
      body: `${user.displayName} hat etwas in euren Love Jar gelegt.`,
      titleKey: 'notifications.titles.loveJarNote',
      bodyKey: 'notifications.bodies.loveJarNote',
      params: { name: user.displayName },
      sourceType: 'love_jar',
      sourceId: noteId,
    });
  });

  return { status: 'created' as const, payload: await buildLoveJarPayload(user.id, locale) };
}

export async function drawLoveJarNoteForUser(userId: string, locale: string) {
  const couple = await getCurrentCouple(userId);
  if (!couple) return { status: 'notConnected' as const };

  const result = await withTransaction(async (client) => {
    if (await hasDrawnLoveJarToday(client, couple.id, userId)) return { status: 'alreadyDrawn' as const };
    const noteId = await drawPartnerLoveJarNote(client, couple.id, userId);
    if (!noteId) return { status: 'noUnreadNote' as const };
    await insertLoveJarDraw(client, couple.id, userId, noteId);
    return { status: 'drawn' as const };
  });

  if (result.status !== 'drawn') return result;
  return { status: 'drawn' as const, payload: await buildLoveJarPayload(userId, locale) };
}
