import { expect, test } from '@playwright/test';
import { setupPages } from '../../helpers/userFlows';

test.describe('user flow / know me catalog', () => {
  test('know me catalog suggestions can be selected and are hidden per author after use', async ({ browser, request }) => {
    await test.step('Flow: know me catalog suggestions can be selected and are hidden per author after use', async () => {
      const { contextA, contextB, pageA, pageB } = await setupPages(browser, request, 'knowme-catalog');
      const catalogQuestion = 'Was wäre mein perfekter Sonntag?';

      await test.step('Open /know-me', async () => {
        await pageA.goto('/know-me');
      });
      await test.step('Fill know me question input', async () => {
        await pageA.getByTestId('know-me-question-input').fill('Sonntag');
      });
      await test.step('Verify know me catalog suggestions', async () => {
        await expect(pageA.getByTestId('know-me-catalog-suggestions')).toBeVisible();
      });
      await test.step('Click know me catalog suggestion', async () => {
        await pageA.getByTestId('know-me-catalog-suggestion').filter({ hasText: catalogQuestion }).click();
      });
      await test.step('Verify know me question input', async () => {
        await expect(pageA.getByTestId('know-me-question-input')).toHaveValue(catalogQuestion);
      });
      await test.step('Verify know me question source', async () => {
        await expect(pageA.getByTestId('know-me-question-source')).toContainText('Katalog');
      });

      await test.step('Fill know me option 0', async () => {
        await pageA.getByTestId('know-me-option-0').fill('Lange schlafen und Kaffee');
      });
      await test.step('Fill know me option 1', async () => {
        await pageA.getByTestId('know-me-option-1').fill('Um sechs Uhr joggen');
      });
      await test.step('Click know me create submit', async () => {
        await pageA.getByTestId('know-me-create-submit').click();
      });
      await test.step('Verify know me own card', async () => {
        await expect(pageA.getByTestId('know-me-own-card').first()).toContainText(catalogQuestion);
      });
      await test.step('Fill know me question input', async () => {
        await pageA.getByTestId('know-me-question-input').fill('Sonntag');
      });
      await test.step('Verify know me catalog suggestion', async () => {
        await expect(
          pageA.getByTestId('know-me-catalog-suggestion').filter({ hasText: catalogQuestion }),
        ).toHaveCount(0);
      });

      await test.step('Open /know-me', async () => {
        await pageB.goto('/know-me');
      });
      await test.step('Fill know me question input', async () => {
        await pageB.getByTestId('know-me-question-input').fill('Sonntag');
      });
      await test.step('Verify know me catalog suggestions', async () => {
        await expect(pageB.getByTestId('know-me-catalog-suggestions')).toContainText(catalogQuestion);
      });
      await test.step('Click know me open card', async () => {
        await pageB
          .getByTestId('know-me-open-card')
          .first()
          .getByTestId('know-me-answer-option')
          .filter({ hasText: 'Lange schlafen und Kaffee' })
          .click();
      });
      await test.step('Click know me guess submit', async () => {
        await pageB.getByTestId('know-me-guess-submit').click();
      });
      await test.step('Verify know me history card', async () => {
        await expect(pageB.getByTestId('know-me-history-card').first()).toContainText('Treffer');
      });

      await contextA.close();
      await contextB.close();
    });
  });
});
