import { expect, test } from '@playwright/test';

import { apiDeleteRaw, apiGetRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../../helpers/api';

import {
  expectApiError,
  expectJson,
  expectMePayload,
  expectNotificationsPayload,
  type MePayload,
  type NotificationsPayload,
} from '../../helpers/apiAssertions';

import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / account delete', () => {
  test('deletes account and invalidates login access', async ({ request }) => {
    await test.step('Flow: deletes account and invalidates login access', async () => {
      const runId = testRunId();
      const userA = testUser('api-delete-a', runId);
      const userB = testUser('api-delete-b', runId);
      let partnerAToken = '';
      let partnerBToken = '';

      await test.step('Arrange: create paired users', async () => {
        const { partnerA, partnerB } = await setupCoupleByApi(request, userA, userB);
        partnerAToken = partnerA.token;
        partnerBToken = partnerB.token;
      });

      await test.step('Act: delete first partner account', async () => {
        const deleteResponse = await apiDeleteRaw(request, '/api/me', partnerAToken);
        expect(deleteResponse.status()).toBe(204);
      });

      await test.step('Assert: deleted user cannot log in again', async () => {

        await expectApiError(

        await apiPostRaw(request, '/api/auth/login', { email: userA.email, password: userA.password }),

        401,

        'auth.invalidCredentials',

        );

      });

      await test.step('Assert: remaining partner is disconnected', async () => {

        const partnerMe = await expectJson<MePayload>(await apiGetRaw(request, '/api/me', partnerBToken));

        expectMePayload(partnerMe);

        expect(partnerMe.couple).toBeNull();

      });

      await test.step('Assert: remaining partner receives disconnect notification', async () => {

        const partnerNotifications = await expectJson<NotificationsPayload>(

        await apiGetRaw(request, '/api/notifications', partnerBToken),

        );

        expectNotificationsPayload(partnerNotifications);

        expect(partnerNotifications.notifications.some((item) => item.type === 'couple_disconnected')).toBeTruthy();

      });
    });
  });

  test('rejects missing auth, invalid query parameters, and invalid payloads', async ({ request }) => {
    await test.step('Flow: rejects missing auth, invalid query parameters, and invalid payloads', async () => {
      let token = '';

      await test.step('Assert: rejects missing auth token', async () => {
        await expectApiError(await apiDeleteRaw(request, '/api/me'), 401, 'auth.missingToken');
      });

      await test.step('Assert: rejects invalid auth token', async () => {

        await expectApiError(await apiDeleteRaw(request, '/api/me', 'invalid-token'), 401, 'auth.invalidToken');

      });

      await test.step('Arrange: create authenticated user', async () => {
        const user = await registerByApi(request, testUser('api-delete-validation', testRunId()));
        token = user.token;
      });

      await test.step('Assert: rejects unexpected query parameters', async () => {

        await expectApiError(await apiDeleteRaw(request, '/api/me?confirm=true', token), 400, 'common.validation');

      });

      await test.step('Assert: rejects unexpected payload fields', async () => {

        await expectApiError(

        await apiDeleteRaw(request, '/api/me', token, {}, { confirm: true }),

        400,

        'common.validation',

        );

      });

      await test.step('Assert: rejects null JSON payload', async () => {

        await expectApiError(await apiDeleteRaw(request, '/api/me', token, {}, null), 400, 'common.validation');

      });

      await test.step('Assert: rejected requests do not delete the account', async () => {

        const me = await expectJson<MePayload>(await apiGetRaw(request, '/api/me', token));

        expectMePayload(me);

      });
    });
  });
});
