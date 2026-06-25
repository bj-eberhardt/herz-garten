import { expect, test } from '@playwright/test';
import { expectRequiredFeedback, setupAuthenticatedPage } from '../../helpers/formValidation';

test.describe('user flow / memory validation', () => {
  test('memories marks missing title and does not create an entry', async ({ browser, request }) => {
    await test.step('Flow: memories marks missing title and does not create an entry', async () => {
      const { context, page } = await setupAuthenticatedPage(browser, request, 'validation-memory');

      await test.step('Open /memories', async () => {
        await page.goto('/memories');
      });
      await test.step('Click memory save', async () => {
        await page.getByTestId('memory-save').click();
      });

      await expectRequiredFeedback(page.getByTestId('memory-title'));
      await test.step('Verify memory item', async () => {
        await expect(page.getByTestId('memory-item')).toHaveCount(0);
      });

      await context.close();
    });
  });
});
