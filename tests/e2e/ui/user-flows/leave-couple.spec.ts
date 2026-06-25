import { expect, test } from '@playwright/test';
import { setupPages } from '../../helpers/userFlows';

test.describe('user flow / leave couple', () => {
  test('settings allow leaving the couple room', async ({ browser, request }) => {
    await test.step('Flow: settings allow leaving the couple room', async () => {
      const { contextA, contextB, pageA } = await setupPages(browser, request, 'leave');

      await test.step('Open /settings', async () => {
        await pageA.goto('/settings');
      });
      await test.step('Click settings leave couple', async () => {
        await pageA.getByTestId('settings-leave-couple').click();
      });
      await test.step('Verify settings confirm dialog', async () => {
        await expect(pageA.getByTestId('settings-confirm-dialog')).toContainText('Paarraum verlassen');
      });
      await test.step('Verify settings confirm dialog', async () => {
        await expect(pageA.getByTestId('settings-confirm-dialog')).toContainText('sofort und unwiderruflich');
      });
      await test.step('Verify settings confirm dialog', async () => {
        await expect(pageA.getByTestId('settings-confirm-dialog')).not.toContainText('leere Raum gelöscht');
      });
      await test.step('Verify settings confirm accept', async () => {
        await expect(pageA.getByTestId('settings-confirm-accept')).toContainText('Paarraum verlassen');
      });
      await test.step('Click settings confirm accept', async () => {
        await pageA.getByTestId('settings-confirm-accept').click();
      });
      await test.step('Verify expected result', async () => {
        await expect(pageA).toHaveURL(/\/onboarding$/);
      });
      await test.step('Verify join couple form', async () => {
        await expect(pageA.getByTestId('join-couple-form')).toBeVisible();
      });

      await contextA.close();
      await contextB.close();
    });
  });
});
