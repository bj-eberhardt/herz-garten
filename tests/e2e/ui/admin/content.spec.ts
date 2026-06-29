import { expect, test } from '@playwright/test';
import { adminLogin, createContentItem, openAdminNavPage, rowSpecificTestId, tableRowByText, type ContentType } from '../../helpers/adminUi';
import { testRunId } from '../../helpers/testUsers';

test.describe('admin ui / content', () => {
  test('creates, edits, deactivates and reactivates all content types', async ({ page }) => {
    await test.step('Flow: creates, edits, deactivates and reactivates all content types', async () => {
      test.setTimeout(90000);
      await adminLogin(page);
      await test.step('Click admin nav content', async () => {
        await openAdminNavPage(page, { navItem: 'content', url: /\/admin\/content$/, view: 'admin-content' });
      });

      for (const type of ['daily-questions', 'quests', 'know-me-catalog', 'love-jar-templates'] satisfies ContentType[]) {
        const label = `UI ${type} ${testRunId()}`;
        const editedLabel = `${label} edited`;
        const row = await createContentItem(page, type, label);
        const rowId = await rowSpecificTestId(row);

        await page.getByTestId(`${rowId.replace('admin-content-row-', 'admin-content-edit-')}`).click();
        if (type === 'quests') await page.getByTestId('admin-content-title').fill(editedLabel);
        else if (type === 'know-me-catalog') await page.getByTestId('admin-content-question-text').fill(editedLabel);
        else if (type === 'love-jar-templates') await page.getByTestId('admin-content-love-jar-text').fill(editedLabel);
        else await page.getByTestId('admin-content-text').fill(editedLabel);
        await page.getByTestId('admin-content-save').click();
        await page.getByTestId('admin-content-search').fill(editedLabel);
        await page.getByRole('button', { name: 'Filtern' }).click();
        const editedRow = await tableRowByText(page, 'admin-content-row-', editedLabel);
        const editedRowId = await rowSpecificTestId(editedRow);

        await page.getByTestId(`${editedRowId.replace('admin-content-row-', 'admin-content-deactivate-')}`).click();
        await page.getByTestId('admin-content-active-filter').selectOption('false');
        await expect(await tableRowByText(page, 'admin-content-row-', editedLabel)).toBeVisible();
        await page.getByTestId(`${editedRowId.replace('admin-content-row-', 'admin-content-reactivate-')}`).click();
        await page.getByTestId('admin-content-active-filter').selectOption('true');
        await expect(await tableRowByText(page, 'admin-content-row-', editedLabel)).toBeVisible();

        await page.getByTestId('admin-content-new').click();
        await page.getByTestId('admin-content-form-close').click();
        await expect(page.getByTestId('admin-content-form')).toHaveCount(0);
        await page.getByTestId('admin-content-active-filter').selectOption('all');
      }
    });
  });
  test('validates required categories and positive quest numbers', async ({ page }) => {
    await test.step('Flow: validates required categories and positive quest numbers', async () => {
      await adminLogin(page);
      await openAdminNavPage(page, { navItem: 'content', url: /\/admin\/content$/, view: 'admin-content' });

      await test.step('Reject daily question without category', async () => {
        await page.getByTestId('admin-content-new').click();
        await page.getByTestId('admin-content-text').fill(`UI validation daily ${testRunId()}`);
        await page.getByTestId('admin-content-save').click();
        await expect(page.getByTestId('admin-content-category-error')).toBeVisible();
        await page.getByTestId('admin-content-form-close').click();
      });

      await test.step('Reject quest without category or positive numeric fields', async () => {
        await page.getByTestId('admin-content-tab-quests').click();
        await page.getByTestId('admin-content-new').click();
        await page.getByTestId('admin-content-title').fill(`UI validation quest ${testRunId()}`);
        await page.getByTestId('admin-content-description').fill('Beschreibung');
        await page.getByTestId('admin-content-minutes').fill('0');
        await page.getByTestId('admin-content-reward-points').fill('0');
        await page.getByTestId('admin-content-save').click();
        await expect(page.getByTestId('admin-content-category-error')).toBeVisible();
        await expect(page.getByTestId('admin-content-minutes-error')).toBeVisible();
        await expect(page.getByTestId('admin-content-reward-points-error')).toBeVisible();
        await page.getByTestId('admin-content-form-close').click();
      });

      await test.step('Reject love-jar template without category', async () => {
        await page.getByTestId('admin-content-tab-love-jar-templates').click();
        await page.getByTestId('admin-content-new').click();
        await page.getByTestId('admin-content-love-jar-text').fill(`UI validation love jar ${testRunId()}`);
        await page.getByTestId('admin-content-save').click();
        await expect(page.getByTestId('admin-content-category-error')).toBeVisible();
      });
    });
  });
});
