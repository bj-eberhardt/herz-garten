import { expect, test } from '@playwright/test';

test.describe('admin ui / login', () => {
  test('authenticates, protects admin routes and logs out', async ({ page }) => {
    await test.step('Flow: authenticates, protects admin routes and logs out', async () => {
      await test.step('Clear existing admin session before protected-route check', async () => {
        await page.goto('/admin/login');
        await page.evaluate(() => window.localStorage.removeItem('herzgarten_admin_token'));
      });
      await test.step('Open /admin', async () => {
        await page.goto('/admin');
      });
      await test.step('Verify expected result', async () => {
        await expect(page).toHaveURL(/\/admin\/login$/);
      });
      await test.step('Verify expected result', async () => {
        await expect(page.locator('.bottom-nav')).toHaveCount(0);
      });

      await test.step('Fill admin password', async () => {
        await page.getByTestId('admin-password').fill('wrong-password');
      });
      await test.step('Click admin login submit', async () => {
        await page.getByTestId('admin-login-submit').click();
      });
      await test.step('Verify admin login error', async () => {
        await expect(page.getByTestId('admin-login-error')).toBeVisible();
      });
      await test.step('Verify admin password', async () => {
        await expect(page.getByTestId('admin-password')).toHaveValue('');
      });

      await test.step('Fill admin password', async () => {
        await page.getByTestId('admin-password').fill('admin');
      });
      await test.step('Submit valid admin password and wait for dashboard route', async () => {
        await Promise.all([
          page.waitForURL(/\/admin$/),
          page.getByTestId('admin-password').press('Enter'),
        ]);
      });
      await test.step('Verify admin dashboard', async () => {
        await expect(page.getByTestId('admin-dashboard')).toBeVisible();
      });
      await test.step('Verify admin default password warning', async () => {
        await expect(page.getByTestId('admin-default-password-warning')).toBeVisible();
      });

      for (const navItem of [
        'dashboard',
        'users',
        'couples',
        'content',
        'garden',
        'garden-assets',
        'categories',
        'taxonomies',
        'messages',
        'settings',
        'audit-log',
      ]) {
        await expect(page.getByTestId(`admin-nav-${navItem}`)).toBeVisible();
      }

      await test.step('Click admin logout', async () => {
        await page.getByTestId('admin-logout').click();
      });
      await test.step('Verify expected result', async () => {
        await expect(page).toHaveURL(/\/admin\/login$/);
      });
      await test.step('Verify expected result', async () => {
        await expect(page.evaluate(() => window.localStorage.getItem('herzgarten_admin_token'))).resolves.toBeNull();
      });
    });
  });
});
