import { expect, test } from '@playwright/test';
import { adminApiLogin, settingsInput, type AdminSettingsPayload } from '../../helpers/adminUi';
import { apiGet, apiPatchRaw } from '../../helpers/api';
import { testRunId } from '../../helpers/testUsers';

test.describe('admin ui / settings', () => {
  test('validates and saves settings', async ({ page, request }) => {
    await test.step('Flow: validates and saves settings', async () => {
      test.setTimeout(90000);
      const token = await adminApiLogin(request);
      const original = await apiGet<AdminSettingsPayload>(request, '/api/admin/settings', token);
      await test.step('Open admin settings page with API-authenticated admin session', async () => {
        await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
        await page.evaluate((adminToken) => window.localStorage.setItem('herzgarten_admin_token', adminToken), token);
        await page.goto('/admin/settings', { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(/\/admin\/settings$/);
      });
      await test.step('Verify admin settings', async () => {
        await expect(page.getByTestId('admin-settings')).toBeVisible({ timeout: 30000 });
      });

      try {
        const originalAdminTtl = await page.getByTestId('admin-settings-admin-jwt-ttl').inputValue();
        const originalUserTtl = await page.getByTestId('admin-settings-user-jwt-ttl').inputValue();
        await page.getByTestId('admin-settings-admin-jwt-ttl').fill('0');
        await page.getByTestId('admin-settings-save').click();
        await expect(page.getByTestId('admin-settings-error')).toBeVisible();
        await page.getByTestId('admin-settings-admin-jwt-ttl').fill(originalAdminTtl);

        await page.getByTestId('admin-settings-user-jwt-ttl').fill('43201');
        await page.getByTestId('admin-settings-save').click();
        await expect(page.getByTestId('admin-settings-error')).toBeVisible();
        await page.getByTestId('admin-settings-user-jwt-ttl').fill(originalUserTtl);

        await page.getByTestId('admin-settings-public-base-url').fill('not-a-url');
        await page.getByTestId('admin-settings-save').click();
        await expect(page.getByTestId('admin-settings-error')).toBeVisible();
        await page.getByTestId('admin-settings-public-base-url').fill('http://localhost:5174');

        await page.getByTestId('admin-settings-reset-ttl').fill('1');
        await page.getByTestId('admin-settings-save').click();
        await expect(page.getByTestId('admin-settings-error')).toBeVisible();
        await page.getByTestId('admin-settings-reset-ttl').fill('30');

        await page.getByTestId('admin-settings-reset-limit').fill('0');
        await page.getByTestId('admin-settings-save').click();
        await expect(page.getByTestId('admin-settings-error')).toBeVisible();
        await page.getByTestId('admin-settings-reset-limit').fill('5');

        await page.getByTestId('admin-settings-email-enabled').setChecked(true);
        await page.getByTestId('admin-settings-email-host').fill('');
        await page.getByTestId('admin-settings-save').click();
        await expect(page.getByTestId('admin-settings-error')).toBeVisible();
        await page.getByTestId('admin-settings-email-host').fill('mailpit');

        await page.getByTestId('admin-settings-email-port').fill('70000');
        await page.getByTestId('admin-settings-save').click();
        await expect(page.getByTestId('admin-settings-error')).toBeVisible();
        await page.getByTestId('admin-settings-email-port').fill('1025');

        await page.getByTestId('admin-settings-email-from').fill('invalid-email');
        await page.getByTestId('admin-settings-save').click();
        await expect(page.getByTestId('admin-settings-error')).toBeVisible();
        await page.getByTestId('admin-settings-email-from').fill('noreply@herzgarten.test');

        await page.getByTestId('admin-settings-email-reply-to').fill('invalid-reply');
        await page.getByTestId('admin-settings-save').click();
        await expect(page.getByTestId('admin-settings-error')).toBeVisible();
        await page.getByTestId('admin-settings-email-reply-to').fill('');

        await page.getByTestId('admin-settings-admin-jwt-ttl').fill('61');
        await page.getByTestId('admin-settings-user-jwt-ttl').fill('10081');
        await page.getByTestId('admin-settings-email-password').fill(`smtp-${testRunId()}`);
        await page.getByTestId('admin-settings-save').click();
        await expect(page.getByTestId('admin-settings-success')).toBeVisible();
        await expect(page.getByTestId('admin-settings-email-password')).toHaveValue('');
      } finally {
        await apiPatchRaw(request, '/api/admin/settings', settingsInput(original), token);
      }
    });
  });
});