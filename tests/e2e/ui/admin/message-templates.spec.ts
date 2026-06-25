import { expect, test } from '@playwright/test';
import { adminApiLogin, adminLogin, openAdminNavPage } from '../../helpers/adminUi';
import { apiGet, apiPatchRaw } from '../../helpers/api';
import { testRunId } from '../../helpers/testUsers';

test.describe('admin ui / message templates', () => {
  test('searches, validates and saves message templates', async ({ page, request }) => {
    await test.step('Flow: searches, validates and saves message templates', async () => {
      test.setTimeout(90000);
      const token = await adminApiLogin(request);
      const key = 'notifications.bodies.questWaitingConfirmation';
      const listed = await apiGet<{
        items: Array<{ key: string; translations: Record<string, { text: string; description: string; }>; }>;
      }>(request, '/api/admin/message-templates?namespace=notifications', token);
      const original = listed.items.find((item) => item.key === key)?.translations;
      if (!original) throw new Error(`Missing template ${key}`);

      await adminLogin(page);
      await test.step('Click admin nav messages', async () => {
        await openAdminNavPage(page, { navItem: 'messages', url: /\/admin\/messages$/, view: 'admin-message-templates' });
      });

      try {
        await page.getByTestId('admin-message-search').fill(key);
        await expect(page.getByTestId(`admin-message-row-${key}`)).toBeVisible();
        await page.getByTestId('admin-message-search').fill('');
        await page.getByTestId('admin-message-channel-push').click();
        await expect(page.locator('[data-testid^="admin-message-row-push."]').first()).toBeVisible();
        await page.getByTestId('admin-message-channel-email').click();
        await expect(page.locator('[data-testid^="admin-message-row-emails."]').first()).toBeVisible();
        await page.getByTestId('admin-message-channel-notifications').click();
        await page.getByTestId('admin-message-search').fill(key);
        await page.getByTestId(`admin-message-edit-${key}`).click();
        await expect(page.getByTestId('admin-message-form')).toBeVisible();

        await page.getByTestId('admin-message-text-de').fill('{name} wartet.');
        await page.getByTestId('admin-message-save').click();
        await expect(page.getByTestId('admin-message-error')).toHaveCount(0);
        await expect(page.getByText(/\{title}/)).toBeVisible();

        const customText = `Admin UI: {name} wartet bei "{title}" ${testRunId()}.`;
        await page.getByTestId('admin-message-text-de').fill(customText);
        await page.getByTestId('admin-message-description-de').fill('Admin UI Test');
        await page.getByTestId('admin-message-save').click();
        await expect(page.getByTestId('admin-message-success')).toBeVisible();
        await expect(page.getByTestId('admin-message-form')).toHaveCount(0);
        await expect(page.getByTestId(`admin-message-row-${key}`)).toContainText(customText);
      } finally {
        await apiPatchRaw(request, `/api/admin/message-templates/${key}`, { translations: original }, token);
      }
    });
  });
});
