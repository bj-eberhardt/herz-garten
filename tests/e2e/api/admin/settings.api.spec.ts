import { expect, test } from '@playwright/test';
import { adminLogin, emailSettingsInput, jwtPayload } from '../../helpers/adminApi';
import { apiGet, apiGetRaw, apiPatchRaw, registerByApi } from '../../helpers/api';
import { expectApiError, expectJson } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

interface AdminSettingsPayload {
  auth: { adminJwtTtlMinutes: number; userJwtTtlMinutes: number };
  server: { publicBaseUrl: string };
  passwordReset: { ttlMinutes: number; limitPer24h: number };
  email: {
    enabled: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    smtpPassword?: string;
    smtpPasswordConfigured?: boolean;
    fromAddress: string;
    fromName: string;
    replyTo: string;
  };
}

type AdminSettingsInput = Omit<AdminSettingsPayload, 'email'> & {
  email: Omit<AdminSettingsPayload['email'], 'smtpPasswordConfigured'>;
};

type AdminSettingsOverrides = {
  auth?: Partial<AdminSettingsInput['auth']>;
  server?: Partial<AdminSettingsInput['server']>;
  passwordReset?: Partial<AdminSettingsInput['passwordReset']>;
  email?: Partial<AdminSettingsInput['email']>;
};

const long = (length: number) => 'x'.repeat(length);

function settingsInput(payload: AdminSettingsPayload): AdminSettingsInput {
  return {
    auth: { ...payload.auth },
    server: { ...payload.server },
    passwordReset: { ...payload.passwordReset },
    email: emailSettingsInput(payload.email),
  };
}

function validSettingsPayload(original: AdminSettingsPayload, overrides: AdminSettingsOverrides = {}): AdminSettingsInput {
  const base = settingsInput(original);
  return {
    auth: { ...base.auth, ...overrides.auth },
    server: { ...base.server, ...overrides.server },
    passwordReset: { ...base.passwordReset, ...overrides.passwordReset },
    email: { ...base.email, ...overrides.email },
  };
}

async function getSettings(request: Parameters<typeof apiGet>[0], token: string) {
  return apiGet<AdminSettingsPayload>(request, '/api/admin/settings', token);
}

function expectSettingsResponse(payload: AdminSettingsPayload) {
  expect(payload.auth.adminJwtTtlMinutes).toBeGreaterThanOrEqual(1);
  expect(payload.auth.adminJwtTtlMinutes).toBeLessThanOrEqual(1440);
  expect(payload.auth.userJwtTtlMinutes).toBeGreaterThanOrEqual(1);
  expect(payload.auth.userJwtTtlMinutes).toBeLessThanOrEqual(43200);
  expect(payload.passwordReset.ttlMinutes).toBeGreaterThanOrEqual(15);
  expect(payload.passwordReset.ttlMinutes).toBeLessThanOrEqual(1440);
  expect(payload.passwordReset.limitPer24h).toBeGreaterThanOrEqual(1);
  expect(payload.passwordReset.limitPer24h).toBeLessThanOrEqual(100);
  expect(payload.email.smtpPasswordConfigured).toEqual(expect.any(Boolean));
  expect('smtpPassword' in payload.email).toBe(false);
}

async function saveSettings(request: Parameters<typeof apiPatchRaw>[0], token: string, payload: AdminSettingsInput) {
  const saved = await expectJson<AdminSettingsPayload>(await apiPatchRaw(request, '/api/admin/settings', payload, token));
  expectSettingsResponse(saved);
  return saved;
}

