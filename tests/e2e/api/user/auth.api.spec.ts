import { expect, test } from '@playwright/test';

import { apiPostRaw } from '../../helpers/api';

import {
  expectApiError,

  expectAuthPayload,

  expectJson,

  type AuthPayload,
} from '../../helpers/apiAssertions';

import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / auth', () => {
  test('registers and logs in a user', async ({ request }) => {
    await test.step('Flow: registers and logs in a user', async () => {
      const user = testUser('api-auth', testRunId());

      const registerResponse = await apiPostRaw(request, '/api/auth/register', user);
      const registerPayload = await expectJson<AuthPayload>(registerResponse, 201);
      expectAuthPayload(registerPayload);
      await test.step('Verify expected result', async () => {
        expect(registerPayload.user.email).toBe(user.email);
      });

      const loginResponse = await apiPostRaw(request, '/api/auth/login', {
        email: user.email.toUpperCase(),
        password: user.password,
      });
      const loginPayload = await expectJson<AuthPayload>(loginResponse);
      expectAuthPayload(loginPayload);
      await test.step('Verify expected result', async () => {
        expect(loginPayload.user.id).toBe(registerPayload.user.id);
      });
    });
  });

  test('rejects invalid registration input', async ({ request }) => {
    await test.step('Flow: rejects invalid registration input', async () => {
      await test.step('Verify API error response', async () => {
        await expectApiError(await apiPostRaw(request, '/api/auth/register', {}), 400, 'auth.registrationInvalid');
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/auth/register', {
            email: 'extra@example.test',
            displayName: 'Extra',
            password: 'password-123',
            unexpected: true,
          }),
          400,
          'common.validation',
        );
      });

      const response = await apiPostRaw(request, '/api/auth/register', {
        email: '',
        displayName: 'Invalid',
        password: 'short',
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(response, 400, 'auth.registrationInvalid');
      });
    });
  });

  test('rejects duplicate email registration', async ({ request }) => {
    await test.step('Flow: rejects duplicate email registration', async () => {
      const user = testUser('api-duplicate', testRunId());
      await test.step('Verify JSON response payload', async () => {
        await expectJson<AuthPayload>(await apiPostRaw(request, '/api/auth/register', user), 201);
      });

      const response = await apiPostRaw(request, '/api/auth/register', user);

      await test.step('Verify API error response', async () => {
        await expectApiError(response, 409, 'auth.emailAlreadyRegistered');
      });
    });
  });

  test('rejects invalid login credentials', async ({ request }) => {
    await test.step('Flow: rejects invalid login credentials', async () => {
      const user = testUser('api-invalid-login', testRunId());
      await test.step('Verify JSON response payload', async () => {
        await expectJson<AuthPayload>(await apiPostRaw(request, '/api/auth/register', user), 201);
      });

      const response = await apiPostRaw(request, '/api/auth/login', {
        email: user.email,
        password: 'wrong-password',
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(response, 401, 'auth.invalidCredentials');
      });
    });
  });

  test('rejects incomplete login input', async ({ request }) => {
    await test.step('Flow: rejects incomplete login input', async () => {
      await test.step('Verify API error response', async () => {
        await expectApiError(await apiPostRaw(request, '/api/auth/login', {}), 400, 'auth.registrationInvalid');
      });

      const response = await apiPostRaw(request, '/api/auth/login', {
        email: '',
        password: '',
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(response, 400, 'auth.registrationInvalid');
      });
    });
  });
});
