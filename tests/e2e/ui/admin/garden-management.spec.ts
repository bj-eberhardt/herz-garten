import { expect, test } from '@playwright/test';
import { adminLogin, openAdminNavPage, pngHeader, rowSpecificTestId, slug, tableRowByText } from '../../helpers/adminUi';
import { testRunId } from '../../helpers/testUsers';

test.describe('admin ui / garden management', () => {
  test('creates, edits and deletes garden levels and edits garden assets', async ({ page }) => {
    await test.step('Flow: creates, edits and deletes garden levels and edits garden assets', async () => {
      test.setTimeout(90000);
      await adminLogin(page);

      await test.step('Click admin nav garden', async () => {
        await openAdminNavPage(page, { navItem: 'garden', url: /\/admin\/garden$/, view: 'admin-garden' });
      });
      await test.step('Verify expected result', async () => {
        await expect(page.locator('[data-testid^="admin-garden-level-delete-"], [data-testid="admin-garden-level-delete"]').first()).toBeDisabled();
      });
      await test.step('Click admin garden level new', async () => {
        await page.getByTestId('admin-garden-level-new').click();
      });
      await test.step('Click admin garden level save', async () => {
        await page.getByTestId('admin-garden-level-save').click();
      });
      await test.step('Verify admin garden level error', async () => {
        await expect(page.getByTestId('admin-garden-level-error')).toBeVisible();
      });

      const levelName = `UI Garten ${testRunId()}`;
      await test.step('Fill admin garden level name', async () => {
        await page.getByTestId('admin-garden-level-name').fill(levelName);
      });
      await test.step('Fill admin garden level accent', async () => {
        await page.getByTestId('admin-garden-level-accent').fill('#446688');
      });
      await test.step('Fill admin garden level points', async () => {
        await page.getByTestId('admin-garden-level-points').fill('175');
      });
      await test.step('Click admin garden level save', async () => {
        await page.getByTestId('admin-garden-level-save').click();
      });
      await test.step('Verify admin garden level error', async () => {
        await expect(page.getByTestId('admin-garden-level-error')).toBeVisible();
      });
      await page.getByTestId('admin-garden-level-background').setInputFiles({
        name: 'background.png',
        mimeType: 'image/png',
        buffer: pngHeader(700, 520),
      });
      await test.step('Click admin garden level save', async () => {
        await page.getByTestId('admin-garden-level-save').click();
      });
      const levelRow = await tableRowByText(page, 'admin-garden-level-row-', levelName);
      const levelRowId = await rowSpecificTestId(levelRow);
      await test.step('Click UI control', async () => {
        await page.getByTestId(levelRowId.replace('admin-garden-level-row-', 'admin-garden-level-edit-')).click();
      });
      const editedLevelName = `${levelName} bearbeitet`;
      await test.step('Fill admin garden level name', async () => {
        await page.getByTestId('admin-garden-level-name').fill(editedLevelName);
      });
      await test.step('Fill admin garden level name de', async () => {
        await page.getByTestId('admin-garden-level-name-de').fill(editedLevelName);
      });
      await test.step('Fill admin garden level points', async () => {
        await page.getByTestId('admin-garden-level-points').fill('190');
      });
      await test.step('Click admin garden level save', async () => {
        await page.getByTestId('admin-garden-level-save').click();
      });
      const editedLevelRow = await tableRowByText(page, 'admin-garden-level-row-', editedLevelName);
      await test.step('Click admin garden level delete', async () => {
        await editedLevelRow.getByTestId('admin-garden-level-delete').click();
      });
      await test.step('Verify expected result', async () => {
        await expect(page.locator('.admin-table')).not.toContainText(editedLevelName);
      });

      await test.step('Click admin nav garden assets', async () => {
        await openAdminNavPage(page, { navItem: 'garden-assets', url: /\/admin\/garden-assets$/, view: 'admin-garden-assets' });
      });
      await test.step('Click admin garden asset new', async () => {
        await page.getByTestId('admin-garden-asset-new').click();
      });
      await test.step('Click admin garden asset save', async () => {
        await page.getByTestId('admin-garden-asset-save').click();
      });
      await test.step('Verify admin garden asset error', async () => {
        await expect(page.getByTestId('admin-garden-asset-error')).toBeVisible();
      });

      const assetKey = slug('asset_ui');
      const assetLabel = `UI Asset ${testRunId()}`;
      await test.step('Fill admin garden asset key', async () => {
        await page.getByTestId('admin-garden-asset-key').fill(assetKey);
      });
      await test.step('Fill admin garden asset label', async () => {
        await page.getByTestId('admin-garden-asset-label').fill(assetLabel);
      });
      await test.step('Select admin garden asset stage', async () => {
        await page.getByTestId('admin-garden-asset-stage').selectOption('1');
      });
      await test.step('Select admin garden asset source types', async () => {
        await page.getByTestId('admin-garden-asset-source-types').selectOption(['quest']);
      });
      await test.step('Fill admin garden asset sort order', async () => {
        await page.getByTestId('admin-garden-asset-sort-order').fill('999');
      });
      await page.getByTestId('admin-garden-asset-image').setInputFiles({
        name: 'asset.png',
        mimeType: 'image/png',
        buffer: pngHeader(64, 80),
      });
      await test.step('Click admin garden asset save', async () => {
        await page.getByTestId('admin-garden-asset-save').click();
      });
      const assetRow = await tableRowByText(page, 'admin-garden-asset-row-', assetLabel);
      const assetRowId = await rowSpecificTestId(assetRow);
      await test.step('Click UI control', async () => {
        await page.getByTestId(assetRowId.replace('admin-garden-asset-row-', 'admin-garden-asset-edit-')).click();
      });
      await test.step('Verify admin garden asset key', async () => {
        await expect(page.getByTestId('admin-garden-asset-key')).toBeDisabled();
      });
      await test.step('Fill admin garden asset label', async () => {
        await page.getByTestId('admin-garden-asset-label').fill(`${assetLabel} bearbeitet`);
      });
      await test.step('Toggle admin garden asset active', async () => {
        await page.getByTestId('admin-garden-asset-active').setChecked(false);
      });
      await test.step('Select admin garden asset source types', async () => {
        await page.getByTestId('admin-garden-asset-source-types').selectOption(['quest', 'memory']);
      });
      await test.step('Fill admin garden asset anchor x', async () => {
        await page.getByTestId('admin-garden-asset-anchor-x').fill('0.25');
      });
      await test.step('Fill admin garden asset anchor y', async () => {
        await page.getByTestId('admin-garden-asset-anchor-y').fill('0.75');
      });
      await test.step('Click admin garden asset save', async () => {
        await page.getByTestId('admin-garden-asset-save').click();
      });
      await test.step('Verify expected result', async () => {
        await expect(await tableRowByText(page, 'admin-garden-asset-row-', `${assetLabel} bearbeitet`)).toContainText('Inaktiv');
      });
    });
  });
});
