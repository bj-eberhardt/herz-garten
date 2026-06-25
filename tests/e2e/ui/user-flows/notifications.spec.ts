import { expect, test } from '@playwright/test';
import { setupPages } from '../../helpers/userFlows';

test.describe('user flow / notifications', () => {
  test('notifications can be opened and marked read', async ({ browser, request }) => {
    await test.step('Flow: notifications can be opened and marked read', async () => {
      const { contextA, contextB, pageA, pageB } = await setupPages(browser, request, 'notifications');

      await test.step('Open /love-jar', async () => {
        await pageA.goto('/love-jar');
      });
      await test.step('Fill love jar note input', async () => {
        await pageA.getByTestId('love-jar-note-input').fill('Ein Hinweis für dich.');
      });
      await test.step('Click love jar save', async () => {
        await pageA.getByTestId('love-jar-save').click();
      });

      await test.step('Open /today', async () => {
        await pageB.goto('/today');
      });
      await pageB.reload();
      await test.step('Verify notification badge', async () => {
        await expect(pageB.getByTestId('notification-badge')).toBeVisible();
      });
      await test.step('Click nav notifications', async () => {
        await pageB.getByTestId('nav-notifications').click();
      });
      await test.step('Click notification item', async () => {
        await pageB.getByTestId('notification-item').first().click();
      });
      await test.step('Verify notification detail', async () => {
        await expect(pageB.getByTestId('notification-detail')).toBeVisible();
      });
      await test.step('Verify notification badge', async () => {
        await expect(pageB.getByTestId('notification-badge')).toBeHidden();
      });
      await test.step('Click notification detail cta', async () => {
        await pageB.getByTestId('notification-detail-cta').click();
      });
      await test.step('Verify expected result', async () => {
        await expect(pageB).toHaveURL(/\/love-jar$/);
      });

      await test.step('Open /memories', async () => {
        await pageA.goto('/memories');
      });
      await test.step('Fill memory title', async () => {
        await pageA.getByTestId('memory-title').fill('Noch ein Hinweis');
      });
      await test.step('Fill memory description', async () => {
        await pageA.getByTestId('memory-description').fill('Damit alle gelesen getestet wird.');
      });
      await test.step('Fill memory date', async () => {
        await pageA.getByTestId('memory-date').fill('2026-06-09');
      });
      await test.step('Click memory save', async () => {
        await pageA.getByTestId('memory-save').click();
      });

      await test.step('Open /notifications', async () => {
        await pageB.goto('/notifications');
      });
      await test.step('Verify notifications read all', async () => {
        await expect(pageB.getByTestId('notifications-read-all')).toBeEnabled();
      });
      await test.step('Click notifications read all', async () => {
        await pageB.getByTestId('notifications-read-all').click();
      });
      await test.step('Verify notification badge', async () => {
        await expect(pageB.getByTestId('notification-badge')).toBeHidden();
      });

      await contextA.close();
      await contextB.close();
    });
  });
});
