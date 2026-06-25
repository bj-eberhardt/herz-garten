import { expect, test } from '@playwright/test';

import {
  apiGetRaw,

  apiPatchRaw,
  registerByApi
} from '../../helpers/api';

import {
  expectApiError,
  expectJson,

  expectMePayload,
  type MePayload
} from '../../helpers/apiAssertions';

import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / profile preferences', () => {
  test('stores profile preferences for feature explainers and preserves future options', async ({ request }) => {
    await test.step('Flow: stores profile preferences for feature explainers and preserves future options', async () => {
      const user = await registerByApi(request, testUser('api-preferences', testRunId()));

      const initial = await expectJson<MePayload>(await apiGetRaw(request, '/api/me', user.token));
      expectMePayload(initial);
      await test.step('Verify expected result', async () => {
        expect(initial.user.preferences?.featureExplainers).toEqual(
          expect.objectContaining({
            today: true,
            loveJar: true,
            settings: true,
          }),
        );
      });
      await test.step('Verify expected result', async () => {
        expect(initial.user.preferences?.pushNotificationMode).toBe('all');
      });

      const updated = await expectJson<MePayload>(
        await apiPatchRaw(
          request,
          '/api/me/preferences',
          {
            preferences: {
              featureExplainers: { today: false, loveJar: false },
              pushNotificationMode: 'actions_only',
              futureOption: { enabled: true },
            },
          },
          user.token,
        ),
      );
      await test.step('Verify expected result', async () => {
        expect(updated.user.preferences?.featureExplainers).toEqual(
          expect.objectContaining({
            today: false,
            loveJar: false,
            settings: true,
          }),
        );
      });
      await test.step('Verify expected result', async () => {
        expect(updated.user.preferences?.pushNotificationMode).toBe('actions_only');
      });
      await test.step('Verify expected result', async () => {
        expect(updated.user.preferences?.futureOption).toEqual({ enabled: true });
      });

      const reloaded = await expectJson<MePayload>(await apiGetRaw(request, '/api/me', user.token));
      await test.step('Verify expected result', async () => {
        expect(reloaded.user.preferences).toEqual(updated.user.preferences);
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPatchRaw(request, '/api/me/preferences', { preferences: { pushNotificationMode: 'urgent_only' } }, user.token),
          400,
          'common.validation',
        );
      });
    });
  });

  test('updates profile name and email with validation', async ({ request }) => {
    await test.step('Flow: updates profile name and email with validation', async () => {
      const runId = testRunId();
      const userA = await registerByApi(request, testUser('api-profile-a', runId));
      const userB = await registerByApi(request, testUser('api-profile-b', runId));
      const updatedEmail = `api-profile-updated-${runId}@example.test`;

      const updatedName = await expectJson<MePayload>(
        await apiPatchRaw(request, '/api/me/profile', { displayName: '  Neuer Name  ' }, userA.token),
      );
      expectMePayload(updatedName);
      await test.step('Verify expected result', async () => {
        expect(updatedName.user.displayName).toBe('Neuer Name');
      });
      await test.step('Verify expected result', async () => {
        expect(updatedName.user.email).toBe(userA.user.email);
      });

      const updatedProfile = await expectJson<MePayload>(
        await apiPatchRaw(request, '/api/me/profile', { email: `  ${updatedEmail.toUpperCase()}  ` }, userA.token),
      );
      await test.step('Verify expected result', async () => {
        expect(updatedProfile.user.email).toBe(updatedEmail);
      });
      await test.step('Verify expected result', async () => {
        expect(updatedProfile.user.displayName).toBe('Neuer Name');
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(await apiPatchRaw(request, '/api/me/profile', {}, userA.token), 400, 'profile.updateInvalid');
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPatchRaw(request, '/api/me/profile', { displayName: '   ' }, userA.token),
          400,
          'profile.updateInvalid',
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPatchRaw(request, '/api/me/profile', { email: 'keine-email' }, userA.token),
          400,
          'common.validation',
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPatchRaw(request, '/api/me/profile', { email: userB.user.email }, userA.token),
          409,
          'auth.emailAlreadyRegistered',
        );
      });

      const reloaded = await expectJson<MePayload>(await apiGetRaw(request, '/api/me', userA.token));
      await test.step('Verify expected result', async () => {
        expect(reloaded.user.email).toBe(updatedEmail);
      });
      await test.step('Verify expected result', async () => {
        expect(reloaded.user.displayName).toBe('Neuer Name');
      });
    });
  });
});
