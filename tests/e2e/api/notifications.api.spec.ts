import { expect, test } from '@playwright/test';
import { apiGetRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../helpers/api';
import {
  expectApiError,
  expectJson,
  expectNotificationsPayload,
  type NotificationsPayload,
} from '../helpers/apiAssertions';
import { testRunId, testUser } from '../helpers/testUsers';

test.describe('notifications api', () => {
  test('lists generated notifications and marks one read', async ({ request }) => {
    const runId = testRunId();
    const { partnerA, partnerB } = await setupCoupleByApi(
      request,
      testUser('api-notifications-a', runId),
      testUser('api-notifications-b', runId),
    );

    await expectJson(
      await apiPostRaw(request, '/api/love-jar', { text: 'Notification source', category: 'surprise' }, partnerA.token),
      201,
    );

    const listed = await expectJson<NotificationsPayload>(await apiGetRaw(request, '/api/notifications', partnerB.token));
    expectNotificationsPayload(listed);
    expect(listed.unreadCount).toBeGreaterThan(0);
    const notification = listed.notifications.find((item) => item.type === 'love_jar_note');
    expect(notification).toEqual(
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

    const readOne = await expectJson<NotificationsPayload>(
      await apiPostRaw(request, `/api/notifications/${notification!.id}/read`, {}, partnerB.token),
    );
    expectNotificationsPayload(readOne);
    expect(readOne.notifications.find((item) => item.id === notification!.id)?.readAt).toEqual(expect.any(String));
  });

  test('marks all notifications read', async ({ request }) => {
    const runId = testRunId();
    const { partnerA, partnerB } = await setupCoupleByApi(
      request,
      testUser('api-notifications-all-a', runId),
      testUser('api-notifications-all-b', runId),
    );

    await expectJson(await apiPostRaw(request, '/api/love-jar', { text: 'First notification' }, partnerA.token), 201);
    await expectJson(
      await apiPostRaw(request, '/api/memories', { title: 'Second notification', date: '2026-06-09' }, partnerA.token),
      201,
    );

    const beforeReadAll = await expectJson<NotificationsPayload>(await apiGetRaw(request, '/api/notifications', partnerB.token));
    expectNotificationsPayload(beforeReadAll);
    expect(beforeReadAll.unreadCount).toBeGreaterThanOrEqual(2);

    const afterReadAll = await expectJson<NotificationsPayload>(
      await apiPostRaw(request, '/api/notifications/read-all', {}, partnerB.token),
    );
    expectNotificationsPayload(afterReadAll);
    expect(afterReadAll.unreadCount).toBe(0);
    expect(afterReadAll.notifications.every((notification) => notification.readAt)).toBeTruthy();
  });

  test('rejects reading unknown notification and supports empty list', async ({ request }) => {
    const user = await registerByApi(request, testUser('api-notifications-empty', testRunId()));

    const empty = await expectJson<NotificationsPayload>(await apiGetRaw(request, '/api/notifications', user.token));
    expectNotificationsPayload(empty);
    expect(empty.notifications).toHaveLength(0);
    expect(empty.unreadCount).toBe(0);

    await expectApiError(
      await apiPostRaw(request, '/api/notifications/00000000-0000-0000-0000-000000000000/read', {}, user.token),
      404,
      'notification.notFound',
    );
  });
});
