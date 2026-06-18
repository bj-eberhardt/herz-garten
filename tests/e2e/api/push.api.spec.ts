import { expect, test } from '@playwright/test';
import { shouldSendPushForMode } from '../../../backend/src/api/notifications/notificationPolicy';
import { apiDeleteRaw, apiGetRaw, apiPatchRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../helpers/api';
import { expectApiError, expectJson } from '../helpers/apiAssertions';
import { testRunId, testUser } from '../helpers/testUsers';

interface PushStatusPayload {
  enabled: boolean;
  publicKey: string;
  active: boolean;
  subscriptions: Array<{
    id: string;
    endpoint: string;
    userAgent: string | null;
    createdAt: string;
    updatedAt: string;
    disabledAt: string | null;
  }>;
}

const subscription = {
  endpoint: 'https://example.com/push/test-endpoint',
  expirationTime: null,
  keys: {
    p256dh: 'test-p256dh-key',
    auth: 'test-auth-secret',
  },
};

test.describe('push api', () => {
  test('exposes public VAPID availability', async ({ request }) => {
    const payload = await expectJson<{ enabled: boolean; publicKey: string }>(await apiGetRaw(request, '/api/push/vapid-public-key'));

    expect(payload).toEqual(
      expect.objectContaining({
        enabled: expect.any(Boolean),
        publicKey: expect.any(String),
      }),
    );
  });

  test('requires authentication for subscription management', async ({ request }) => {
    await expectApiError(await apiGetRaw(request, '/api/push/subscriptions/me'), 401, 'auth.missingToken');
    await expectApiError(await apiPostRaw(request, '/api/push/subscriptions', subscription), 401, 'auth.missingToken');
    await expectApiError(await apiDeleteRaw(request, '/api/push/subscriptions'), 401, 'auth.missingToken');
  });

  test('stores subscriptions idempotently for the current user and disables them', async ({ request }) => {
    const user = await registerByApi(request, testUser('api-push', testRunId()));

    const initial = await expectJson<PushStatusPayload>(await apiGetRaw(request, '/api/push/subscriptions/me', user.token));
    expect(initial.active).toBe(false);
    expect(initial.subscriptions).toHaveLength(0);

    const created = await expectJson<{ active: boolean; subscription: { endpoint: string } }>(
      await apiPostRaw(request, '/api/push/subscriptions', subscription, user.token),
      201,
    );
    expect(created.active).toBe(true);
    expect(created.subscription.endpoint).toBe(subscription.endpoint);

    await expectJson(await apiPostRaw(request, '/api/push/subscriptions', subscription, user.token), 201);
    const afterUpsert = await expectJson<PushStatusPayload>(await apiGetRaw(request, '/api/push/subscriptions/me', user.token));
    expect(afterUpsert.active).toBe(true);
    expect(afterUpsert.subscriptions).toHaveLength(1);
    expect(afterUpsert.subscriptions[0]).toEqual(expect.objectContaining({ endpoint: subscription.endpoint }));

    const afterDelete = await expectJson<PushStatusPayload>(await apiDeleteRaw(request, '/api/push/subscriptions', user.token));
    expect(afterDelete.active).toBe(false);
    expect(afterDelete.subscriptions).toHaveLength(0);
  });

  test('rejects invalid subscription payloads', async ({ request }) => {
    const user = await registerByApi(request, testUser('api-push-invalid', testRunId()));

    await expectApiError(
      await apiPostRaw(request, '/api/push/subscriptions', { endpoint: 'not-a-url', keys: { auth: '' } }, user.token),
      400,
      'common.validation',
    );
  });

  test('filters push payloads by notification mode without hiding in-app notifications', async ({ request }) => {
    expect(shouldSendPushForMode('all', 'daily_revealed')).toBe(true);
    expect(shouldSendPushForMode('actions_only', 'daily_revealed')).toBe(false);
    expect(shouldSendPushForMode('actions_only', 'daily_answer_waiting')).toBe(true);
    expect(shouldSendPushForMode('actions_only', 'love_jar_note')).toBe(true);
    expect(shouldSendPushForMode('actions_only', 'couple_joined')).toBe(true);

    const runId = testRunId();
    const { partnerA, partnerB } = await setupCoupleByApi(
      request,
      testUser('api-push-filter-a', runId),
      testUser('api-push-filter-b', runId),
    );

    await expectJson(
      await apiPatchRaw(
        request,
        '/api/me/preferences',
        { preferences: { pushNotificationMode: 'actions_only' } },
        partnerB.token,
      ),
    );
    await expectJson(await apiPostRaw(request, '/api/today/answer', { answerText: 'Antwort A' }, partnerA.token));
    await expectJson(await apiPostRaw(request, '/api/today/answer', { answerText: 'Antwort B' }, partnerB.token));

    const notifications = await expectJson<{ notifications: Array<{ type: string }> }>(
      await apiGetRaw(request, '/api/notifications', partnerB.token),
    );
    expect(notifications.notifications.some((item) => item.type === 'daily_revealed')).toBeTruthy();
  });
});
