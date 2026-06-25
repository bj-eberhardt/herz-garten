import { expect, test } from '@playwright/test';
import { authenticatePage, setupCoupleByApi } from '../../helpers/api';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('complete user flow / onboarding footer', () => {
  test('app version footer is only visible on onboarding and garden', async ({ page, request }) => {
    await test.step('Flow: app version footer is only visible on onboarding and garden', async () => {
      await test.step('Open /onboarding', async () => {
        await page.goto('/onboarding');
      });
      await test.step('Verify app version', async () => {
        await expect(page.getByTestId('app-version')).toBeVisible();
      });
      await test.step('Verify app version', async () => {
        await expect(page.getByTestId('app-version')).toHaveText(/^v\d+\.\d+\.\d+/);
      });

      const runId = testRunId();
      const userA = testUser('version-footer-a', runId);
      const userB = testUser('version-footer-b', runId);
      const { partnerA } = await setupCoupleByApi(request, userA, userB);

      await authenticatePage(page.context(), page, partnerA.token);
      await test.step('Verify expected result', async () => {
        await expect(page).toHaveURL(/\/today$/);
      });
      await test.step('Verify app version', async () => {
        await expect(page.getByTestId('app-version')).toHaveCount(0);
      });

      await test.step('Open /garden', async () => {
        await page.goto('/garden');
      });
      await test.step('Verify app version', async () => {
        await expect(page.getByTestId('app-version')).toBeVisible();
      });
      await test.step('Verify app version', async () => {
        await expect(page.getByTestId('app-version')).toHaveText(/^v\d+\.\d+\.\d+/);
      });

      await test.step('Open /settings', async () => {
        await page.goto('/settings');
      });
      await test.step('Verify app version', async () => {
        await expect(page.getByTestId('app-version')).toHaveCount(0);
      });
    });
  });
});
