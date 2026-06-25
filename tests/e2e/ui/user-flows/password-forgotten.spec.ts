import { expect, test } from '@playwright/test';
import { apiPatchRaw, apiPostRaw } from '../../helpers/api';
import { expectJson, type AuthPayload } from '../../helpers/apiAssertions';
import { adminLogin, adminSettings, clearMailbox, emailSettingsInput, latestResetToken } from '../../helpers/passwordResetUi';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user flow / password forgotten', () => {
  test('shows forgot password when email is enabled and resets the password', async ({ page, request }) => {
    await test.step('Flow: shows forgot password when email is enabled and resets the password', async () => {
      const adminToken = await adminLogin(request);
      const original = await adminSettings(request, adminToken);
      const originalEmail = emailSettingsInput(original.email);

      await clearMailbox(request);
      try {
        await apiPatchRaw(request, '/api/admin/settings', {
          auth: original.auth,
          server: original.server,
          passwordReset: original.passwordReset,
          email: {
            ...originalEmail,
            enabled: true,
          },
        }, adminToken);

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
      } finally {
        await apiPatchRaw(request, '/api/admin/settings', {
          auth: original.auth,
          server: original.server,
          passwordReset: original.passwordReset,
          email: originalEmail,
        }, adminToken);
      }
    });
  });

  test('hides forgot password when email reset is disabled', async ({ page, request }) => {
    await test.step('Flow: hides forgot password when email reset is disabled', async () => {
      const adminToken = await adminLogin(request);
      const original = await adminSettings(request, adminToken);
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
});
