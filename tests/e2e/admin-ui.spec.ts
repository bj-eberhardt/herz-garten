import { expect, test } from '@playwright/test';
import { setupCoupleByApi } from './helpers/api';
import { testRunId, testUser } from './helpers/testUsers';

test.describe('admin ui', () => {
  test('logs in and manages admin views', async ({ page, request }) => {
    const runId = testRunId();
    await setupCoupleByApi(request, testUser('admin-ui-a', runId), testUser('admin-ui-b', runId));

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.locator('.bottom-nav')).toHaveCount(0);

    await page.getByTestId('admin-password').fill('admin');
    await page.getByTestId('admin-login-submit').click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByTestId('admin-dashboard')).toBeVisible();
    await expect(page.getByTestId('admin-default-password-warning')).toBeVisible();

    await page.getByRole('link', { name: 'User' }).click();
    await expect(page.getByTestId('admin-users')).toBeVisible();
    await expect(page.getByTestId('admin-users-export-csv')).toBeVisible();

    await page.getByRole('link', { name: 'Paarräume' }).click();
    await expect(page.getByTestId('admin-couples')).toBeVisible();
    await expect(page.getByTestId('admin-couples-export-json')).toBeVisible();

    await page.getByRole('link', { name: 'Content' }).click();
    await expect(page.getByTestId('admin-content')).toBeVisible();
    await page.getByRole('button', { name: 'Love Jar' }).click();
    await page.getByTestId('admin-content-love-jar-text').fill(`UI Love Jar ${runId}`);
    await expect(page.getByTestId('admin-content-preview')).toContainText(`UI Love Jar ${runId}`);
    await page.getByTestId('admin-content-save').click();
    await expect(page.locator('.admin-table')).toContainText(`UI Love Jar ${runId}`);

    await page.getByRole('link', { name: 'Audit' }).click();
    await expect(page.getByTestId('admin-audit-log')).toBeVisible();
    await expect(page.getByTestId('admin-audit-log')).toContainText('love-jar-templates');

    await page.getByTestId('admin-logout').click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.evaluate(() => window.localStorage.getItem('herzgarten_admin_token'))).resolves.toBeNull();
  });
});
