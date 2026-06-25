import { expect, test } from '@playwright/test';
import { expectRequiredFeedback, setupAuthenticatedPage } from '../../helpers/formValidation';

test.describe('user flow / know me validation', () => {
  test('know me marks missing question and first two answers', async ({ browser, request }) => {
    await test.step('Flow: know me marks missing question and first two answers', async () => {
      const { context, page } = await setupAuthenticatedPage(browser, request, 'validation-knowme');

      await test.step('Open /know-me', async () => {
        await page.goto('/know-me');
      });
      await test.step('Click know me create submit', async () => {
        await page.getByTestId('know-me-create-submit').click();
      });

      await expectRequiredFeedback(page.getByTestId('know-me-question-input'));
      await expectRequiredFeedback(page.getByTestId('know-me-option-0'));
      await expectRequiredFeedback(page.getByTestId('know-me-option-1'));
      await expect
        .poll(async () => {
          const optionOneHeight = await page.getByTestId('know-me-option-1').evaluate((element) => element.closest('label')?.getBoundingClientRect().height ?? 0);
          const optionTwoHeight = await page.getByTestId('know-me-option-2').evaluate((element) => element.closest('label')?.getBoundingClientRect().height ?? 0);
          return optionOneHeight <= optionTwoHeight + 2;
        })
        .toBe(true);
      await test.step('Verify know me own card', async () => {
        await expect(page.getByTestId('know-me-own-card')).toHaveCount(0);
      });

      await context.close();
    });
  });
});
