import { expect, test } from '@playwright/test';
import { setupCoupleByApi } from './helpers/api';
import { testRunId, testUser } from './helpers/testUsers';

function pngHeader(width: number, height: number) {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52,
    (width >> 24) & 0xff, (width >> 16) & 0xff, (width >> 8) & 0xff, width & 0xff,
    (height >> 24) & 0xff, (height >> 16) & 0xff, (height >> 8) & 0xff, height & 0xff,
    0x08, 0x06, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4e, 0x44,
    0xae, 0x42, 0x60, 0x82,
  ]);
}

test.describe('admin ui', () => {
  test('logs in, navigates linked filters and manages content/categories', async ({ page, request }) => {
    test.setTimeout(60000);
    const runId = testRunId();
    const userA = testUser('admin-ui-a', runId);
    const userB = testUser('admin-ui-b', runId);
    const setup = await setupCoupleByApi(request, userA, userB);

    await page.goto('/admin/login');
    await page.evaluate(() => window.localStorage.removeItem('herzgarten_admin_token'));
    await page.reload();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.locator('.bottom-nav')).toHaveCount(0);

    await page.getByTestId('admin-password').fill('admin');
    await page.getByTestId('admin-login-submit').click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByTestId('admin-dashboard')).toBeVisible();
    const warningBox = await page.getByTestId('admin-default-password-warning').boundingBox();
    expect(warningBox?.height ?? 999).toBeLessThan(80);

    await page.getByRole('link', { name: 'Nutzer' }).click();
    await expect(page.getByTestId('admin-users')).toBeVisible();
    await page.getByTestId('admin-users-search').fill(userA.email);
    await page.getByTestId('admin-users-search-submit').click();
    await page.getByRole('button', { name: new RegExp(setup.inviteCode) }).first().click();
    await expect(page).toHaveURL(new RegExp(`/admin/couples\\?search=${setup.inviteCode}`));
    await expect(page.getByTestId('admin-couples-search')).toHaveValue(setup.inviteCode);
    await page.getByRole('link', { name: 'Details' }).first().click();
    await expect(page.getByTestId('admin-couple-detail')).toBeVisible();
    await expect(page.getByTestId('admin-couple-preferences')).toBeVisible();
    await page.getByTestId('admin-couple-relationship-type').selectOption('long_distance');
    await page.getByTestId('admin-couple-content-preference').selectOption('deep');
    await page.getByTestId('admin-couple-preferences-save').click();
    await expect(page.getByText('Einstellungen gespeichert.')).toBeVisible();

    await page.getByRole('link', { name: 'Paarräume' }).click();
    await page.getByTestId('admin-couples-search').fill(setup.inviteCode);
    await page.getByRole('button', { name: 'Suchen' }).click();
    await page.getByRole('button', { name: userA.displayName }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/users\\?search=${userA.email}`));
    await expect(page.getByTestId('admin-users-search')).toHaveValue(userA.email);

    await page.getByRole('link', { name: 'Kategorien' }).click();
    await expect(page.getByTestId('admin-categories')).toBeVisible();
    await expect(page.getByTestId('admin-preference-new')).toHaveCount(0);
    await page.getByRole('link', { name: 'Garten' }).click();
    await expect(page.getByTestId('admin-garden')).toBeVisible();
    await expect(page.locator('.admin-table')).toContainText('Heart Bed');
    await page.getByTestId('admin-garden-level-new').click();
    await expect(page.getByTestId('admin-garden-level-form')).toBeVisible();
    await page.getByTestId('admin-garden-level-name').fill(`UI Garten ${runId}`);
    await page.getByTestId('admin-garden-level-accent').fill('#446688');
    await page.getByTestId('admin-garden-level-background').setInputFiles({
      name: 'background.png',
      mimeType: 'image/png',
      buffer: pngHeader(700, 520),
    });
    await page.getByTestId('admin-garden-level-points').fill('175');
    await page.getByTestId('admin-garden-level-save').click();
    await expect(page.getByTestId('admin-garden-level-form')).toHaveCount(0);
    await expect(page.locator('.admin-table')).toContainText(`UI Garten ${runId}`);
    await page.getByTestId('admin-garden-level-delete').last().click();
    await expect(page.locator('.admin-table')).not.toContainText(`UI Garten ${runId}`);
    await page.getByRole('link', { name: 'Garten-Assets' }).click();
    await expect(page.getByTestId('admin-garden-assets')).toBeVisible();
    await page.getByRole('button', { name: 'Bearbeiten' }).first().click();
    await expect(page.getByTestId('admin-garden-asset-preview')).toBeVisible();
    await page.getByRole('link', { name: 'Taxonomien' }).click();
    await expect(page.getByTestId('admin-taxonomies')).toBeVisible();
    await expect(page.getByTestId('admin-preference-new')).toBeVisible();
    await page.getByTestId('admin-preference-new').click();
    await expect(page.getByTestId('admin-preference-form')).toBeVisible();
    await page.getByTestId('admin-preference-value').fill(`ui_rel_${runId.replaceAll('-', '_')}`);
    await page.getByTestId('admin-preference-label').fill(`UI Beziehung ${runId}`);
    await page.getByTestId('admin-preference-save').click();
    await expect(page.getByTestId('admin-preference-form')).toHaveCount(0);
    await page.getByRole('link', { name: 'Kategorien' }).click();
    await expect(page.getByTestId('admin-categories')).toBeVisible();
    await page.getByTestId('admin-category-new').click();
    await expect(page.getByTestId('admin-category-form')).toBeVisible();
    await expect(page.getByTestId('admin-category-relationship-modes')).toBeVisible();
    await expect(page.getByTestId('admin-category-content-styles')).toBeVisible();

    await page.getByRole('link', { name: 'Inhalte' }).click();
    await expect(page.getByTestId('admin-content')).toBeVisible();
    await page.getByRole('button', { name: 'Liebesglas' }).click();
    await expect(page.locator('.admin-heading span')).toHaveText('Liebesglas');
    await expect(page.getByTestId('admin-content-category-filter')).toContainText('Compliment');
    await expect(page.getByTestId('admin-content-new')).toBeVisible();
    await page.getByTestId('admin-content-new').click();
    await expect(page.getByTestId('admin-content-form')).toBeVisible();
    await expect(page.locator('[data-testid="admin-content-category"] option').nth(1)).toBeAttached();
    await page.getByTestId('admin-content-category').selectOption({ index: 1 });
    await page.getByTestId('admin-content-love-jar-text').fill(`UI Liebesglas ${runId}`);
    await expect(page.getByTestId('admin-content-form')).toBeVisible();
    await expect(page.getByTestId('admin-content-preview')).toHaveCount(0);
    await page.getByTestId('admin-content-save').click();
    await expect(page.getByTestId('admin-content-form')).toHaveCount(0);
    await page.getByTestId('admin-content-search').fill(`UI Liebesglas ${runId}`);
    await page.getByRole('button', { name: 'Filtern' }).click();
    await expect(page.locator('.admin-table')).toContainText(`UI Liebesglas ${runId}`);

    await page.getByRole('button', { name: 'Bearbeiten' }).first().click();
    await expect(page.getByTestId('admin-content-form')).toBeVisible();

    await page.getByRole('link', { name: 'Protokoll' }).click();
    await expect(page.getByTestId('admin-audit-log')).toBeVisible();
    await expect(page.getByTestId('admin-audit-log')).toContainText('love-jar-templates');

    await page.getByTestId('admin-logout').click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.evaluate(() => window.localStorage.getItem('herzgarten_admin_token'))).resolves.toBeNull();
  });
});
