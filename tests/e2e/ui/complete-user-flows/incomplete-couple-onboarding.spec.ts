import { expect, test } from '@playwright/test';
import { authenticatePage, createCoupleByApi, registerByApi } from '../../helpers/api';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('complete user flow / incomplete couple onboarding', () => {
  test('incomplete couple stays on onboarding and only shows garden navigation', async ({ browser, request }) => {
    await test.step('Flow: incomplete couple stays on onboarding and only shows garden navigation', async () => {
      const runId = testRunId();
      const owner = await registerByApi(request, testUser('leave-empty-owner', runId));
      const couple = await createCoupleByApi(request, owner.token);
      const context = await browser.newContext();
      const page = await context.newPage();
      await authenticatePage(context, page, owner.token);

      await test.step('Open /settings', async () => {
        await page.goto('/settings');
      });
      await test.step('Verify expected result', async () => {
        await expect(page).toHaveURL(/\/settings$/);
      });
      await test.step('Verify settings profile panel', async () => {
        await expect(page.getByTestId('settings-profile-panel')).toBeVisible();
      });
      await test.step('Verify settings couple code', async () => {
        await expect(page.getByTestId('settings-couple-code')).toHaveText(couple.couple.inviteCode);
      });
      await test.step('Verify nav garden', async () => {
        await expect(page.getByTestId('nav-garden')).toBeVisible();
      });
      await test.step('Verify nav settings', async () => {
        await expect(page.getByTestId('nav-settings')).toBeVisible();
      });
      await test.step('Verify nav today', async () => {
        await expect(page.getByTestId('nav-today')).toBeDisabled();
      });
      await test.step('Verify nav quests', async () => {
        await expect(page.getByTestId('nav-quests')).toBeDisabled();
      });
      await test.step('Verify nav know me', async () => {
        await expect(page.getByTestId('nav-know-me')).toBeDisabled();
      });
      await test.step('Verify nav love jar', async () => {
        await expect(page.getByTestId('nav-love-jar')).toBeDisabled();
      });
      await test.step('Verify nav memories', async () => {
        await expect(page.getByTestId('nav-memories')).toBeDisabled();
      });

      await context.close();
    });
  });
});
