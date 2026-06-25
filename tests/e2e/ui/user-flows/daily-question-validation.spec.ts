import { expect, test } from '@playwright/test';
import { expectRequiredFeedback, setupAuthenticatedPage } from '../../helpers/formValidation';

test.describe('user flow / daily question validation', () => {
  test('today marks missing answer and does not save it', async ({ browser, request }) => {
    await test.step('Flow: today marks missing answer and does not save it', async () => {
      const { context, page } = await setupAuthenticatedPage(browser, request, 'validation-today');

      await test.step('Open /today', async () => {
        await page.goto('/today');
      });
      await test.step('Fill today answer input', async () => {
        await page.getByTestId('today-answer-input').fill('');
      });
      await test.step('Click today answer submit', async () => {
        await page.getByTestId('today-answer-submit').click();
      });

      await expectRequiredFeedback(page.getByTestId('today-answer-input'));
      await test.step('Verify today waiting status', async () => {
        await expect(page.getByTestId('today-waiting-status')).toBeHidden();
      });

      await context.close();
    });
  });
});
