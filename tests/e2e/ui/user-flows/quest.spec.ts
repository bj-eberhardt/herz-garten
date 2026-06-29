import { expect, test } from '@playwright/test';
import { apiGet } from '../../helpers/api';
import { openNotifications, setupPages } from '../../helpers/userFlows';

test.describe('user flow / quest', () => {
  test('quests move through open active and completed states with partner confirmation', async ({ browser, request }) => {
    await test.step('Flow: quests move through open active and completed states with partner confirmation', async () => {
      const { contextA, contextB, pageA, pageB, partnerA } = await setupPages(browser, request, 'quest');
      const payload = await apiGet<{ quests: Array<{ id: string; title: string; requiresBothPartners: boolean; }>; }>(
        request,
        '/api/quests',
        partnerA.token,
      );
      const quest = payload.quests.find((item) => item.requiresBothPartners) ?? payload.quests[0];

      await test.step('Open /quests', async () => {
        await pageA.goto('/quests');
      });
      await test.step('Verify quests open section', async () => {
        await expect(pageA.getByTestId('quests-open-section')).toBeVisible();
      });
      const questCardA = pageA.getByTestId('quest-card').filter({ hasText: quest.title }).first();
      await test.step('Click quest action', async () => {
        await questCardA.getByTestId('quest-action').click();
      });
      await test.step('Verify quests active section', async () => {
        await expect(pageA.getByTestId('quests-active-section')).toBeVisible();
      });
      await test.step('Click quest card', async () => {
        await pageA.getByTestId('quest-card').filter({ hasText: quest.title }).getByTestId('quest-action').click();
      });

      await openNotifications(pageB);
      await test.step('Verify notification item', async () => {
        await expect(pageB.getByTestId('notification-item').first()).toContainText('Aufgabe');
      });

      await test.step('Open /quests', async () => {
        await pageB.goto('/quests');
      });
      await test.step('Verify quests active section', async () => {
        await expect(pageB.getByTestId('quests-active-section')).toBeVisible();
      });
      await test.step('Click quest card', async () => {
        await pageB.getByTestId('quest-card').filter({ hasText: quest.title }).getByTestId('quest-action').click();
      });
      await test.step('Verify quests completed section', async () => {
        await expect(pageB.getByTestId('quests-completed-section')).toBeVisible();
      });

      await test.step('Click nav garden', async () => {
        await pageB.getByTestId('nav-garden').click();
      });
      await test.step('Verify garden object', async () => {
        await expect(pageB.getByTestId('garden-object').first()).toBeVisible();
      });

      await contextA.close();
      await contextB.close();
    });
  });

  test('quest filters narrow visible quest suggestions', async ({ browser, request }) => {
    await test.step('Flow: quest filters narrow visible quest suggestions', async () => {
      const { contextA, contextB, pageA } = await setupPages(browser, request, 'quest-filters');

      await test.step('Open /quests', async () => {
        await pageA.goto('/quests');
      });
      await test.step('Verify quest filters', async () => {
        await expect(pageA.getByTestId('quest-filters')).toBeVisible();
      });
      await test.step('Verify quest card', async () => {
        await expect(pageA.getByTestId('quest-card').first()).toBeVisible();
      });
      const initialCount = await pageA.getByTestId('quest-card').count();
      await test.step('Assert: quest list has multiple cards', async () => {
        expect(initialCount).toBeGreaterThan(3);
      });

      await test.step('Select quest filter category', async () => {
        await pageA.getByTestId('quest-filter-category').selectOption('long_distance');
      });
      await test.step('Verify quest card', async () => {
        await expect(pageA.getByTestId('quest-card').first()).toBeVisible();
      });
      await expect.poll(() => pageA.getByTestId('quest-card').count()).toBeLessThan(initialCount);
      const filteredCount = await pageA.getByTestId('quest-card').count();
      await test.step('Assert: quest list has multiple cards', async () => {
        expect(filteredCount).toBeLessThan(initialCount);
      });
      await test.step('Verify quest card', async () => {
        await expect(pageA.getByTestId('quest-card').first()).toContainText(/Aktueller|Fern|Song|Sprachnachricht|Wiedersehen/);
      });

      await test.step('Select quest filter duration', async () => {
        await pageA.getByTestId('quest-filter-duration').selectOption('5');
      });
      await test.step('Verify quest card', async () => {
        await expect(pageA.getByTestId('quest-card').first()).toBeVisible();
      });

      await contextA.close();
      await contextB.close();
    });
  });
});
