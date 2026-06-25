import { expect, test } from '@playwright/test';

import {
  apiDeleteRaw,

  apiGetRaw,
  apiPostRaw,
  setupCoupleByApi
} from '../../helpers/api';

import {
  expectApiError,
  expectJson,

  expectMePayload,
  type MePayload
} from '../../helpers/apiAssertions';

import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / account delete', () => {
  test('deletes account and invalidates login access', async ({ request }) => {
    await test.step('Flow: deletes account and invalidates login access', async () => {
      const runId = testRunId();
      const userA = testUser('api-delete-a', runId);
      const userB = testUser('api-delete-b', runId);
      const { partnerA, partnerB } = await setupCoupleByApi(request, userA, userB);

      const deleteResponse = await apiDeleteRaw(request, '/api/me', partnerA.token);
      await test.step('Verify expected result', async () => {
        expect(deleteResponse.status()).toBe(204);
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/auth/login', { email: userA.email, password: userA.password }),
          401,
          'auth.invalidCredentials',
        );
      });

      const partnerMe = await expectJson<MePayload>(await apiGetRaw(request, '/api/me', partnerB.token));
      expectMePayload(partnerMe);
      await test.step('Verify expected result', async () => {
        expect(partnerMe.couple).toBeNull();
      });

      const partnerNotifications = await expectJson<{ notifications: Array<{ type: string; }>; }>(
        await apiGetRaw(request, '/api/notifications', partnerB.token),
      );
      await test.step('Verify expected result', async () => {
        expect(partnerNotifications.notifications.some((item) => item.type === 'couple_disconnected')).toBeTruthy();
      });
    });
  });
});
