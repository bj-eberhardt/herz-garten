import { expect, test, type APIRequestContext, type Browser, type Page } from '@playwright/test';
import { apiGet, apiPost, authenticatePage, setupCoupleByApi } from './helpers/api';
import { testRunId, testUser } from './helpers/testUsers';

async function setupPages(browser: Browser, request: APIRequestContext, prefix: string) {
  const runId = testRunId();
  const userA = testUser(`${prefix}-a`, runId);
  const userB = testUser(`${prefix}-b`, runId);
  const { partnerA, partnerB } = await setupCoupleByApi(request, userA, userB);
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  await authenticatePage(contextA, pageA, partnerA.token);
  await authenticatePage(contextB, pageB, partnerB.token);
  return { contextA, contextB, pageA, pageB, partnerA, partnerB };
}

async function openNotifications(page: Page) {
  await page.goto('/notifications');
  await expect(page.getByTestId('notification-item').first()).toBeVisible();
}

test('daily question reveal creates notifications and a garden detail', async ({ browser, request }) => {
  const { contextA, contextB, pageA, pageB } = await setupPages(browser, request, 'daily');

  await pageA.getByTestId('today-answer-input').fill('Ich habe mich heute gesehen gefuehlt.');
  await pageA.getByTestId('today-answer-submit').click();
  await expect(pageA.getByTestId('today-waiting-status')).toBeVisible();

  await openNotifications(pageB);
  await expect(pageB.getByTestId('notification-item').first()).toContainText('Antwort');

  await pageB.goto('/today');
  await pageB.getByTestId('today-answer-input').fill('Ich auch, besonders am Morgen.');
  await pageB.getByTestId('today-answer-submit').click();
  await expect(pageB.getByTestId('today-reveal-answers')).toBeVisible();

  await pageA.reload();
  await expect(pageA.getByTestId('today-reveal-answers')).toBeVisible();

  await pageA.getByTestId('nav-garden').click();
  await pageA.getByTestId('garden-object').first().click();
  await expect(pageA.getByTestId('garden-detail')).toContainText('Tagesfrage');

  await contextA.close();
  await contextB.close();
});

test('quests move through open active and completed states with partner confirmation', async ({ browser, request }) => {
  const { contextA, contextB, pageA, pageB, partnerA } = await setupPages(browser, request, 'quest');
  const payload = await apiGet<{ quests: Array<{ id: string; title: string; requiresBothPartners: boolean }> }>(
    request,
    '/api/quests',
    partnerA.token,
  );
  const quest = payload.quests.find((item) => item.requiresBothPartners) ?? payload.quests[0];

  await pageA.goto('/quests');
  await expect(pageA.getByTestId('quests-open-section')).toBeVisible();
  const questCardA = pageA.getByTestId('quest-card').filter({ hasText: quest.title }).first();
  await questCardA.getByTestId('quest-action').click();
  await expect(pageA.getByTestId('quests-active-section')).toBeVisible();
  await pageA.getByTestId('quest-card').filter({ hasText: quest.title }).getByTestId('quest-action').click();

  await openNotifications(pageB);
  await expect(pageB.getByTestId('notification-item').first()).toContainText('Quest');

  await pageB.goto('/quests');
  await expect(pageB.getByTestId('quests-active-section')).toBeVisible();
  await pageB.getByTestId('quest-card').filter({ hasText: quest.title }).getByTestId('quest-action').click();
  await expect(pageB.getByTestId('quests-completed-section')).toBeVisible();

  await pageB.getByTestId('nav-garden').click();
  await expect(pageB.getByTestId('garden-object').first()).toBeVisible();

  await contextA.close();
  await contextB.close();
});

test('quest filters narrow visible quest suggestions', async ({ browser, request }) => {
  const { contextA, contextB, pageA } = await setupPages(browser, request, 'quest-filters');

  await pageA.goto('/quests');
  await expect(pageA.getByTestId('quest-filters')).toBeVisible();
  const initialCount = await pageA.getByTestId('quest-card').count();
  expect(initialCount).toBeGreaterThan(3);

  await pageA.getByTestId('quest-filter-category').selectOption('long_distance');
  await expect(pageA.getByTestId('quest-card').first()).toBeVisible();
  const filteredCount = await pageA.getByTestId('quest-card').count();
  expect(filteredCount).toBeLessThan(initialCount);
  await expect(pageA.getByTestId('quest-card').first()).toContainText(/Aktueller|Fern|Song|Sprachnachricht|Wiedersehen/);

  await pageA.getByTestId('quest-filter-duration').selectOption('5');
  await expect(pageA.getByTestId('quest-card').first()).toBeVisible();

  await contextA.close();
  await contextB.close();
});

