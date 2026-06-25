import { expect, test } from '@playwright/test';
import { adminLogin, emailSettingsInput, jwtPayload } from '../../helpers/adminApi';
import { apiGet, apiPatchRaw, registerByApi } from '../../helpers/api';
import { expectApiError, expectJson } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('admin api / settings', () => {
  test('manages auth settings and applies jwt ttl to new tokens', async ({ request }) => {
    await test.step('Flow: manages auth settings and applies jwt ttl to new tokens', async () => {
      const token = await adminLogin(request);
      const original = await apiGet<{
        auth: { adminJwtTtlMinutes: number; userJwtTtlMinutes: number; };
        server: { publicBaseUrl: string; };
        passwordReset: { ttlMinutes: number; limitPer24h: number; };
        email: {
          enabled: boolean;
          smtpHost: string;
          smtpPort: number;
          smtpSecure: boolean;
          smtpUser: string;
          smtpPasswordConfigured: boolean;
          fromAddress: string;
          fromName: string;
          replyTo: string;
        };
      }>(request, '/api/admin/settings', token);

      await test.step('Verify expected result', async () => {
        expect(original.auth.adminJwtTtlMinutes).toBeGreaterThanOrEqual(1);
      });
      await test.step('Verify expected result', async () => {
        expect(original.auth.adminJwtTtlMinutes).toBeLessThanOrEqual(1440);
      });
      await test.step('Verify expected result', async () => {
        expect(original.auth.userJwtTtlMinutes).toBeGreaterThanOrEqual(1);
      });
      await test.step('Verify expected result', async () => {
        expect(original.auth.userJwtTtlMinutes).toBeLessThanOrEqual(43200);
      });
      const originalEmailInput = emailSettingsInput(original.email);

      const invalidSettingsPayloads = [
        {},
        { auth: {} },
        { auth: { userJwtTtlMinutes: original.auth.userJwtTtlMinutes } },
        { auth: { adminJwtTtlMinutes: original.auth.adminJwtTtlMinutes } },
        { auth: { adminJwtTtlMinutes: 0, userJwtTtlMinutes: original.auth.userJwtTtlMinutes }, server: original.server, passwordReset: original.passwordReset, email: originalEmailInput },
        { auth: { adminJwtTtlMinutes: -1, userJwtTtlMinutes: original.auth.userJwtTtlMinutes }, server: original.server, passwordReset: original.passwordReset, email: originalEmailInput },
        { auth: { adminJwtTtlMinutes: 60.5, userJwtTtlMinutes: original.auth.userJwtTtlMinutes }, server: original.server, passwordReset: original.passwordReset, email: originalEmailInput },
        { auth: { adminJwtTtlMinutes: 1441, userJwtTtlMinutes: original.auth.userJwtTtlMinutes }, server: original.server, passwordReset: original.passwordReset, email: originalEmailInput },
        { auth: { adminJwtTtlMinutes: original.auth.adminJwtTtlMinutes, userJwtTtlMinutes: 0 }, server: original.server, passwordReset: original.passwordReset, email: originalEmailInput },
        { auth: { adminJwtTtlMinutes: original.auth.adminJwtTtlMinutes, userJwtTtlMinutes: -1 }, server: original.server, passwordReset: original.passwordReset, email: originalEmailInput },
        { auth: { adminJwtTtlMinutes: original.auth.adminJwtTtlMinutes, userJwtTtlMinutes: 60.5 }, server: original.server, passwordReset: original.passwordReset, email: originalEmailInput },
        { auth: { adminJwtTtlMinutes: original.auth.adminJwtTtlMinutes, userJwtTtlMinutes: 43201 }, server: original.server, passwordReset: original.passwordReset, email: originalEmailInput },
        { auth: original.auth, server: { publicBaseUrl: 'not-a-url' }, passwordReset: original.passwordReset, email: originalEmailInput },
        { auth: original.auth, server: original.server, passwordReset: { ...original.passwordReset, ttlMinutes: 1441 }, email: originalEmailInput },
        { auth: original.auth, server: original.server, passwordReset: { ...original.passwordReset, limitPer24h: 0 }, email: originalEmailInput },
        { auth: original.auth, server: original.server, passwordReset: original.passwordReset, email: { ...originalEmailInput, enabled: true, smtpHost: '' } },
        { auth: original.auth, server: original.server, passwordReset: original.passwordReset, email: { ...originalEmailInput, smtpPort: 0 } },
        { auth: original.auth, server: original.server, passwordReset: original.passwordReset, email: { ...originalEmailInput, enabled: true, fromAddress: '' } },
        { auth: original.auth, server: original.server, passwordReset: original.passwordReset, email: { ...originalEmailInput, replyTo: 'not-an-email' } },
      ];

      for (const payload of invalidSettingsPayloads) {
        await expectApiError(await apiPatchRaw(request, '/api/admin/settings', payload, token), 400, 'common.validation');
      }

      const next = {
        auth: {
          adminJwtTtlMinutes: 61,
          userJwtTtlMinutes: 10081,
        },
        server: {
          publicBaseUrl: 'http://localhost:5174',
        },
        passwordReset: {
          ttlMinutes: 1440,
          limitPer24h: 5,
        },
        email: {
          ...originalEmailInput,
          enabled: true,
          smtpHost: 'mailpit',
          smtpPort: 1025,
          smtpSecure: false,
          fromAddress: 'noreply@herzgarten.test',
          fromName: 'Herzgarten',
          replyTo: '',
        },
      };

      try {
        const saved = await expectJson<typeof next>(await apiPatchRaw(request, '/api/admin/settings', next, token));
        expect(saved).toEqual({ ...next, email: { ...next.email, smtpPasswordConfigured: expect.any(Boolean) } });
        expect('smtpPassword' in saved.email).toBe(false);

        const adminToken = await adminLogin(request);
        const adminPayload = jwtPayload(adminToken);
        expect(adminPayload.exp - adminPayload.iat).toBe(61 * 60);

        const auth = await registerByApi(request, testUser('settings-ttl-user', testRunId()));
        const userPayload = jwtPayload(auth.token);
        expect(userPayload.exp - userPayload.iat).toBe(10081 * 60);

        const audit = await apiGet<{ items: Array<{ action: string; resourceType: string; }>; }>(
          request,
          '/api/admin/audit-log',
          token,
        );
        expect(audit.items.some((entry) => entry.action === 'update' && entry.resourceType === 'app-settings')).toBe(true);
      } finally {
        await apiPatchRaw(request, '/api/admin/settings', { auth: original.auth, server: original.server, passwordReset: original.passwordReset, email: originalEmailInput }, token);
      }
    });
  });
});
