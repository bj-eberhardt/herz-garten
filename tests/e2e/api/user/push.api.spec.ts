import { expect, test, type APIResponse } from '@playwright/test';

import { shouldSendPushForMode } from '../../../../backend/src/api/notifications/notificationPolicy';
import { apiDeleteRaw, apiGetRaw, apiPatchRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../../helpers/api';
import { expectApiError, expectJson } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

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

async function expectRejected(response: APIResponse) {
  await expectApiError(response, 400, 'rejected');
}

test.describe('user api / push', () => {
  test('exposes public VAPID availability', async ({ request }) => {
    await test.step('Assert: public VAPID availability is readable without auth', async () => {
      const payload = await expectJson<{ enabled: boolean; publicKey: string; }>(await apiGetRaw(request, '/api/push/vapid-public-key'));
      expect(payload).toEqual(
      expect.objectContaining({
      enabled: expect.any(Boolean),
      publicKey: expect.any(String),
      }),
      );
    });
  });

  test('rejects invalid push query parameters', async ({ request }) => {
    const user = await registerByApi(request, testUser('api-push-query', testRunId()));

    for (const path of [
      '/api/push/vapid-public-key?unexpected=true',
      '/api/push/subscriptions/me?unexpected=true',
      '/api/push/subscriptions?unexpected=true',
      '/api/push/test?unexpected=true',
    ]) {
      await test.step(`Reject: push route with invalid query ${path}`, async () => {
        const response = path.includes('/subscriptions?')
          ? await apiPostRaw(request, path, subscription, user.token)
          : path.includes('/push/test')
            ? await apiPostRaw(request, path, {}, user.token)
            : await apiGetRaw(request, path, user.token);
        await expectRejected(response);
      });
    }

    await test.step('Reject: delete subscription with unexpected query parameter', async () => {
      await expectRejected(await apiDeleteRaw(request, '/api/push/subscriptions?unexpected=true', user.token));
    });
  });

  test('requires authentication for subscription management', async ({ request }) => {
    await test.step('Reject: list current subscriptions without auth token', async () => {
      await expectApiError(await apiGetRaw(request, '/api/push/subscriptions/me'), 401, 'auth.missingToken');
    });

    await test.step('Reject: create subscription without auth token', async () => {
      await expectApiError(await apiPostRaw(request, '/api/push/subscriptions', subscription), 401, 'auth.missingToken');
    });

    await test.step('Reject: delete subscription without auth token', async () => {
      await expectApiError(await apiDeleteRaw(request, '/api/push/subscriptions'), 401, 'auth.missingToken');
    });

    await test.step('Reject: send test push without auth token', async () => {
      await expectApiError(await apiPostRaw(request, '/api/push/test', {}), 401, 'auth.missingToken');
    });
  });

  test('rejects invalid push tokens', async ({ request }) => {
    await test.step('Reject: list subscriptions with invalid auth token', async () => {
      await expectApiError(await apiGetRaw(request, '/api/push/subscriptions/me', 'invalid-token'), 401, 'auth.invalidToken');
    });

    await test.step('Reject: create subscription with invalid auth token', async () => {
      await expectApiError(await apiPostRaw(request, '/api/push/subscriptions', subscription, 'invalid-token'), 401, 'auth.invalidToken');
    });

    await test.step('Reject: delete subscription with invalid auth token', async () => {
      await expectApiError(await apiDeleteRaw(request, '/api/push/subscriptions', 'invalid-token'), 401, 'auth.invalidToken');
    });

    await test.step('Reject: send test push with invalid auth token', async () => {
      await expectApiError(await apiPostRaw(request, '/api/push/test', {}, 'invalid-token'), 401, 'auth.invalidToken');
    });
  });

  test('stores subscriptions idempotently for the current user and disables them', async ({ request }) => {
    const user = await registerByApi(request, testUser('api-push', testRunId()));

    await test.step('Assert: new user starts without active subscriptions', async () => {

      const initial = await expectJson<PushStatusPayload>(await apiGetRaw(request, '/api/push/subscriptions/me', user.token));

      expect(initial.active).toBe(false);

      expect(initial.subscriptions).toHaveLength(0);

    });

    await test.step('Act: create a push subscription', async () => {
      const created = await expectJson<{ active: boolean; subscription: { endpoint: string; }; }>(
        await apiPostRaw(request, '/api/push/subscriptions', subscription, user.token),
        201,
      );
      expect(created.active).toBe(true);
      expect(created.subscription.endpoint).toBe(subscription.endpoint);
    });

    await test.step('Assert: creating the same subscription is idempotent', async () => {

      await expectJson(await apiPostRaw(request, '/api/push/subscriptions', subscription, user.token), 201);

      const afterUpsert = await expectJson<PushStatusPayload>(await apiGetRaw(request, '/api/push/subscriptions/me', user.token));

      expect(afterUpsert.active).toBe(true);

      expect(afterUpsert.subscriptions).toHaveLength(1);

      expect(afterUpsert.subscriptions[0]).toEqual(expect.objectContaining({ endpoint: subscription.endpoint }));

    });

    await test.step('Act: delete all current user subscriptions', async () => {
      const afterDelete = await expectJson<PushStatusPayload>(await apiDeleteRaw(request, '/api/push/subscriptions', user.token));
      expect(afterDelete.active).toBe(false);
      expect(afterDelete.subscriptions).toHaveLength(0);
    });
  });

  test('rejects invalid subscription and unsubscribe payloads', async ({ request }) => {
    const user = await registerByApi(request, testUser('api-push-invalid', testRunId()));

    const invalidSubscriptions: Array<{ name: string; body: unknown }> = [
      { name: 'missing endpoint', body: { keys: subscription.keys } },
      { name: 'invalid endpoint url', body: { ...subscription, endpoint: 'not-a-url' } },
      { name: 'unexpected field', body: { ...subscription, unexpected: true } },
      { name: 'missing keys', body: { endpoint: subscription.endpoint } },
      { name: 'blank auth key', body: { ...subscription, keys: { ...subscription.keys, auth: '   ' } } },
      { name: 'numeric p256dh key', body: { ...subscription, keys: { ...subscription.keys, p256dh: 123 } } },
    ];

    for (const { name, body } of invalidSubscriptions) {
      await test.step(`Reject: subscription payload ${name}`, async () => {
        await expectRejected(await apiPostRaw(request, '/api/push/subscriptions', body, user.token));
      });
    }

    const invalidUnsubscribes: Array<{ name: string; body: unknown }> = [
      { name: 'unexpected field', body: { unexpected: true } },
      { name: 'invalid endpoint url', body: { endpoint: 'not-a-url' } },
      { name: 'numeric endpoint', body: { endpoint: 123 } },
    ];

    for (const { name, body } of invalidUnsubscribes) {
      await test.step(`Reject: unsubscribe payload ${name}`, async () => {
        await expectRejected(await apiDeleteRaw(request, '/api/push/subscriptions', user.token, {}, body));
      });
    }

    await test.step('Reject: test push with non-empty body', async () => {
      await expectRejected(await apiPostRaw(request, '/api/push/test', { unexpected: true }, user.token));
    });
  });

  test('filters push payloads by notification mode without hiding in-app notifications', async ({ request }) => {
    await test.step('Assert: notification mode policy filters push-only delivery', async () => {
      expect(shouldSendPushForMode('all', 'daily_revealed')).toBe(true);
      expect(shouldSendPushForMode('actions_only', 'daily_revealed')).toBe(false);
      expect(shouldSendPushForMode('actions_only', 'daily_answer_waiting')).toBe(true);
      expect(shouldSendPushForMode('actions_only', 'love_jar_note')).toBe(true);
      expect(shouldSendPushForMode('actions_only', 'couple_joined')).toBe(true);
    });

    const runId = testRunId();
    const { partnerA, partnerB } = await setupCoupleByApi(
      request,
      testUser('api-push-filter-a', runId),
      testUser('api-push-filter-b', runId),
    );

    await test.step('Setup: partner receives in-app notification while push mode is actions-only', async () => {
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
    });

    await test.step('Assert: in-app notification remains visible', async () => {

      const notifications = await expectJson<{ notifications: Array<{ type: string; }>; }>(

      await apiGetRaw(request, '/api/notifications', partnerB.token),

      );

      expect(notifications.notifications.some((item) => item.type === 'daily_revealed')).toBeTruthy();

    });
  });
});