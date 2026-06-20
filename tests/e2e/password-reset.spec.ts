import { expect, test, type APIRequestContext } from '@playwright/test';
import { apiGet, apiPatchRaw, apiPostRaw } from './helpers/api';
import { expectJson, type AuthPayload } from './helpers/apiAssertions';
import { testRunId, testUser } from './helpers/testUsers';

const mailpitUrl = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8025';

async function clearMailbox(request: APIRequestContext) {
  await request.delete(`${mailpitUrl}/api/v1/messages`);
}

async function latestResetToken(request: APIRequestContext, email: string) {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    const response = await request.get(`${mailpitUrl}/api/v1/messages`);
    const payload = await response.json() as { messages?: Array<{ ID: string; To?: Array<{ Address: string }> }> };
    const message = payload.messages?.find((item) =>
      item.To?.some((recipient) => recipient.Address.toLowerCase() === email.toLowerCase()),
    );
    if (message) {
      const detailResponse = await request.get(`${mailpitUrl}/api/v1/message/${message.ID}`);
      const detail = await detailResponse.json() as { Text?: string };
      const match = detail.Text?.match(/\/reset-password\?token=([A-Za-z0-9_-]+)/);
      if (match?.[1]) return match[1];
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`No reset email received for ${email}`);
}

async function adminLogin(request: APIRequestContext) {
  const response = await apiPostRaw(request, '/api/admin/auth/login', { password: 'admin' });
  const payload = await expectJson<{ token: string }>(response);
  return payload.token;
}

function emailSettingsInput<T extends { smtpPasswordConfigured?: boolean }>(settings: T) {
  const { smtpPasswordConfigured: _smtpPasswordConfigured, ...input } = settings;
  return input;
}

test.describe('password reset ui', () => {
  test('shows forgot password when email is enabled and resets the password', async ({ page, request }) => {
    await clearMailbox(request);
    const user = testUser('ui-reset', testRunId());
    await expectJson<AuthPayload>(await apiPostRaw(request, '/api/auth/register', user), 201);

    await page.goto('/onboarding');
    await page.getByTestId('auth-mode-login').click();
    await expect(page.getByTestId('forgot-password-link')).toBeVisible();
    await page.getByTestId('forgot-password-link').click();
    await page.getByTestId('forgot-password-email').fill(user.email);
    await page.getByTestId('forgot-password-submit').click();
    await expect(page.getByTestId('forgot-password-success')).toBeVisible();

    const token = await latestResetToken(request, user.email);
    await page.goto(`/reset-password?token=${encodeURIComponent(token)}`);
    await page.getByTestId('reset-password-input').fill('new-password-123');
    await page.getByTestId('reset-password-submit').click();
    await expect(page.getByTestId('reset-password-success')).toBeVisible();

    await page.getByTestId('reset-password-login-link').click();
    await page.getByTestId('auth-mode-login').click();
    await page.getByTestId('auth-email').fill(user.email);
    await page.getByTestId('auth-password').fill('new-password-123');
    await page.getByTestId('auth-submit').click();
    await expect(page.getByTestId('auth-error')).toHaveCount(0);
  });

  test('hides forgot password when email reset is disabled', async ({ page, request }) => {
    const adminToken = await adminLogin(request);
    const original = await apiGet<{
      auth: { adminJwtTtlMinutes: number; userJwtTtlMinutes: number };
      server: { publicBaseUrl: string };
      passwordReset: { ttlMinutes: number; limitPer24h: number };
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
    }>(request, '/api/admin/settings', adminToken);
    const originalEmail = emailSettingsInput(original.email);

    try {
      await apiPatchRaw(request, '/api/admin/settings', {
        auth: original.auth,
        server: original.server,
        passwordReset: original.passwordReset,
        email: {
          ...originalEmail,
          enabled: false,
        },
      }, adminToken);

      await page.goto('/onboarding');
      await page.getByTestId('auth-mode-login').click();
      await expect(page.getByTestId('forgot-password-link')).toHaveCount(0);
    } finally {
      await apiPatchRaw(request, '/api/admin/settings', { auth: original.auth, server: original.server, passwordReset: original.passwordReset, email: originalEmail }, adminToken);
    }
  });
});
