import { expect, test } from '@playwright/test';
import { openNotifications, setupPages } from '../../helpers/userFlows';

test.describe('user flow / daily question', () => {
  test('daily question reveal creates notifications and a garden detail', async ({ browser, request }) => {
    await test.step('Flow: daily question reveal creates notifications and a garden detail', async () => {
      const { contextA, contextB, pageA, pageB } = await setupPages(browser, request, 'daily');

      await test.step('Fill today answer input', async () => {
        await pageA.getByTestId('today-answer-input').fill('Ich habe mich heute gesehen gefühlt.');
      });

      await test.step('Click today answer submit', async () => {
        await pageA.getByTestId('today-answer-submit').click();
      });

      await test.step('Verify today waiting status', async () => {
        await expect(pageA.getByTestId('today-waiting-status')).toBeVisible();
      });

      await openNotifications(pageB);

      await test.step('Verify notification item', async () => {
        await expect(pageB.getByTestId('notification-item').first()).toContainText('Antwort');
      });

      await test.step('Open /today', async () => {
        await pageB.goto('/today');
      });

      await test.step('Fill today answer input', async () => {
        await pageB.getByTestId('today-answer-input').fill('Ich auch, besonders am Morgen.');
      });

      await test.step('Click today answer submit', async () => {
        await pageB.getByTestId('today-answer-submit').click();
      });

      await test.step('Verify today reveal answers', async () => {
        await expect(pageB.getByTestId('today-reveal-answers')).toBeVisible();
      });

      await pageA.reload();

      await test.step('Verify today reveal answers', async () => {
        await expect(pageA.getByTestId('today-reveal-answers')).toBeVisible();
      });

      await test.step('Click nav garden', async () => {
        await pageA.getByTestId('nav-garden').click();
      });

      await test.step('Verify garden progress', async () => {
        await expect(pageA.getByTestId('garden-progress')).toBeVisible();
      });

      await expect

        .poll(() =>

          pageA.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth)),

        )

        .toBeLessThanOrEqual(1);

      await expect

        .poll(() => pageA.evaluate(() => document.querySelector('.garden-scrollport')!.scrollWidth > document.querySelector('.garden-scrollport')!.clientWidth))

        .toBeTruthy();

      await test.step('Verify garden progress', async () => {
        await expect(pageA.getByTestId('garden-progress')).toContainText('Tagesfragen');
      });

      await test.step('Verify garden level progress', async () => {
        await expect(pageA.getByTestId('garden-level-progress')).toContainText('Noch 90 Punkte');
      });

      await test.step('Verify garden object', async () => {
        await expect(pageA.getByTestId('garden-object').first()).toHaveAttribute('title', /10 Punkte/);
      });

      await test.step('Verify garden legend item', async () => {
        await expect(pageA.getByTestId('garden-legend-item').first()).toBeVisible();
      });

      await test.step('Verify garden legend item', async () => {
        await expect(pageA.getByTestId('garden-legend-item').first()).toHaveAttribute('title', /.+/);
      });

      await test.step('Click garden edit toggle', async () => {
        await pageA.getByTestId('garden-edit-toggle').click();
      });

      await test.step('Click garden object', async () => {
        await pageA.getByTestId('garden-object').first().click();
      });

      await test.step('Verify garden detail', async () => {
        await expect(pageA.getByTestId('garden-detail')).toHaveCount(0);
      });

      await test.step('Click garden edit toggle', async () => {
        await pageA.getByTestId('garden-edit-toggle').click();
      });

      await test.step('Click garden object', async () => {
        await pageA.getByTestId('garden-object').first().click();
      });

      await test.step('Verify garden detail', async () => {
        await expect(pageA.getByTestId('garden-detail')).toContainText('Tagesfrage');
      });

      await test.step('Verify garden detail date', async () => {
        await expect(pageA.getByTestId('garden-detail-date')).toBeVisible();
      });

      await test.step('Verify garden detail celebration', async () => {
        await expect(pageA.getByTestId('garden-detail-celebration')).toContainText('gewachsen');
      });

      await test.step('Click garden detail close', async () => {
        await pageA.getByTestId('garden-detail-close').click();
      });

      await test.step('Verify garden history toggle', async () => {
        await expect(pageA.getByTestId('garden-history-toggle')).toContainText('Verlauf anzeigen');
      });

      await test.step('Click garden history toggle', async () => {
        await pageA.getByTestId('garden-history-toggle').click();
      });

      await test.step('Verify garden history next level', async () => {
        await expect(pageA.getByTestId('garden-history-next-level')).toContainText('Punkte');
      });

      const firstHistoryItem = pageA.getByTestId('garden-history-item').first();

      await firstHistoryItem.scrollIntoViewIfNeeded();

      await test.step('Verify expected result', async () => {
        await expect(firstHistoryItem).toBeVisible();
      });

      await test.step('Verify expected result', async () => {
        await expect(firstHistoryItem).toContainText('Tagesfrage');
      });

      await test.step('Verify expected result', async () => {
        await expect(firstHistoryItem).toContainText('+10');
      });

      await test.step('Verify garden history date', async () => {
        await expect(firstHistoryItem.getByTestId('garden-history-date')).toBeVisible();
      });

      await test.step('Verify garden history context', async () => {
        await expect(firstHistoryItem.getByTestId('garden-history-context')).toBeVisible();
      });

      await test.step('Verify expected result', async () => {
        await expect(firstHistoryItem).not.toContainText('conversation_flower');
      });

      await test.step('Verify garden history toggle', async () => {
        await expect(pageA.getByTestId('garden-history-toggle')).toContainText('Verlauf ausblenden');
      });

      await contextA.close();

      await contextB.close();
    });
  });
});
