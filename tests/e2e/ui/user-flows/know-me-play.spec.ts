import { expect, test } from '@playwright/test';
import { openNotifications, setupPages } from '../../helpers/userFlows';

test.describe('user flow / know me play', () => {
  test('know me game notifies partner and rewards correct guesses', async ({ browser, request }) => {
    await test.step('Flow: know me game notifies partner and rewards correct guesses', async () => {
      const { contextA, contextB, pageA, pageB } = await setupPages(browser, request, 'knowme');

      await test.step('Open /know-me', async () => {
        await pageA.goto('/know-me');
      });
      await test.step('Fill know me question input', async () => {
        await pageA.getByTestId('know-me-question-input').fill('Was ist mein heimlicher Lieblingssnack?');
      });
      await test.step('Fill know me option 0', async () => {
        await pageA.getByTestId('know-me-option-0').fill('Schokolade');
      });
      await test.step('Fill know me option 1', async () => {
        await pageA.getByTestId('know-me-option-1').fill('Salzbrezeln');
      });
      await test.step('Fill know me option 2', async () => {
        await pageA.getByTestId('know-me-option-2').fill('Apfel');
      });
      await test.step('Click know me create submit', async () => {
        await pageA.getByTestId('know-me-create-submit').click();
      });
      await test.step('Verify know me own card', async () => {
        await expect(pageA.getByTestId('know-me-own-card').first()).toContainText('Lieblingssnack');
      });

      await openNotifications(pageB);
      await test.step('Verify notification item', async () => {
        await expect(pageB.getByTestId('notification-item').first()).toContainText('Kennst-du-mich');
      });
      await test.step('Click notification item', async () => {
        await pageB.getByTestId('notification-item').first().click();
      });
      await test.step('Click notification detail cta', async () => {
        await pageB.getByTestId('notification-detail-cta').click();
      });
      await test.step('Verify expected result', async () => {
        await expect(pageB).toHaveURL(/\/know-me$/);
      });

      await test.step('Click know me open card', async () => {
        await pageB
          .getByTestId('know-me-open-card')
          .first()
          .getByTestId('know-me-answer-option')
          .filter({ hasText: 'Schokolade' })
          .click();
      });
      await test.step('Click know me guess submit', async () => {
        await pageB.getByTestId('know-me-guess-submit').click();
      });
      await test.step('Verify know me history card', async () => {
        await expect(pageB.getByTestId('know-me-history-card').first()).toContainText('Treffer');
      });
      await test.step('Verify know me history card', async () => {
        await expect(pageB.getByTestId('know-me-history-card').first()).toContainText('Schokolade');
      });

      await openNotifications(pageA);
      const answeredNotification = pageA.getByTestId('notification-item').first();
      await test.step('Verify expected result', async () => {
        await expect(answeredNotification).toContainText('Kennst-du-mich');
      });
      await test.step('Verify notification knowme inline', async () => {
        await expect(answeredNotification.getByTestId('notification-knowme-inline')).toContainText('Was ist mein heimlicher Lieblingssnack?');
      });
      await test.step('Verify notification knowme inline', async () => {
        await expect(answeredNotification.getByTestId('notification-knowme-inline')).toContainText('Schokolade');
      });
      await test.step('Click UI control', async () => {
        await answeredNotification.click();
      });
      await test.step('Verify notification detail', async () => {
        await expect(pageA.getByTestId('notification-detail')).toContainText('Was ist mein heimlicher Lieblingssnack?');
      });
      await test.step('Verify notification detail', async () => {
        await expect(pageA.getByTestId('notification-detail')).toContainText('Richtig:');
      });
      await test.step('Verify notification detail', async () => {
        await expect(pageA.getByTestId('notification-detail')).toContainText('Geraten:');
      });
      await test.step('Verify notification detail', async () => {
        await expect(pageA.getByTestId('notification-detail')).toContainText('Schokolade');
      });

      await test.step('Click nav garden', async () => {
        await pageB.getByTestId('nav-garden').click();
      });
      await test.step('Click garden object', async () => {
        await pageB.getByTestId('garden-object').first().click();
      });
      await test.step('Verify garden detail', async () => {
        await expect(pageB.getByTestId('garden-detail')).toContainText('Wie gut kennst du mich?');
      });
      await test.step('Verify garden detail celebration', async () => {
        await expect(pageB.getByTestId('garden-detail-celebration')).toContainText('besondere Blume');
      });

      await contextA.close();
      await contextB.close();
    });
  });
});
