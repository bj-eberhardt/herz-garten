import { expect, test } from '@playwright/test';
import { adminLogin, jwtPayload } from '../../helpers/adminApi';
import { apiGet, apiGetRaw, apiPostRaw, registerByApi } from '../../helpers/api';
import { expectApiError, expectJson } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

interface AdminLoginPayload {
  token: string;
  usesDefaultAdminPassword: boolean;
}

test.describe('admin api / login', () => {
  test('authenticates admin and returns a scoped admin token', async ({ request }) => {
    const loginResponse = await apiPostRaw(request, '/api/admin/auth/login', { password: 'admin' });
    const login = await expectJson<AdminLoginPayload>(loginResponse);
    expect(Object.keys(login).sort()).toEqual(['token', 'usesDefaultAdminPassword']);
    expect(login.token).toEqual(expect.any(String));
    expect(login.usesDefaultAdminPassword).toBe(true);
    expect(loginResponse.headers()['cache-control']).toContain('no-store');

    const payload = jwtPayload(login.token) as { sub: string; type: string; aud: string; iss: string; iat: number; exp: number };
    expect(payload).toEqual(
      expect.objectContaining({
        sub: 'admin',
        type: 'admin',
        aud: 'herzgarten-admin',
        iss: 'herzgarten',
      }),
    );
    expect(payload.exp).toBeGreaterThan(payload.iat);

    const me = await apiGet<{ admin: boolean; usesDefaultAdminPassword: boolean }>(request, '/api/admin/auth/me', login.token);
    expect(me).toEqual({ admin: true, usesDefaultAdminPassword: true });
    const meRaw = await apiGetRaw(request, '/api/admin/auth/me', login.token);
    expect(meRaw.headers()['cache-control']).toContain('no-store');
  });

  test('rejects invalid login bodies and queries', async ({ request }) => {
    const invalidBodies = [
      {},
      { password: '' },
      { password: '   ' },
      { password: null },
      { password: 123 },
      { password: true },
      { password: 'admin', extra: true },
    ];

    for (const body of invalidBodies) {
      await expectApiError(await apiPostRaw(request, '/api/admin/auth/login', body), 400, 'common.validation');
    }

    await expectApiError(await apiPostRaw(request, '/api/admin/auth/login', { password: 'wrong-password' }), 401, 'auth.invalidCredentials');

    const trimmedPasswordLogin = await expectJson<AdminLoginPayload>(
      await apiPostRaw(request, '/api/admin/auth/login', { password: ' admin ' }),
    );
    expect(trimmedPasswordLogin.token).toEqual(expect.any(String));

    await expectApiError(
      await apiPostRaw(request, '/api/admin/auth/login?unexpected=true', { password: 'admin' }),
      400,
      'common.validation',
    );
  });

  test('rejects invalid auth-me queries and tokens', async ({ request }) => {
    const token = await adminLogin(request);

    await expectApiError(await apiGetRaw(request, '/api/admin/auth/me?unexpected=true', token), 400, 'common.validation');
    await expectApiError(await apiGetRaw(request, '/api/admin/auth/me'), 401, 'auth.missingToken');
    await expectApiError(await apiGetRaw(request, '/api/admin/auth/me', 'invalid-token'), 401, 'auth.invalidToken');

    const user = testUser('admin-normal-user', testRunId());
    const auth = await registerByApi(request, user);
    await expectApiError(await apiGetRaw(request, '/api/admin/auth/me', auth.token), 401, 'auth.invalidToken');
    await expectApiError(await apiGetRaw(request, '/api/admin/overview'), 401, 'auth.missingToken');
    await expectApiError(await apiGetRaw(request, '/api/admin/overview', auth.token), 401, 'auth.invalidToken');
  });
});