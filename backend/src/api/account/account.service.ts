import { withTransaction } from '../../db/transaction.js';
import {
  deleteCoupleMembersForCouple,
  deleteEmptyCouple,
  deleteGardenObjectsCreatedByUserSources,
  deleteProfile,
  exportCoupleData,
  findPartnerIdsForMembership,
  findUserMemberships,
  getProfilePreferences,
  updateProfilePreferences,
} from './account.repository.js';
import {
  createNotifications,
  getCurrentCouple,
  getPublicUser,
  mergeUserPreferences,
  publicUser,
} from '../support.js';

export async function updateUserPreferences(userId: string, incomingPreferences: unknown) {
  const currentPreferences = await getProfilePreferences(userId);
  const preferences = mergeUserPreferences(currentPreferences, incomingPreferences);
  return publicUser(await updateProfilePreferences(userId, preferences));
}

export async function buildAccountExport(user: { id: string; email: string; displayName: string }, locale: string) {
  const couple = await getCurrentCouple(String(user.id));
  const payload: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    locale,
    user,
    couple,
  };

  if (couple) {
    payload.data = await exportCoupleData(couple.id, locale);
  }

  return payload;
}

export async function deleteAccount(user: { id: string; displayName: string }) {
  await withTransaction(async (client) => {
    const memberships = await findUserMemberships(client, user.id);
    for (const membership of memberships) {
      const partnerIds = await findPartnerIdsForMembership(client, membership.couple_id, user.id);
      await createNotifications(client, {
        coupleId: membership.couple_id,
        userIds: partnerIds,
        type: 'couple_disconnected',
        title: 'Paarung wurde getrennt',
        body: `${user.displayName} hat das Konto gelÃ¶scht. Eure Paarung wurde deshalb getrennt. Du kannst dich jetzt neu paaren.`,
        titleKey: 'notifications.titles.coupleDisconnected',
        bodyKey: 'notifications.bodies.coupleDisconnected',
        params: { name: user.displayName },
        sourceType: 'account_deletion',
        sourceId: null,
      });
      await deleteCoupleMembersForCouple(client, membership.couple_id);
    }

    await deleteGardenObjectsCreatedByUserSources(client, user.id);
    await deleteProfile(client, user.id);

    for (const membership of memberships) {
      await deleteEmptyCouple(client, membership.couple_id);
    }
  });
}

export async function getMePayload(userId: string, fallbackUser: { id: string; email: string; displayName: string }) {
  const [profile, couple] = await Promise.all([getPublicUser(userId), getCurrentCouple(userId)]);
  return { user: profile ?? fallbackUser, couple };
}
