import { expect, test } from '@playwright/test';

import { apiPostRaw } from '../../helpers/api';
import { expectApiError, expectAuthPayload, expectJson, type AuthPayload } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / auth', () => {
  test('registers and logs in a user', async ({ request }) => {
    await test.step('Flow: registers and logs in a user', async () => {
      const user = testUser('api-auth', testRunId());
      let registered!: AuthPayload;

      await test.step('Arrange/Act: register a new user', async () => {
        registered = await expectJson<AuthPayload>(await apiPostRaw(request, '/api/auth/register', user), 201);
      });

      await test.step('Assert: registration returns normalized auth payload', async () => {

        expectAuthPayload(registered);

        expect(registered.user.email).toBe(user.email);

      });

      let loggedIn!: AuthPayload;
      await test.step('Act: log in with case-insensitive email', async () => {
        loggedIn = await expectJson<AuthPayload>(
          await apiPostRaw(request, '/api/auth/login', {
            email: user.email.toUpperCase(),
            password: user.password,
          }),
        );
      });

      await test.step('Assert: login returns the same user', async () => {

        expectAuthPayload(loggedIn);

        expect(loggedIn.user.id).toBe(registered.user.id);

      });
    });
  });

  test('rejects invalid registration input', async ({ request }) => {
    await test.step('Flow: rejects invalid registration input', async () => {
      await test.step('Assert: rejects missing required registration fields', async () => {
        await expectApiError(await apiPostRaw(request, '/api/auth/register', {}), 400, 'auth.registrationInvalid');
      });

      await test.step('Assert: rejects empty email and short password', async () => {

        await expectApiError(

        await apiPostRaw(request, '/api/auth/register', {

        email: '',

        displayName: 'Invalid',

        password: 'short',

        }),

        400,

        'auth.registrationInvalid',

        );

      });

      await test.step('Assert: rejects unexpected registration fields', async () => {

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

      await test.step('Assert: rejects wrong registration field types', async () => {

        await expectApiError(

        await apiPostRaw(request, '/api/auth/register', {

        email: 123,

        displayName: 'Typed',

        password: 'password-123',

        }),

        400,

        'common.validation',

        );

      });
    });
  });

  test('rejects duplicate email registration', async ({ request }) => {
    await test.step('Flow: rejects duplicate email registration', async () => {
      const user = testUser('api-duplicate', testRunId());

      await test.step('Arrange: register the user once', async () => {
        await expectJson<AuthPayload>(await apiPostRaw(request, '/api/auth/register', user), 201);
      });

      await test.step('Assert: registering the same email again is rejected', async () => {

        await expectApiError(await apiPostRaw(request, '/api/auth/register', user), 409, 'auth.emailAlreadyRegistered');

      });
    });
  });

  test('rejects invalid login input and credentials', async ({ request }) => {
    await test.step('Flow: rejects invalid login input and credentials', async () => {
      const user = testUser('api-invalid-login', testRunId());

      await test.step('Arrange: register a user for credential checks', async () => {
        await expectJson<AuthPayload>(await apiPostRaw(request, '/api/auth/register', user), 201);
      });

      await test.step('Assert: rejects missing login fields', async () => {

        await expectApiError(await apiPostRaw(request, '/api/auth/login', {}), 400, 'auth.registrationInvalid');

      });

      await test.step('Assert: rejects empty login fields', async () => {

        await expectApiError(

        await apiPostRaw(request, '/api/auth/login', { email: '', password: '' }),

        400,

        'auth.registrationInvalid',

        );

      });

      await test.step('Assert: rejects unexpected login fields', async () => {

        await expectApiError(

        await apiPostRaw(request, '/api/auth/login', { email: user.email, password: user.password, unexpected: true }),

        400,

        'common.validation',

        );

      });

      await test.step('Assert: rejects wrong login field types', async () => {

        await expectApiError(

        await apiPostRaw(request, '/api/auth/login', { email: user.email, password: 123 }),

        400,

        'common.validation',

        );

      });

      await test.step('Assert: rejects wrong password', async () => {

        await expectApiError(

        await apiPostRaw(request, '/api/auth/login', { email: user.email, password: 'wrong-password' }),

        401,

        'auth.invalidCredentials',

        );

      });
    });
  });

  test('rejects unexpected query parameters on auth endpoints', async ({ request }) => {
    await test.step('Flow: rejects unexpected query parameters on auth endpoints', async () => {
      const user = testUser('api-auth-query', testRunId());

      await test.step('Assert: rejects query params on register', async () => {
        await expectApiError(await apiPostRaw(request, '/api/auth/register?unexpected=true', user), 400, 'common.validation');
      });

      await test.step('Assert: rejects query params on login', async () => {

        await expectApiError(

        await apiPostRaw(request, '/api/auth/login?unexpected=true', { email: user.email, password: user.password }),

        400,

        'common.validation',

        );

      });

      await test.step('Assert: rejects query params on forgot-password', async () => {

        await expectApiError(

        await apiPostRaw(request, '/api/auth/forgot-password?unexpected=true', { email: user.email }),

        400,

        'rejected',

        );

      });

      await test.step('Assert: rejects query params on reset-password', async () => {

        await expectApiError(

        await apiPostRaw(request, '/api/auth/reset-password?unexpected=true', { token: 'x'.repeat(32), password: user.password }),

        400,

        'rejected',

        );

      });
    });
  });
});


