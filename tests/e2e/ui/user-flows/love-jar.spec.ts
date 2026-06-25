import { expect, test } from '@playwright/test';
import { apiPostRaw } from '../../helpers/api';
import { openNotifications, setupPages } from '../../helpers/userFlows';

test.describe('user flow / love jar', () => {
  test('love jar note can be drawn once per day and shows empty state for new couples', async ({ browser, request }) => {
    await test.step('Flow: love jar note can be drawn once per day and shows empty state for new couples', async () => {
      const { contextA, contextB, pageA, pageB, partnerA, partnerB } = await setupPages(browser, request, 'lovejar');

      await test.step('Open /love-jar', async () => {
        await pageB.goto('/love-jar');
      });
      await test.step('Verify love jar empty', async () => {
        await expect(pageB.getByTestId('love-jar-empty')).toBeVisible();
      });

      await test.step('Open /love-jar', async () => {
        await pageA.goto('/love-jar');
      });
      await test.step('Verify love jar category', async () => {
        await expect(pageA.getByTestId('love-jar-category')).toContainText('Kompliment');
      });
      await test.step('Verify love jar note input', async () => {
        await expect(pageA.getByTestId('love-jar-note-input')).not.toHaveValue('');
      });
      await test.step('Select love jar category', async () => {
        await pageA.getByTestId('love-jar-category').selectOption('compliment');
      });
      await test.step('Fill love jar note input', async () => {
        await pageA.getByTestId('love-jar-note-input').fill('Danke für deine Ruhe.');
      });
      await test.step('Click love jar save', async () => {
        await pageA.getByTestId('love-jar-save').click();
      });

      await openNotifications(pageB);
      await test.step('Verify notification item', async () => {
        await expect(pageB.getByTestId('notification-item').first()).toContainText('Zettel');
      });
      await test.step('Verify notification item', async () => {
        await expect(pageB.getByTestId('notification-item').first()).toContainText(partnerA.user.displayName);
      });

      await test.step('Open /love-jar', async () => {
        await pageB.goto('/love-jar');
      });
      await test.step('Click love jar draw', async () => {
        await pageB.getByTestId('love-jar-draw').click();
      });
      const drawnNote = pageB.getByTestId('love-jar-note').first();
      await test.step('Verify expected result', async () => {
        await expect(drawnNote).toContainText('Danke für deine Ruhe.');
      });
      await test.step('Verify expected result', async () => {
        await expect(drawnNote).toContainText('Kompliment');
      });
      await test.step('Verify expected result', async () => {
        await expect(drawnNote).not.toContainText('compliment');
      });
      await test.step('Verify love jar draw', async () => {
        await expect(pageB.getByTestId('love-jar-draw')).toBeDisabled();
      });
      await test.step('Verify love jar draw hint', async () => {
        await expect(pageB.getByTestId('love-jar-draw-hint')).toContainText('heute schon');
      });
      const duplicateDraw = await apiPostRaw(request, '/api/love-jar/draw', {}, partnerB.token);
      await test.step('Verify expected result', async () => {
        expect(duplicateDraw.status()).toBe(409);
      });
      const duplicateDrawPayload = await duplicateDraw.json();
      await test.step('Verify expected result', async () => {
        expect(duplicateDrawPayload).toEqual(
          expect.objectContaining({
            errorKey: 'loveJar.alreadyDrawnToday',
          }),
        );
      });

      await test.step('Click nav garden', async () => {
        await pageB.getByTestId('nav-garden').click();
      });
      await test.step('Click garden object', async () => {
        await pageB.getByTestId('garden-object').first().click();
      });
      await test.step('Verify garden detail', async () => {
        await expect(pageB.getByTestId('garden-detail')).toContainText('Kompliment');
      });
      await test.step('Verify garden detail', async () => {
        await expect(pageB.getByTestId('garden-detail')).not.toContainText('compliment');
      });

      await contextA.close();
      await contextB.close();
    });
  });
});
