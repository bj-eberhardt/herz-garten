import { expect, test, type APIResponse } from '@playwright/test';

import { apiDeleteRaw, apiGetRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../../helpers/api';
import { expectApiError, expectJson, expectNotificationsPayload, type NotificationsPayload } from '../../helpers/apiAssertions';
import type { NotificationDetailPayload } from '../../../../src/types/domain';
import { testRunId, testUser } from '../../helpers/testUsers';

const missingNotificationId = '00000000-0000-0000-0000-000000000000';

async function expectRejected(response: APIResponse) {
  await expectApiError(response, 400, 'rejected');
}

test.describe('user api / notifications', () => {
  test('rejects unauthenticated notification access', async ({ request }) => {
    await test.step('Reject: list notifications without auth token', async () => {
      await expectApiError(await apiGetRaw(request, '/api/notifications'), 401, 'auth.missingToken');
    });

    await test.step('Reject: mark all notifications read without auth token', async () => {
      await expectApiError(await apiPostRaw(request, '/api/notifications/read-all', {}), 401, 'auth.missingToken');
    });

    await test.step('Reject: read notification detail without auth token', async () => {
      await expectApiError(await apiGetRaw(request, `/api/notifications/${missingNotificationId}/detail`), 401, 'auth.missingToken');
    });

    await test.step('Reject: mark one notification read without auth token', async () => {
      await expectApiError(await apiPostRaw(request, `/api/notifications/${missingNotificationId}/read`, {}), 401, 'auth.missingToken');
    });
  });

  test('rejects invalid notification tokens', async ({ request }) => {
    await test.step('Reject: list notifications with invalid auth token', async () => {
      await expectApiError(await apiGetRaw(request, '/api/notifications', 'invalid-token'), 401, 'auth.invalidToken');
    });

    await test.step('Reject: mark all notifications read with invalid auth token', async () => {
      await expectApiError(await apiPostRaw(request, '/api/notifications/read-all', {}, 'invalid-token'), 401, 'auth.invalidToken');
    });

    await test.step('Reject: read notification detail with invalid auth token', async () => {
      await expectApiError(await apiGetRaw(request, `/api/notifications/${missingNotificationId}/detail`, 'invalid-token'), 401, 'auth.invalidToken');
    });

    await test.step('Reject: mark one notification read with invalid auth token', async () => {
      await expectApiError(await apiPostRaw(request, `/api/notifications/${missingNotificationId}/read`, {}, 'invalid-token'), 401, 'auth.invalidToken');
    });
  });

  test('rejects invalid notification query parameters ids and bodies', async ({ request }) => {
    const user = await registerByApi(request, testUser('api-notifications-validation', testRunId()));
    const invalidQueries = ['unexpected=true', 'lang=de-DE-extra', 'lang=en&lang=de', 'lang='];

    for (const query of invalidQueries) {
      await test.step(`Reject: list notifications with invalid query ${query}`, async () => {
        await expectRejected(await apiGetRaw(request, `/api/notifications?${query}`, user.token));
      });

      await test.step(`Reject: mark all notifications read with invalid query ${query}`, async () => {
        await expectRejected(await apiPostRaw(request, `/api/notifications/read-all?${query}`, {}, user.token));
      });

      await test.step(`Reject: read notification detail with invalid query ${query}`, async () => {
        await expectRejected(await apiGetRaw(request, `/api/notifications/${missingNotificationId}/detail?${query}`, user.token));
      });

      await test.step(`Reject: mark one notification read with invalid query ${query}`, async () => {
        await expectRejected(await apiPostRaw(request, `/api/notifications/${missingNotificationId}/read?${query}`, {}, user.token));
      });
    }

    await test.step('Reject: detail request with malformed notification id', async () => {
      await expectRejected(await apiGetRaw(request, '/api/notifications/not-a-uuid/detail', user.token));
    });

    await test.step('Reject: read request with malformed notification id', async () => {
      await expectRejected(await apiPostRaw(request, '/api/notifications/not-a-uuid/read', {}, user.token));
    });

    await test.step('Reject: mark all notifications read with non-empty body', async () => {
      await expectRejected(await apiPostRaw(request, '/api/notifications/read-all', { unexpected: true }, user.token));
    });

    await test.step('Reject: mark one notification read with non-empty body', async () => {
      await expectRejected(await apiPostRaw(request, `/api/notifications/${missingNotificationId}/read`, { unexpected: true }, user.token));
    });
  });

  test('lists generated notifications and marks one read', async ({ request }) => {
    const runId = testRunId();
    const { partnerA, partnerB } = await setupCoupleByApi(
      request,
      testUser('api-notifications-a', runId),
      testUser('api-notifications-b', runId),
    );

    await test.step('Setup: create love jar note that generates partner notification', async () => {
      await expectJson(
        await apiPostRaw(request, '/api/love-jar', { text: 'Notification source', category: 'surprise' }, partnerA.token),
        201,
      );
    });

    const notification = await test.step('Assert: partner receives an unread love jar notification', async () => {
      const listed = await expectJson<NotificationsPayload>(await apiGetRaw(request, '/api/notifications', partnerB.token));
      expectNotificationsPayload(listed);
      expect(listed.unreadCount).toBeGreaterThan(0);
      const item = listed.notifications.find((candidate) => candidate.type === 'love_jar_note');
      expect(item).toEqual(
        expect.objectContaining({
          coupleId: expect.any(String),
          titleKey: 'notifications.titles.loveJarNote',
          bodyKey: 'notifications.bodies.loveJarNote',
          params: expect.objectContaining({ name: partnerA.user.displayName }),
          sourceType: 'love_jar',
          sourceId: expect.any(String),
          readAt: null,
        }),
      );
      return item!;
    });

    await test.step('Act: mark the generated notification read', async () => {
      const readOne = await expectJson<NotificationsPayload>(
        await apiPostRaw(request, `/api/notifications/${notification.id}/read`, {}, partnerB.token),
      );
      expectNotificationsPayload(readOne);
      expect(readOne.notifications.find((item) => item.id === notification.id)?.readAt).toEqual(expect.any(String));
    });
  });

  test('returns notification details for garden and fallback sources', async ({ request }) => {
    const runId = testRunId();
    const { partnerA, partnerB } = await setupCoupleByApi(
      request,
      testUser('api-notifications-detail-a', runId),
      testUser('api-notifications-detail-b', runId),
    );

    await test.step('Setup: create memory that generates a garden-backed notification', async () => {
      await expectJson(
        await apiPostRaw(request, '/api/memories', { title: 'Detail moment', description: 'Source detail', date: '2026-06-09' }, partnerA.token),
        201,
      );
    });

    const memoryNotification = await test.step('Assert: partner receives memory notification', async () => {
      const listed = await expectJson<NotificationsPayload>(await apiGetRaw(request, '/api/notifications', partnerB.token));
      const item = listed.notifications.find((candidate) => candidate.type === 'memory_created');
      expect(item).toBeTruthy();
      return item!;
    });

    await test.step('Assert: memory notification resolves to memory garden detail', async () => {

      const detail = await expectJson<NotificationDetailPayload>(

      await apiGetRaw(request, `/api/notifications/${memoryNotification.id}/detail`, partnerB.token),

      );

      expect(detail.notification.id).toBe(memoryNotification.id);

      expect(detail.targetPageId).toBe('memories');

      expect(detail.gardenDetail).toEqual(

      expect.objectContaining({

      object: expect.objectContaining({ sourceType: 'memory', sourceId: memoryNotification.sourceId }),

      source: expect.objectContaining({ type: 'memory', title: 'Detail moment' }),

      }),

      );

    });

    await test.step('Reject: other user cannot read notification detail', async () => {
      await expectApiError(
        await apiGetRaw(request, `/api/notifications/${memoryNotification.id}/detail`, partnerA.token),
        404,
        'notification.notFound',
      );
    });

    await test.step('Setup: delete account to generate fallback account notification', async () => {
      await apiDeleteRaw(request, '/api/me', partnerA.token);
    });

    const accountNotification = await test.step('Assert: account deletion notification is listed', async () => {
      const afterDelete = await expectJson<NotificationsPayload>(await apiGetRaw(request, '/api/notifications', partnerB.token));
      const item = afterDelete.notifications.find((candidate) => candidate.type === 'couple_disconnected');
      expect(item).toBeTruthy();
      return item!;
    });

    await test.step('Assert: fallback account notification resolves without garden detail', async () => {

      const accountDetail = await expectJson<NotificationDetailPayload>(

      await apiGetRaw(request, `/api/notifications/${accountNotification.id}/detail`, partnerB.token),

      );

      expect(accountDetail.targetPageId).toBe('onboarding');

      expect(accountDetail.gardenDetail).toBeNull();

    });
  });

  test('marks all notifications read', async ({ request }) => {
    const runId = testRunId();
    const { partnerA, partnerB } = await setupCoupleByApi(
      request,
      testUser('api-notifications-all-a', runId),
      testUser('api-notifications-all-b', runId),
    );

    await test.step('Setup: create multiple unread partner notifications', async () => {
      await expectJson(await apiPostRaw(request, '/api/love-jar', { text: 'First notification' }, partnerA.token), 201);
      await expectJson(
        await apiPostRaw(request, '/api/memories', { title: 'Second notification', date: '2026-06-09' }, partnerA.token),
        201,
      );
    });

    await test.step('Assert: partner has multiple unread notifications before read-all', async () => {

      const beforeReadAll = await expectJson<NotificationsPayload>(await apiGetRaw(request, '/api/notifications', partnerB.token));

      expectNotificationsPayload(beforeReadAll);

      expect(beforeReadAll.unreadCount).toBeGreaterThanOrEqual(2);

    });

    await test.step('Act: mark every notification read', async () => {
      const afterReadAll = await expectJson<NotificationsPayload>(
        await apiPostRaw(request, '/api/notifications/read-all', {}, partnerB.token),
      );
      expectNotificationsPayload(afterReadAll);
      expect(afterReadAll.unreadCount).toBe(0);
      expect(afterReadAll.notifications.every((notification) => notification.readAt)).toBeTruthy();
    });
  });

  test('rejects reading unknown notification and supports empty list', async ({ request }) => {
    const user = await registerByApi(request, testUser('api-notifications-empty', testRunId()));

    await test.step('Assert: new user has an empty notification list', async () => {

      const empty = await expectJson<NotificationsPayload>(await apiGetRaw(request, '/api/notifications', user.token));

      expectNotificationsPayload(empty);

      expect(empty.notifications).toHaveLength(0);

      expect(empty.unreadCount).toBe(0);

    });

    await test.step('Reject: unknown valid notification id keeps not-found domain error', async () => {
      await expectApiError(
        await apiPostRaw(request, `/api/notifications/${missingNotificationId}/read`, {}, user.token),
        404,
        'notification.notFound',
      );
    });
  });
});