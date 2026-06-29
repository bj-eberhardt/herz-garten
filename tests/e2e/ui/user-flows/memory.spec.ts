import { expect, test } from '@playwright/test';
import { openNotifications, setupPages } from '../../helpers/userFlows';

test.describe('user flow / memory', () => {
  test('memory creates timeline entry notification and garden detail', async ({ browser, request }) => {
    await test.step('Flow: memory creates timeline entry notification and garden detail', async () => {
      const { contextA, contextB, pageA, pageB } = await setupPages(browser, request, 'memory');

      await test.step('Open /memories', async () => {
        await pageA.goto('/memories');
      });
      await test.step('Fill memory title', async () => {
        await pageA.getByTestId('memory-title').fill('Unser E2E Moment');
      });
      await test.step('Fill memory description', async () => {
        await pageA.getByTestId('memory-description').fill('Ein kurzer Test für die Timeline.');
      });
      await test.step('Fill memory date', async () => {
        await pageA.getByTestId('memory-date').fill('2026-06-09');
      });
      await test.step('Verify memory category', async () => {
        await expect(pageA.getByTestId('memory-category')).toContainText('Alltag');
      });
      await test.step('Select memory category', async () => {
        await pageA.getByTestId('memory-category').selectOption('everyday');
      });
      await test.step('Click memory save', async () => {
        await pageA.getByTestId('memory-save').click();
      });
      const memoryItem = pageA.getByTestId('memory-item').first();
      await test.step('Assert: saved memory shows localized category', async () => {
        await expect(memoryItem).toContainText('Unser E2E Moment');
        await expect(memoryItem).toContainText('Alltag');
        await expect(memoryItem).not.toContainText('everyday');
      });

      await openNotifications(pageB);
      await test.step('Verify notification item', async () => {
        await expect(pageB.getByTestId('notification-item').first()).toContainText('Erinnerung');
      });

      await test.step('Click nav garden', async () => {
        await pageA.getByTestId('nav-garden').click();
      });
      await test.step('Verify garden progress', async () => {
        await expect(pageA.getByTestId('garden-progress')).toContainText('Erinnerungen');
      });
      await test.step('Click garden object', async () => {
        await pageA.getByTestId('garden-object').first().click();
      });
      await test.step('Verify garden detail', async () => {
        await expect(pageA.getByTestId('garden-detail')).toContainText('Unser E2E Moment');
      });
      await test.step('Verify garden detail', async () => {
        await expect(pageA.getByTestId('garden-detail')).toContainText('Alltag');
      });
      await test.step('Verify garden detail', async () => {
        await expect(pageA.getByTestId('garden-detail')).not.toContainText('everyday');
      });
      await test.step('Verify garden detail celebration', async () => {
        await expect(pageA.getByTestId('garden-detail-celebration')).toContainText('bewahrt');
      });

      await contextA.close();
      await contextB.close();
    });
  });
});
