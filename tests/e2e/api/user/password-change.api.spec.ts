import { expect, test, type APIResponse } from '@playwright/test';

import { apiPatchRaw, apiPostRaw, registerByApi } from '../../helpers/api';
import { expectApiError, expectJson, type AuthPayload } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

async function expectRejected(response: APIResponse) {
  await expectApiError(response, 400, 'rejected');
}

test.describe('user api / password change', () => {
  test('rejects missing auth token', async ({ request }) => {
    await test.step('Reject: change password without auth token', async () => {
      await expectApiError(
        await apiPatchRaw(request, '/api/me/password', {
          currentPassword: 'password-123',
          newPassword: 'new-password-123',
        }),
        401,
        'auth.missingToken',
      );
    });
  });

  test('rejects invalid query parameters', async ({ request }) => {
    const user = testUser('api-password-query', testRunId());
    const registered = await registerByApi(request, user);

    await test.step('Reject: change password with unexpected query parameter', async () => {
      await expectRejected(
        await apiPatchRaw(
          request,
          '/api/me/password?unexpected=true',
          { currentPassword: user.password, newPassword: 'new-password-123' },
          registered.token,
        ),
      );
    });
  });

  test('rejects invalid payload shapes and boundaries', async ({ request }) => {
    const user = testUser('api-password-invalid', testRunId());
    const registered = await registerByApi(request, user);

    const invalidPayloads: Array<{ name: string; body: unknown }> = [
      { name: 'missing current password', body: { newPassword: 'new-password-123' } },
      { name: 'missing new password', body: { currentPassword: user.password } },
      { name: 'unexpected field', body: { currentPassword: user.password, newPassword: 'new-password-123', unexpected: true } },
      { name: 'numeric current password', body: { currentPassword: 123, newPassword: 'new-password-123' } },
      { name: 'numeric new password', body: { currentPassword: user.password, newPassword: 123 } },
      { name: 'blank current password', body: { currentPassword: '   ', newPassword: 'new-password-123' } },
      { name: 'short new password', body: { currentPassword: user.password, newPassword: 'short' } },
    ];

    for (const { name, body } of invalidPayloads) {
      await test.step(`Reject: password payload ${name}`, async () => {
        await expectRejected(await apiPatchRaw(request, '/api/me/password', body, registered.token));
      });
    }
  });

  test('keeps domain error for wrong current password', async ({ request }) => {
    const user = testUser('api-password-wrong-current', testRunId());
    const registered = await registerByApi(request, user);

    await test.step('Reject: wrong current password keeps profile password error', async () => {
      await expectApiError(
        await apiPatchRaw(
          request,
          '/api/me/password',
          { currentPassword: 'wrong-password', newPassword: 'new-password-123' },
          registered.token,
        ),
        400,
        'profile.passwordInvalid',
      );
    });
  });

  test('updates password and invalidates the old login', async ({ request }) => {
    const user = testUser('api-password-success', testRunId());
    const registered = await registerByApi(request, user);
    const nextPassword = 'new-password-123';

    await test.step('Act: change password with minimum valid new password length', async () => {
      const updateResponse = await apiPatchRaw(
        request,
        '/api/me/password',
        { currentPassword: user.password, newPassword: nextPassword },
        registered.token,
      );
      expect(updateResponse.status()).toBe(204);
    });

    await test.step('Assert: old password no longer logs in', async () => {

      await expectApiError(

      await apiPostRaw(request, '/api/auth/login', { email: user.email, password: user.password }),

      401,

      'auth.invalidCredentials',

      );

    });

    await test.step('Assert: new password logs in as the same user', async () => {

      const loginPayload = await expectJson<AuthPayload>(

      await apiPostRaw(request, '/api/auth/login', { email: user.email, password: nextPassword }),

      );

      expect(loginPayload.user.id).toBe(registered.user.id);

    });
  });
});
