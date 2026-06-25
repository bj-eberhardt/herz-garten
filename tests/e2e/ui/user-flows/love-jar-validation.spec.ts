import { expect, test } from '@playwright/test';
import { expectRequiredFeedback, setupAuthenticatedPage } from '../../helpers/formValidation';

test.describe('user flow / love jar validation', () => {
  test('love jar marks missing note text and does not create a note', async ({ browser, request }) => {
    await test.step('Flow: love jar marks missing note text and does not create a note', async () => {
      const { context, page } = await setupAuthenticatedPage(browser, request, 'validation-lovejar');

      await test.step('Open /love-jar', async () => {
        await page.goto('/love-jar');
      });
      await test.step('Verify love jar note input', async () => {
        await expect(page.getByTestId('love-jar-note-input')).toBeVisible();
      });
      await test.step('Verify love jar note input', async () => {
        await expect(page.getByTestId('love-jar-note-input')).not.toHaveValue('');
      });
      await test.step('Fill love jar note input', async () => {
        await page.getByTestId('love-jar-note-input').fill('');
      });
      await test.step('Verify love jar note input', async () => {
        await expect(page.getByTestId('love-jar-note-input')).toHaveValue('');
      });
      await test.step('Verify love jar save', async () => {
        await expect(page.getByTestId('love-jar-save')).toBeEnabled();
      });
      await test.step('Click love jar save', async () => {
        await page.getByTestId('love-jar-save').click();
      });

      await expectRequiredFeedback(page.getByTestId('love-jar-note-input'));
      await test.step('Verify love jar note', async () => {
        await expect(page.getByTestId('love-jar-note')).toHaveCount(0);
      });

      await context.close();
    });
  });
});
