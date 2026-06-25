import { expect, test } from '@playwright/test';
import { adminLogin } from '../../helpers/adminApi';
import { apiGet, apiGetRaw, apiPostRaw, registerByApi } from '../../helpers/api';
import { expectApiError } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('admin api / login', () => {
  test('authenticates admin and rejects invalid tokens', async ({ request }) => {
    await test.step('Flow: authenticates admin and rejects invalid tokens', async () => {
      const token = await adminLogin(request);
      const me = await apiGet<{ admin: boolean; usesDefaultAdminPassword: boolean; }>(request, '/api/admin/auth/me', token);
      await test.step('Verify expected result', async () => {
        expect(me.admin).toBe(true);
      });
      await test.step('Verify expected result', async () => {
        expect(me.usesDefaultAdminPassword).toBe(true);
      });
      const meRaw = await apiGetRaw(request, '/api/admin/auth/me', token);
      await test.step('Verify expected result', async () => {
        expect(meRaw.headers()['cache-control']).toContain('no-store');
      });

      const invalidLogin = await apiPostRaw(request, '/api/admin/auth/login', { password: 'wrong-password' });
      await test.step('Verify API error response', async () => {
        await expectApiError(invalidLogin, 401, 'auth.invalidCredentials');
      });

      const missingToken = await apiGetRaw(request, '/api/admin/overview');
      await test.step('Verify API error response', async () => {
        await expectApiError(missingToken, 401, 'auth.missingToken');
      });

      const user = testUser('admin-normal-user', testRunId());
      const auth = await registerByApi(request, user);
      const userTokenResponse = await apiGetRaw(request, '/api/admin/overview', auth.token);
      await test.step('Verify API error response', async () => {
        await expectApiError(userTokenResponse, 401, 'auth.invalidToken');
      });
    });
  });
});
