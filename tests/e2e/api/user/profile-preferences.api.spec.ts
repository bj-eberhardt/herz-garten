import { expect, test, type APIResponse } from '@playwright/test';

import { apiGetRaw, apiPatchRaw, registerByApi } from '../../helpers/api';
import { expectApiError, expectJson, expectMePayload, type MePayload } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

async function expectRejected(response: APIResponse) {
  await expectApiError(response, 400, 'rejected');
}

test.describe('user api / profile preferences', () => {
  test('rejects unauthenticated profile and preference access', async ({ request }) => {
    await test.step('Reject: read profile without auth token', async () => {
      await expectApiError(await apiGetRaw(request, '/api/me'), 401, 'auth.missingToken');
    });

    await test.step('Reject: update preferences without auth token', async () => {
      await expectApiError(
        await apiPatchRaw(request, '/api/me/preferences', { preferences: { pushNotificationMode: 'actions_only' } }),
        401,
        'auth.missingToken',
      );
    });

    await test.step('Reject: update profile without auth token', async () => {
      await expectApiError(await apiPatchRaw(request, '/api/me/profile', { displayName: 'No token' }), 401, 'auth.missingToken');
    });
  });

  test('rejects invalid profile and preference tokens', async ({ request }) => {
    await test.step('Reject: read profile with invalid auth token', async () => {
      await expectApiError(await apiGetRaw(request, '/api/me', 'invalid-token'), 401, 'auth.invalidToken');
    });

    await test.step('Reject: update preferences with invalid auth token', async () => {
      await expectApiError(
        await apiPatchRaw(request, '/api/me/preferences', { preferences: { pushNotificationMode: 'actions_only' } }, 'invalid-token'),
        401,
        'auth.invalidToken',
      );
    });

    await test.step('Reject: update profile with invalid auth token', async () => {
      await expectApiError(await apiPatchRaw(request, '/api/me/profile', { displayName: 'Invalid token' }, 'invalid-token'), 401, 'auth.invalidToken');
    });
  });

  test('rejects unexpected query parameters on profile and preference routes', async ({ request }) => {
    const user = await registerByApi(request, testUser('api-profile-query', testRunId()));

    await test.step('Reject: read profile with unexpected query parameter', async () => {
      await expectRejected(await apiGetRaw(request, '/api/me?unexpected=true', user.token));
    });

    await test.step('Reject: update preferences with unexpected query parameter', async () => {
      await expectRejected(
        await apiPatchRaw(request, '/api/me/preferences?unexpected=true', { preferences: { pushNotificationMode: 'actions_only' } }, user.token),
      );
    });

    await test.step('Reject: update profile with unexpected query parameter', async () => {
      await expectRejected(await apiPatchRaw(request, '/api/me/profile?unexpected=true', { displayName: 'Query Name' }, user.token));
    });
  });

  test('stores profile preferences for feature explainers and preserves future options', async ({ request }) => {
    const user = await registerByApi(request, testUser('api-preferences', testRunId()));

    await test.step('Assert: new profile has default preferences', async () => {

      const initial = await expectJson<MePayload>(await apiGetRaw(request, '/api/me', user.token));

      expectMePayload(initial);

      expect(initial.user.preferences?.featureExplainers).toEqual(

      expect.objectContaining({

      today: true,

      loveJar: true,

      settings: true,

      }),

      );

      expect(initial.user.preferences?.pushNotificationMode).toBe('all');

    });

    const updated = await test.step('Act: update explainers push mode and future option', async () => {
      return expectJson<MePayload>(
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
    });

    await test.step('Assert: preference update merges with existing defaults', async () => {

      expect(updated.user.preferences?.featureExplainers).toEqual(

      expect.objectContaining({

      today: false,

      loveJar: false,

      settings: true,

      }),

      );

      expect(updated.user.preferences?.pushNotificationMode).toBe('actions_only');

      expect(updated.user.preferences?.futureOption).toEqual({ enabled: true });

    });

    await test.step('Assert: preference update is persisted', async () => {

      const reloaded = await expectJson<MePayload>(await apiGetRaw(request, '/api/me', user.token));

      expect(reloaded.user.preferences).toEqual(updated.user.preferences);

    });
  });

  test('rejects invalid preference payload shapes and values', async ({ request }) => {
    const user = await registerByApi(request, testUser('api-preferences-invalid', testRunId()));

    const invalidPayloads: Array<{ name: string; body: unknown }> = [
      { name: 'unknown top-level field', body: { unexpected: true } },
      { name: 'non-object preferences', body: { preferences: 'invalid' } },
      { name: 'unknown nested preference field', body: { preferences: { unexpected: true } } },
      { name: 'non-object feature explainers', body: { preferences: { featureExplainers: 'invalid' } } },
      { name: 'non-boolean feature explainer value', body: { preferences: { featureExplainers: { today: 'false' } } } },
      { name: 'invalid push notification mode', body: { preferences: { pushNotificationMode: 'urgent_only' } } },
      { name: 'non-object future option', body: { preferences: { futureOption: true } } },
      { name: 'non-boolean future option flag', body: { preferences: { futureOption: { enabled: 'true' } } } },
    ];

    for (const { name, body } of invalidPayloads) {
      await test.step(`Reject: preference payload ${name}`, async () => {
        await expectRejected(await apiPatchRaw(request, '/api/me/preferences', body, user.token));
      });
    }
  });

  test('updates profile name and email with validation', async ({ request }) => {
    const runId = testRunId();
    const userA = await registerByApi(request, testUser('api-profile-a', runId));
    const userB = await registerByApi(request, testUser('api-profile-b', runId));
    const updatedEmail = `api-profile-updated-${runId}@example.test`;

    await test.step('Act: update profile display name with surrounding whitespace', async () => {
      const updatedName = await expectJson<MePayload>(
        await apiPatchRaw(request, '/api/me/profile', { displayName: '  Neuer Name  ' }, userA.token),
      );
      expectMePayload(updatedName);
      expect(updatedName.user.displayName).toBe('Neuer Name');
      expect(updatedName.user.email).toBe(userA.user.email);
    });

    await test.step('Act: update profile email with normalization', async () => {
      const updatedProfile = await expectJson<MePayload>(
        await apiPatchRaw(request, '/api/me/profile', { email: `  ${updatedEmail.toUpperCase()}  ` }, userA.token),
      );
      expect(updatedProfile.user.email).toBe(updatedEmail);
      expect(updatedProfile.user.displayName).toBe('Neuer Name');
    });

    const invalidPayloads: Array<{ name: string; body: unknown }> = [
      { name: 'empty profile update', body: {} },
      { name: 'unknown field', body: { displayName: 'Name', unexpected: true } },
      { name: 'numeric display name', body: { displayName: 123 } },
      { name: 'blank display name', body: { displayName: '   ' } },
      { name: 'numeric email', body: { email: 123 } },
      { name: 'invalid email format', body: { email: 'keine-email' } },
    ];

    for (const { name, body } of invalidPayloads) {
      await test.step(`Reject: profile payload ${name}`, async () => {
        await expectRejected(await apiPatchRaw(request, '/api/me/profile', body, userA.token));
      });
    }

    await test.step('Reject: duplicate email keeps registered-email domain error', async () => {
      await expectApiError(
        await apiPatchRaw(request, '/api/me/profile', { email: userB.user.email }, userA.token),
        409,
        'auth.emailAlreadyRegistered',
      );
    });

    await test.step('Assert: rejected profile updates did not change persisted profile', async () => {

      const reloaded = await expectJson<MePayload>(await apiGetRaw(request, '/api/me', userA.token));

      expect(reloaded.user.email).toBe(updatedEmail);

      expect(reloaded.user.displayName).toBe('Neuer Name');

    });
  });
});