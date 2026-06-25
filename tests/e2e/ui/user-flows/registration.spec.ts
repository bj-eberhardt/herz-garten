import { expect, test } from '@playwright/test';
import { registerViaUi } from '../../helpers/auth';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user flow / registration', () => {
  test('guest onboarding only shows auth form and register advertisement', async ({ page }) => {
    await test.step('Flow: guest onboarding only shows auth form and register advertisement', async () => {
      await test.step('Open /onboarding', async () => {
        await page.goto('/onboarding');
      });

      await test.step('Verify auth form', async () => {
        await expect(page.getByTestId('auth-form')).toBeVisible();
      });
      await test.step('Verify auth display name', async () => {
        await expect(page.getByTestId('auth-display-name')).toBeVisible();
      });
      await test.step('Verify onboarding ad', async () => {
        await expect(page.getByTestId('onboarding-ad')).toBeVisible();
      });
      await test.step('Verify onboarding returning', async () => {
        await expect(page.getByTestId('onboarding-returning')).toHaveCount(0);
      });
      await test.step('Verify feature explainer onboarding', async () => {
        await expect(page.getByTestId('feature-explainer-onboarding')).toHaveCount(0);
      });
      await test.step('Verify nav garden', async () => {
        await expect(page.getByTestId('nav-garden')).toHaveCount(0);
      });
      await test.step('Verify nav today', async () => {
        await expect(page.getByTestId('nav-today')).toHaveCount(0);
      });
    });
  });

  test('successful registration stores email in local storage', async ({ page }) => {
    await test.step('Flow: successful registration stores email in local storage', async () => {
      const user = testUser('remember-email', testRunId());
      await registerViaUi(page, user);
      await expect.poll(() => page.evaluate(() => window.localStorage.getItem('herzgarten_remembered_email'))).toBe(user.email);
      await test.step('Verify feature explainer onboarding', async () => {
        await expect(page.getByTestId('feature-explainer-onboarding')).toBeVisible();
      });
      await test.step('Verify nav garden', async () => {
        await expect(page.getByTestId('nav-garden')).toBeVisible();
      });
      await test.step('Verify onboarding join option', async () => {
        await expect(page.getByTestId('onboarding-join-option')).toContainText('Partnercode eingeben');
      });
      await test.step('Verify onboarding join option', async () => {
        await expect(page.getByTestId('onboarding-join-option')).toContainText('Wenn dein Partner den Garten schon angelegt hat');
      });
      await test.step('Verify onboarding create option', async () => {
        await expect(page.getByTestId('onboarding-create-option')).toContainText('Neuen Garten anlegen');
      });
      await test.step('Verify onboarding create option', async () => {
        await expect(page.getByTestId('onboarding-create-option')).toContainText('Danach erhältst du einen Partnercode');
      });
      await test.step('Verify create couple form', async () => {
        await expect(page.getByTestId('create-couple-form')).toBeVisible();
      });
      await test.step('Verify join couple form', async () => {
        await expect(page.getByTestId('join-couple-form')).toBeVisible();
      });
    });
  });
});
