import { test } from '@playwright/test';
import { expectRequiredFeedback } from '../../helpers/formValidation';

test.describe('user flow / auth validation', () => {
  test('onboarding marks required register and login fields', async ({ page }) => {
    await test.step('Flow: onboarding marks required register and login fields', async () => {
      await test.step('Open /onboarding', async () => {
        await page.goto('/onboarding');
      });
      await test.step('Click auth mode register', async () => {
        await page.getByTestId('auth-mode-register').click();
      });
      await test.step('Click auth submit', async () => {
        await page.getByTestId('auth-submit').click();
      });

      await expectRequiredFeedback(page.getByTestId('auth-display-name'));
      await expectRequiredFeedback(page.getByTestId('auth-email'));
      await expectRequiredFeedback(page.getByTestId('auth-password'));

      await test.step('Click auth mode login', async () => {
        await page.getByTestId('auth-mode-login').click();
      });
      await test.step('Click auth submit', async () => {
        await page.getByTestId('auth-submit').click();
      });

      await expectRequiredFeedback(page.getByTestId('auth-email'));
      await expectRequiredFeedback(page.getByTestId('auth-password'));
    });
  });
});
