import { expect, test } from '@playwright/test';
import { apiPostRaw } from '../helpers/api';
import {
  expectApiError,
  expectAuthPayload,
  expectJson,
  type AuthPayload,
} from '../helpers/apiAssertions';
import { testRunId, testUser } from '../helpers/testUsers';

test.describe('auth api', () => {
  test('registers and logs in a user', async ({ request }) => {
    const user = testUser('api-auth', testRunId());

    const registerResponse = await apiPostRaw(request, '/api/auth/register', user);
    const registerPayload = await expectJson<AuthPayload>(registerResponse, 201);
    expectAuthPayload(registerPayload);
    expect(registerPayload.user.email).toBe(user.email);

    const loginResponse = await apiPostRaw(request, '/api/auth/login', {
      email: user.email.toUpperCase(),
      password: user.password,
    });
    const loginPayload = await expectJson<AuthPayload>(loginResponse);
    expectAuthPayload(loginPayload);
    expect(loginPayload.user.id).toBe(registerPayload.user.id);
  });

  test('rejects invalid registration input', async ({ request }) => {
    await expectApiError(await apiPostRaw(request, '/api/auth/register', {}), 400, 'auth.registrationInvalid');

    const response = await apiPostRaw(request, '/api/auth/register', {
      email: '',
      displayName: 'Invalid',
      password: 'short',
    });

    await expectApiError(response, 400, 'auth.registrationInvalid');
  });

  test('rejects duplicate email registration', async ({ request }) => {
    const user = testUser('api-duplicate', testRunId());
    await expectJson<AuthPayload>(await apiPostRaw(request, '/api/auth/register', user), 201);

    const response = await apiPostRaw(request, '/api/auth/register', user);

    await expectApiError(response, 409, 'auth.emailAlreadyRegistered');
  });

  test('rejects invalid login credentials', async ({ request }) => {
    const user = testUser('api-invalid-login', testRunId());
    await expectJson<AuthPayload>(await apiPostRaw(request, '/api/auth/register', user), 201);

    const response = await apiPostRaw(request, '/api/auth/login', {
      email: user.email,
      password: 'wrong-password',
    });

    await expectApiError(response, 401, 'auth.invalidCredentials');
  });

  test('rejects incomplete login input', async ({ request }) => {
    await expectApiError(await apiPostRaw(request, '/api/auth/login', {}), 400, 'auth.registrationInvalid');

    const response = await apiPostRaw(request, '/api/auth/login', {
      email: '',
      password: '',
    });

    await expectApiError(response, 400, 'auth.registrationInvalid');
  });
});
