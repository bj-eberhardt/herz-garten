import { expect, test } from '@playwright/test';

import {
  apiPatchRaw,

  apiPostRaw,
  registerByApi
} from '../../helpers/api';

import {
  expectApiError,
  expectJson,
  type AuthPayload
} from '../../helpers/apiAssertions';

import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / password change', () => {
  test('updates password and requires the current password', async ({ request }) => {
    await test.step('Flow: updates password and requires the current password', async () => {
      const user = testUser('api-password', testRunId());
      const registered = await registerByApi(request, user);
      const nextPassword = 'new-password-123';

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPatchRaw(
            request,
            '/api/me/password',
            { currentPassword: 'wrong-password', newPassword: nextPassword },
            registered.token,
          ),
          400,
          'profile.passwordInvalid',
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPatchRaw(
            request,
            '/api/me/password',
            { currentPassword: user.password, newPassword: 'short' },
            registered.token,
          ),
          400,
          'common.validation',
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPatchRaw(request, '/api/me/password', { currentPassword: user.password }, registered.token),
          400,
          'common.validation',
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPatchRaw(
            request,
            '/api/me/password',
            { currentPassword: user.password, newPassword: nextPassword, unexpected: true },
            registered.token,
          ),
          400,
          'common.validation',
        );
      });

      const updateResponse = await apiPatchRaw(
        request,
        '/api/me/password',
        { currentPassword: user.password, newPassword: nextPassword },
        registered.token,
      );
      await test.step('Verify expected result', async () => {
        expect(updateResponse.status()).toBe(204);
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/auth/login', { email: user.email, password: user.password }),
          401,
          'auth.invalidCredentials',
        );
      });
      const loginPayload = await expectJson<AuthPayload>(
        await apiPostRaw(request, '/api/auth/login', { email: user.email, password: nextPassword }),
      );
      await test.step('Verify expected result', async () => {
        expect(loginPayload.user.id).toBe(registered.user.id);
      });
    });
  });
});