test('love jar note can be drawn once per day and shows empty state for new couples', async ({ browser, request }) => {
  const { contextA, contextB, pageA, pageB } = await setupPages(browser, request, 'lovejar');

  await pageB.goto('/love-jar');
  await expect(pageB.getByTestId('love-jar-empty')).toBeVisible();

  await pageA.goto('/love-jar');
  await pageA.getByTestId('love-jar-category').selectOption('compliment');
  await pageA.getByTestId('love-jar-note-input').fill('Danke fuer deine Ruhe.');
  await pageA.getByTestId('love-jar-save').click();

  await openNotifications(pageB);
  await expect(pageB.getByTestId('notification-item').first()).toContainText('Zettel');

  await pageB.goto('/love-jar');
  await pageB.getByTestId('love-jar-draw').click();
  await expect(pageB.getByTestId('love-jar-note').first()).toContainText('Danke fuer deine Ruhe.');
  await expect(pageB.getByTestId('love-jar-draw')).toBeDisabled();
  await expect(pageB.getByTestId('love-jar-draw-hint')).toContainText('heute schon');

  await contextA.close();
  await contextB.close();
});

test('memory creates timeline entry notification and garden detail', async ({ browser, request }) => {
  const { contextA, contextB, pageA, pageB } = await setupPages(browser, request, 'memory');

  await pageA.goto('/memories');
  await pageA.getByTestId('memory-title').fill('Unser E2E Moment');
  await pageA.getByTestId('memory-description').fill('Ein kurzer Test fuer die Timeline.');
  await pageA.getByTestId('memory-date').fill('2026-06-09');
  await pageA.getByTestId('memory-category').selectOption('everyday');
  await pageA.getByTestId('memory-save').click();
  await expect(pageA.getByTestId('memory-item').first()).toContainText('Unser E2E Moment');

  await openNotifications(pageB);
  await expect(pageB.getByTestId('notification-item').first()).toContainText('Erinnerung');

  await pageA.getByTestId('nav-garden').click();
  await pageA.getByTestId('garden-object').first().click();
  await expect(pageA.getByTestId('garden-detail')).toContainText('Unser E2E Moment');

  await contextA.close();
  await contextB.close();
});

test('notifications can be opened and marked read', async ({ browser, request }) => {
  const { contextA, contextB, pageA, pageB } = await setupPages(browser, request, 'notifications');

  await pageA.goto('/love-jar');
  await pageA.getByTestId('love-jar-note-input').fill('Ein Hinweis fuer dich.');
  await pageA.getByTestId('love-jar-save').click();

  await pageB.goto('/today');
  await pageB.reload();
  await expect(pageB.getByTestId('notification-badge')).toBeVisible();
  await pageB.getByTestId('nav-notifications').click();
  await pageB.getByTestId('notification-item').first().click();
  await expect(pageB).toHaveURL(/\/love-jar$/);

  await pageA.goto('/memories');
  await pageA.getByTestId('memory-title').fill('Noch ein Hinweis');
  await pageA.getByTestId('memory-description').fill('Damit alle gelesen getestet wird.');
  await pageA.getByTestId('memory-date').fill('2026-06-09');
  await pageA.getByTestId('memory-save').click();

  await pageB.goto('/notifications');
  await expect(pageB.getByTestId('notifications-read-all')).toBeEnabled();
  await pageB.getByTestId('notifications-read-all').click();
  await expect(pageB.getByTestId('notification-badge')).toBeHidden();

  await contextA.close();
  await contextB.close();
});

test('settings expose export logout and leave couple flows', async ({ browser, request }) => {
  const { contextA, contextB, pageA } = await setupPages(browser, request, 'settings');

  await pageA.goto('/settings');
  const downloadPromise = pageA.waitForEvent('download');
  await pageA.getByTestId('settings-export').click();
  await downloadPromise;

  await pageA.getByTestId('settings-logout').click();
  await pageA.goto('/today');
  await expect(pageA).toHaveURL(/\/onboarding$/);

  await contextA.close();
  await contextB.close();
});

test('settings allow leaving the couple room', async ({ browser, request }) => {
  const { contextA, contextB, pageA } = await setupPages(browser, request, 'leave');

  await pageA.goto('/settings');
  pageA.once('dialog', (dialog) => dialog.accept());
  await pageA.getByTestId('settings-leave-couple').click();
  await expect(pageA).toHaveURL(/\/onboarding$/);
  await expect(pageA.getByTestId('join-couple-form')).toBeVisible();

  await contextA.close();
  await contextB.close();
});
