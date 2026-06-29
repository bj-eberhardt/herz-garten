import { expect, test } from '@playwright/test';
import { adminLogin, clearMailbox, openAdminNavPage, latestMailFor } from '../../helpers/adminUi';
import { setupCoupleByApi } from '../../helpers/api';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('admin ui / users couples', () => {
  test('searches users and couples, resets passwords and downloads exports', async ({ page, request }) => {
    await test.step('Flow: searches users and couples, resets passwords and downloads exports', async () => {
      test.setTimeout(60000);
      const runId = testRunId();
      const userA = testUser('admin-ui-user-a', runId);
      const userB = testUser('admin-ui-user-b', runId);
      const setup = await setupCoupleByApi(request, userA, userB);

      await adminLogin(page);
      await test.step('Click admin nav users', async () => {
        await openAdminNavPage(page, { navItem: 'users', url: /\/admin\/users$/, view: 'admin-users' });
      });
      await test.step('Fill admin users search', async () => {
        await page.getByTestId('admin-users-search').fill(userA.email);
      });
      await test.step('Click admin users search submit', async () => {
        await page.getByTestId('admin-users-search-submit').click();
      });
      await test.step('Assert: admin user search shows matching email', async () => {
        await expect(page.locator('.admin-table')).toContainText(userA.email);
      });

      const userJsonDownload = page.waitForEvent('download');
      await test.step('Click admin users export json', async () => {
        await page.getByTestId('admin-users-export-json').click();
      });
      await test.step('Assert: download filename is herzgarten-users.json', async () => {
        expect((await userJsonDownload).suggestedFilename()).toBe('herzgarten-users.json');
      });
      const userCsvDownload = page.waitForEvent('download');
      await test.step('Click admin users export csv', async () => {
        await page.getByTestId('admin-users-export-csv').click();
      });
      await test.step('Assert: download filename is herzgarten-users.csv', async () => {
        expect((await userCsvDownload).suggestedFilename()).toBe('herzgarten-users.csv');
      });

      await test.step('Click admin user password reset open', async () => {
        await page.getByTestId('admin-user-password-reset-open').first().click();
      });
      await test.step('Verify admin user password reset form', async () => {
        await expect(page.getByTestId('admin-user-password-reset-form')).toBeVisible();
      });
      await test.step('Fill admin user password reset input', async () => {
        await page.getByTestId('admin-user-password-reset-input').fill('short');
      });
      await test.step('Click admin user password reset save', async () => {
        await page.getByTestId('admin-user-password-reset-save').click();
      });
      await test.step('Verify admin user password reset error', async () => {
        await expect(page.getByTestId('admin-user-password-reset-error')).toBeVisible();
      });
      await test.step('Click admin user password reset close', async () => {
        await page.getByTestId('admin-user-password-reset-close').click();
      });
      await test.step('Verify admin user password reset form', async () => {
        await expect(page.getByTestId('admin-user-password-reset-form')).toHaveCount(0);
      });

      await clearMailbox(request);
      await test.step('Click admin user password reset open', async () => {
        await page.getByTestId('admin-user-password-reset-open').first().click();
      });
      await test.step('Fill admin user password reset input', async () => {
        await page.getByTestId('admin-user-password-reset-input').fill(`Admin-ui-reset-${runId}`);
      });
      await test.step('Click admin user password reset save', async () => {
        await page.getByTestId('admin-user-password-reset-save').click();
      });
      await test.step('Verify admin user password reset success', async () => {
        await expect(page.getByTestId('admin-user-password-reset-success')).toContainText(userA.displayName);
      });
      const adminResetMail = await latestMailFor(request, userA.email);
      await test.step('Assert: admin reset email has password subject', async () => {
        expect(adminResetMail.Subject).toMatch(/Herzgarten.*(Passwort|password)/i);
      });

      await test.step('Open couples filtered by user invite code', async () => {
        await page.locator('[data-testid^="admin-user-couple-filter-"]').first().click();
        await expect(page).toHaveURL(new RegExp(`/admin/couples\\?search=${setup.inviteCode}`), { timeout: 30000 });
      });
      await test.step('Verify admin couples search', async () => {
        await expect(page.getByTestId('admin-couples-search')).toHaveValue(setup.inviteCode);
      });

      const coupleJsonDownload = page.waitForEvent('download');
      await test.step('Click admin couples export json', async () => {
        await page.getByTestId('admin-couples-export-json').click();
      });
      await test.step('Assert: download filename is herzgarten-couples.json', async () => {
        expect((await coupleJsonDownload).suggestedFilename()).toBe('herzgarten-couples.json');
      });
      const coupleCsvDownload = page.waitForEvent('download');
      await test.step('Click admin couples export csv', async () => {
        await page.getByTestId('admin-couples-export-csv').click();
      });
      await test.step('Assert: download filename is herzgarten-couples.csv', async () => {
        expect((await coupleCsvDownload).suggestedFilename()).toBe('herzgarten-couples.csv');
      });

      await test.step('Open users filtered by couple member email', async () => {
        await page.locator('[data-testid^="admin-couple-member-filter-"]').first().click();
        await expect(page).toHaveURL(new RegExp(`/admin/users\\?search=${userA.email}`), { timeout: 30000 });
      });
      await test.step('Click admin nav couples', async () => {
        await openAdminNavPage(page, { navItem: 'couples', url: /\/admin\/couples$/, view: 'admin-couples' });
      });
      await test.step('Fill admin couples search', async () => {
        await page.getByTestId('admin-couples-search').fill(setup.inviteCode);
      });
      await test.step('Click admin couples search submit', async () => {
        await page.getByTestId('admin-couples-search-submit').click();
      });
      await test.step('Click UI control', async () => {
        await page.locator('[data-testid^="admin-couple-details-"]').first().click();
      });
      await test.step('Verify admin couple detail', async () => {
        await expect(page.getByTestId('admin-couple-detail')).toBeVisible();
      });
      await test.step('Select admin couple relationship type', async () => {
        await page.getByTestId('admin-couple-relationship-type').selectOption('long_distance');
      });
      await test.step('Select admin couple content preference', async () => {
        await page.getByTestId('admin-couple-content-preference').selectOption('deep');
      });
      await test.step('Click admin couple preferences save', async () => {
        await page.getByTestId('admin-couple-preferences-save').click();
      });
      await test.step('Verify admin couple preferences success', async () => {
        await expect(page.getByTestId('admin-couple-preferences-success')).toBeVisible();
      });
      await test.step('Return to filtered couples list', async () => {
        await page.getByTestId('admin-couple-detail-back').click();
        await expect(page).toHaveURL(new RegExp(`/admin/couples\\?search=${setup.inviteCode}`), { timeout: 30000 });
      });
    });
  });
});