test.describe('admin api / settings', () => {
  test.describe.configure({ mode: 'serial' });

  test('returns settings without private email secrets', async ({ request }) => {
    const token = await adminLogin(request);
    const settings = await getSettings(request, token);

    expectSettingsResponse(settings);
    expect(settings.server.publicBaseUrl).toEqual(expect.any(String));
    expect(settings.email.smtpHost).toEqual(expect.any(String));
  });

  test('rejects invalid auth and query parameters', async ({ request }) => {
    const token = await adminLogin(request);
    const original = await getSettings(request, token);
    const validPayload = validSettingsPayload(original);

    await expectApiError(await apiGetRaw(request, '/api/admin/settings'), 401, 'auth.missingToken');
    await expectApiError(await apiGetRaw(request, '/api/admin/settings', 'not-a-token'), 401, 'auth.invalidToken');
    await expectApiError(await apiPatchRaw(request, '/api/admin/settings', validPayload), 401, 'auth.missingToken');
    await expectApiError(await apiPatchRaw(request, '/api/admin/settings', validPayload, 'not-a-token'), 401, 'auth.invalidToken');

    await expectApiError(await apiGetRaw(request, '/api/admin/settings?unexpected=true', token), 400, 'common.validation');
    await expectApiError(await apiPatchRaw(request, '/api/admin/settings?unexpected=true', validPayload, token), 400, 'common.validation');
  });

  test('rejects invalid settings payload shapes', async ({ request }) => {
    const token = await adminLogin(request);
    const original = await getSettings(request, token);
    const validPayload = validSettingsPayload(original);
    const invalidPayloads = [
      {},
      { ...validPayload, extra: true },
      { ...validPayload, auth: null },
      { ...validPayload, server: null },
      { ...validPayload, passwordReset: null },
      { ...validPayload, email: null },
      { ...validPayload, auth: { ...validPayload.auth, extra: true } },
      { ...validPayload, server: { ...validPayload.server, extra: true } },
      { ...validPayload, passwordReset: { ...validPayload.passwordReset, extra: true } },
      { ...validPayload, email: { ...validPayload.email, extra: true } },
      { server: validPayload.server, passwordReset: validPayload.passwordReset, email: validPayload.email },
      { auth: validPayload.auth, passwordReset: validPayload.passwordReset, email: validPayload.email },
      { auth: validPayload.auth, server: validPayload.server, email: validPayload.email },
      { auth: validPayload.auth, server: validPayload.server, passwordReset: validPayload.passwordReset },
      { ...validPayload, auth: { ...validPayload.auth, adminJwtTtlMinutes: '60' } },
      { ...validPayload, auth: { ...validPayload.auth, userJwtTtlMinutes: '10080' } },
      { ...validPayload, passwordReset: { ...validPayload.passwordReset, ttlMinutes: '30' } },
      { ...validPayload, passwordReset: { ...validPayload.passwordReset, limitPer24h: '3' } },
      { ...validPayload, email: { ...validPayload.email, enabled: 'true' } },
      { ...validPayload, email: { ...validPayload.email, smtpPort: '1025' } },
      { ...validPayload, email: { ...validPayload.email, smtpSecure: 'false' } },
      { ...validPayload, email: { ...validPayload.email, smtpHost: null } },
      { ...validPayload, email: { ...validPayload.email, smtpUser: null } },
      { ...validPayload, email: { ...validPayload.email, smtpPassword: null } },
      { ...validPayload, email: { ...validPayload.email, fromAddress: null } },
      { ...validPayload, email: { ...validPayload.email, fromName: null } },
      { ...validPayload, email: { ...validPayload.email, replyTo: null } },
    ];

    for (const payload of invalidPayloads) {
      await expectApiError(await apiPatchRaw(request, '/api/admin/settings', payload, token), 400, 'common.validation');
    }
  });

  test('validates settings boundaries and bounded strings', async ({ request }) => {
    const token = await adminLogin(request);
    const original = await getSettings(request, token);
    const validEnabledEmail = {
      enabled: true,
      smtpHost: 'mailpit',
      smtpPort: 1025,
      smtpSecure: false,
      smtpUser: '',
      fromAddress: 'noreply@herzgarten.test',
      fromName: 'Herzgarten',
      replyTo: '',
    };

    const invalidPayloads = [
      validSettingsPayload(original, { auth: { adminJwtTtlMinutes: 0 } }),
      validSettingsPayload(original, { auth: { adminJwtTtlMinutes: 1441 } }),
      validSettingsPayload(original, { auth: { adminJwtTtlMinutes: 60.5 } }),
      validSettingsPayload(original, { auth: { userJwtTtlMinutes: 0 } }),
      validSettingsPayload(original, { auth: { userJwtTtlMinutes: 43201 } }),
      validSettingsPayload(original, { auth: { userJwtTtlMinutes: 60.5 } }),
      validSettingsPayload(original, { passwordReset: { ttlMinutes: 14 } }),
      validSettingsPayload(original, { passwordReset: { ttlMinutes: 1441 } }),
      validSettingsPayload(original, { passwordReset: { ttlMinutes: 30.5 } }),
      validSettingsPayload(original, { passwordReset: { limitPer24h: 0 } }),
      validSettingsPayload(original, { passwordReset: { limitPer24h: 101 } }),
      validSettingsPayload(original, { passwordReset: { limitPer24h: 3.5 } }),
      validSettingsPayload(original, { server: { publicBaseUrl: 'not-a-url' } }),
      validSettingsPayload(original, { server: { publicBaseUrl: 'ftp://localhost/reset' } }),
      validSettingsPayload(original, { server: { publicBaseUrl: '' } }),
      validSettingsPayload(original, { server: { publicBaseUrl: `https://example.test/${long(2040)}` } }),
      validSettingsPayload(original, { email: { ...validEnabledEmail, smtpPort: 0 } }),
      validSettingsPayload(original, { email: { ...validEnabledEmail, smtpPort: 65536 } }),
      validSettingsPayload(original, { email: { ...validEnabledEmail, smtpPort: 1025.5 } }),
      validSettingsPayload(original, { email: { ...validEnabledEmail, smtpHost: long(256) } }),
      validSettingsPayload(original, { email: { ...validEnabledEmail, smtpUser: long(321) } }),
      validSettingsPayload(original, { email: { ...validEnabledEmail, smtpPassword: long(1025) } }),
      validSettingsPayload(original, { email: { ...validEnabledEmail, fromAddress: `${long(310)}@example.test` } }),
      validSettingsPayload(original, { email: { ...validEnabledEmail, fromName: long(121) } }),
      validSettingsPayload(original, { email: { ...validEnabledEmail, replyTo: `${long(310)}@example.test` } }),
    ];

    for (const payload of invalidPayloads) {
      await expectApiError(await apiPatchRaw(request, '/api/admin/settings', payload, token), 400, 'common.validation');
    }

    try {
      for (const payload of [
        validSettingsPayload(original, {
          auth: { adminJwtTtlMinutes: 1, userJwtTtlMinutes: 1 },
          server: { publicBaseUrl: 'https://localhost:5174' },
          passwordReset: { ttlMinutes: 15, limitPer24h: 1 },
          email: { ...validEnabledEmail, smtpPort: 1, smtpHost: 'm', fromName: 'H' },
        }),
        validSettingsPayload(original, {
          auth: { adminJwtTtlMinutes: 1440, userJwtTtlMinutes: 43200 },
          server: { publicBaseUrl: 'http://localhost:5174' },
          passwordReset: { ttlMinutes: 1440, limitPer24h: 100 },
          email: { ...validEnabledEmail, smtpPort: 65535, smtpHost: long(255), smtpUser: long(320), fromName: long(120) },
        }),
      ]) {
        await saveSettings(request, token, payload);
      }
    } finally {
      await apiPatchRaw(request, '/api/admin/settings', settingsInput(original), token);
    }
  });

  test('validates email requirements based on enabled flag', async ({ request }) => {
    const token = await adminLogin(request);
    const original = await getSettings(request, token);
    const validEnabledEmail = {
      enabled: true,
      smtpHost: 'mailpit',
      smtpPort: 1025,
      smtpSecure: false,
      smtpUser: '',
      fromAddress: 'noreply@herzgarten.test',
      fromName: 'Herzgarten',
      replyTo: '',
    };

    for (const payload of [
      validSettingsPayload(original, { email: { ...validEnabledEmail, smtpHost: '' } }),
      validSettingsPayload(original, { email: { ...validEnabledEmail, fromAddress: '' } }),
      validSettingsPayload(original, { email: { ...validEnabledEmail, fromAddress: 'not-an-email' } }),
      validSettingsPayload(original, { email: { ...validEnabledEmail, replyTo: 'not-an-email' } }),
    ]) {
      await expectApiError(await apiPatchRaw(request, '/api/admin/settings', payload, token), 400, 'common.validation');
    }

    try {
      const disabledEmail = await saveSettings(
        request,
        token,
        validSettingsPayload(original, {
          email: {
            ...validEnabledEmail,
            enabled: false,
            smtpHost: '',
            fromAddress: '',
            replyTo: '',
          },
        }),
      );
      expect(disabledEmail.email.enabled).toBe(false);
      expect(disabledEmail.email.smtpHost).toBe('');
      expect(disabledEmail.email.fromAddress).toBe('');

      const enabledEmail = await saveSettings(request, token, validSettingsPayload(original, { email: validEnabledEmail }));
      expect(enabledEmail.email.enabled).toBe(true);
      expect(enabledEmail.email.replyTo).toBe('');
    } finally {
      await apiPatchRaw(request, '/api/admin/settings', settingsInput(original), token);
    }
  });

  test('persists settings, applies jwt ttl and keeps smtp password private', async ({ request }) => {
    const token = await adminLogin(request);
    const original = await getSettings(request, token);
    const runId = testRunId();
    const next = validSettingsPayload(original, {
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
        enabled: true,
        smtpHost: 'mailpit',
        smtpPort: 1025,
        smtpSecure: false,
        smtpUser: '',
        smtpPassword: `smtp-${runId}`,
        fromAddress: 'noreply@herzgarten.test',
        fromName: 'Herzgarten',
        replyTo: '',
      },
    });

    try {
      const saved = await saveSettings(request, token, next);
      expect(saved).toEqual({ ...next, email: { ...next.email, smtpPassword: undefined, smtpPasswordConfigured: true } });
      expect('smtpPassword' in saved.email).toBe(false);

      const listed = await getSettings(request, token);
      expect(listed).toEqual(saved);

      const retainedPassword = await saveSettings(request, token, {
        ...next,
        email: {
          ...next.email,
          smtpPassword: '',
        },
      });
      expect(retainedPassword.email.smtpPasswordConfigured).toBe(true);
      expect('smtpPassword' in retainedPassword.email).toBe(false);

      const omittedPassword = await saveSettings(request, token, {
        ...next,
        email: emailSettingsInput(retainedPassword.email),
      });
      expect(omittedPassword.email.smtpPasswordConfigured).toBe(true);
      expect('smtpPassword' in omittedPassword.email).toBe(false);

      const adminToken = await adminLogin(request);
      const adminPayload = jwtPayload(adminToken);
      expect(adminPayload.exp - adminPayload.iat).toBe(61 * 60);

      const auth = await registerByApi(request, testUser('settings-ttl-user', runId));
      const userPayload = jwtPayload(auth.token);
      expect(userPayload.exp - userPayload.iat).toBe(10081 * 60);

      const audit = await apiGet<{ items: Array<{ action: string; resourceType: string }> }>(request, '/api/admin/audit-log', token);
      expect(audit.items.some((entry) => entry.action === 'update' && entry.resourceType === 'app-settings')).toBe(true);
    } finally {
      await apiPatchRaw(request, '/api/admin/settings', settingsInput(original), token);
    }
  });
});
