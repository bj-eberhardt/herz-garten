import { expect, test } from '@playwright/test';
import { adminLogin, openAdminNavPage, rowSpecificTestId, slug, tableRowByText } from '../../helpers/adminUi';
import { testRunId } from '../../helpers/testUsers';

test.describe('admin ui / taxonomies', () => {
  test('creates, edits and deletes categories and edits taxonomies', async ({ page }) => {
    await test.step('Flow: creates, edits and deletes categories and edits taxonomies', async () => {
      test.setTimeout(90000);
      await adminLogin(page);

      await test.step('Click admin nav taxonomies', async () => {
        await openAdminNavPage(page, { navItem: 'taxonomies', url: /\/admin\/taxonomies$/, view: 'admin-taxonomies' });
      });
      const relationshipValue = slug('ui_relationship');
      const styleValue = slug('ui_style');

      for (const [kind, value, label] of [
        ['relationship-modes', relationshipValue, `UI Beziehung ${testRunId()}`],
        ['content-styles', styleValue, `UI Stil ${testRunId()}`],
      ] as const) {
        await page.getByTestId(`admin-preference-tab-${kind}`).click();
        await page.getByTestId('admin-preference-new').click();
        await page.getByTestId('admin-preference-save').click();
        await expect(page.getByTestId('admin-preference-error')).toBeVisible();
        await page.getByTestId('admin-preference-value').fill(value);
        await page.getByTestId('admin-preference-label').fill(label);
        await page.getByTestId('admin-preference-sort-order').fill('777');
        await page.getByTestId('admin-preference-save').click();
        const row = await tableRowByText(page, 'admin-preference-row-', label);
        const rowId = await rowSpecificTestId(row);
        await page.getByTestId(rowId.replace('admin-preference-row-', 'admin-preference-edit-')).click();
        await page.getByTestId('admin-preference-label').fill(`${label} bearbeitet`);
        await page.getByTestId('admin-preference-active').setChecked(false);
        await page.getByTestId('admin-preference-save').click();
        await expect(await tableRowByText(page, 'admin-preference-row-', `${label} bearbeitet`)).toContainText('inaktiv');
      }

      await test.step('Click admin nav categories', async () => {
        await openAdminNavPage(page, { navItem: 'categories', url: /\/admin\/categories$/, view: 'admin-categories' });
      });
      await test.step('Click admin category tab daily questions', async () => {
        await page.getByTestId('admin-category-tab-daily-questions').click();
      });
      await test.step('Assert: used category delete action is disabled', async () => {
        await expect(page.locator('[data-testid^="admin-category-delete-"]').first()).toBeDisabled();
      });
      await test.step('Click admin category new', async () => {
        await page.getByTestId('admin-category-new').click();
      });
      await test.step('Click admin category save', async () => {
        await page.getByTestId('admin-category-save').click();
      });
      await test.step('Verify admin category error', async () => {
        await expect(page.getByTestId('admin-category-error')).toBeVisible();
      });

      const categoryValue = slug('ui_category');
      const categoryLabel = `UI Kategorie ${testRunId()}`;
      await test.step('Fill admin category value', async () => {
        await page.getByTestId('admin-category-value').fill(categoryValue);
      });
      await test.step('Fill admin category label', async () => {
        await page.getByTestId('admin-category-label').fill(categoryLabel);
      });
      await test.step('Fill admin category sort order', async () => {
        await page.getByTestId('admin-category-sort-order').fill('778');
      });
      await test.step('Click admin category save', async () => {
        await page.getByTestId('admin-category-save').click();
      });
      const categoryRow = await tableRowByText(page, 'admin-category-row-', categoryLabel);
      const categoryRowId = await rowSpecificTestId(categoryRow);

      await test.step('Click UI control', async () => {
        await page.getByTestId(categoryRowId.replace('admin-category-row-', 'admin-category-edit-')).click();
      });
      await test.step('Fill admin category label', async () => {
        await page.getByTestId('admin-category-label').fill(`${categoryLabel} bearbeitet`);
      });
      await test.step('Toggle admin category active', async () => {
        await page.getByTestId('admin-category-active').setChecked(false);
      });
      await test.step('Click admin category save', async () => {
        await page.getByTestId('admin-category-save').click();
      });
      const editedCategoryRow = await tableRowByText(page, 'admin-category-row-', `${categoryLabel} bearbeitet`);
      await test.step('Assert: rendered content includes inaktiv', async () => {
        await expect(editedCategoryRow).toContainText('inaktiv');
      });
      const editedCategoryRowId = await rowSpecificTestId(editedCategoryRow);
      await test.step('Click UI control', async () => {
        await page.getByTestId(editedCategoryRowId.replace('admin-category-row-', 'admin-category-delete-')).click();
      });
      await test.step('Assert: deleted category row is removed', async () => {
        await expect(page.getByTestId(editedCategoryRowId)).toHaveCount(0);
      });
    });
  });
});
