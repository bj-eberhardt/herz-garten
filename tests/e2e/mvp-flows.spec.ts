import { expect, test, type APIRequestContext, type Browser, type Page } from '@playwright/test';
import { apiGet, apiPost, authenticatePage, setupCoupleByApi } from './helpers/api';
import { testRunId, testUser } from './helpers/testUsers';

const apiBaseURL = process.env.E2E_API_URL ?? 'http://localhost:3001';

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

async function apiPostRaw(request: APIRequestContext, path: string, body: unknown, token: string) {
  return request.post(`${apiBaseURL}${path}`, {
    data: body,
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function apiGetRaw(request: APIRequestContext, path: string, token: string, headers: Record<string, string> = {}) {
  return request.get(`${apiBaseURL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, ...headers },
  });
}

test('daily question reveal creates notifications and a garden detail', async ({ browser, request }) => {
  const { contextA, contextB, pageA, pageB } = await setupPages(browser, request, 'daily');

  await pageA.getByTestId('today-answer-input').fill('Ich habe mich heute gesehen gefühlt.');
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
  await expect(pageA.getByTestId('garden-progress')).toBeVisible();
  await expect(pageA.getByTestId('garden-progress')).toContainText('Tagesfragen');
  await expect(pageA.getByTestId('garden-locked-area').first()).toContainText('200 Punkte');
  await expect(pageA.getByTestId('garden-object').first()).toHaveAttribute('title', /10 Punkte/);
  await expect(pageA.getByTestId('garden-legend-item').first()).toBeVisible();
  await expect(pageA.getByTestId('garden-legend-item').first()).toHaveAttribute('title', /.+/);
  await pageA.getByTestId('garden-edit-toggle').click();
  await pageA.getByTestId('garden-object').first().click();
  await expect(pageA.getByTestId('garden-detail')).toHaveCount(0);
  await pageA.getByTestId('garden-edit-toggle').click();
  await pageA.getByTestId('garden-object').first().click();
  await expect(pageA.getByTestId('garden-detail')).toContainText('Tagesfrage');
  await expect(pageA.getByTestId('garden-detail-date')).toBeVisible();
  await expect(pageA.getByTestId('garden-detail-celebration')).toContainText('gewachsen');
  await pageA.getByTestId('garden-detail-close').click();
  await expect(pageA.getByTestId('garden-history-toggle')).toContainText('Verlauf anzeigen');
  await pageA.getByTestId('garden-history-toggle').click();
  await expect(pageA.getByTestId('garden-history-next-level')).toContainText('Punkte');
  const firstHistoryItem = pageA.getByTestId('garden-history-item').first();
  await expect(firstHistoryItem).toContainText('Tagesfrage');
  await expect(firstHistoryItem).toContainText('+10');
  await expect(firstHistoryItem.getByTestId('garden-history-date')).toBeVisible();
  await expect(firstHistoryItem.getByTestId('garden-history-context')).toBeVisible();
  await expect(firstHistoryItem).not.toContainText('conversation_flower');
  await expect(pageA.getByTestId('garden-history-toggle')).toContainText('Verlauf ausblenden');
  await pageA.getByTestId('garden-history-item').first().click();
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
  await expect.poll(() => pageA.getByTestId('quest-card').count()).toBeLessThan(initialCount);
  const filteredCount = await pageA.getByTestId('quest-card').count();
  expect(filteredCount).toBeLessThan(initialCount);
  await expect(pageA.getByTestId('quest-card').first()).toContainText(/Aktueller|Fern|Song|Sprachnachricht|Wiedersehen/);

  await pageA.getByTestId('quest-filter-duration').selectOption('5');
  await expect(pageA.getByTestId('quest-card').first()).toBeVisible();

  await contextA.close();
  await contextB.close();
});

test('love jar note can be drawn once per day and shows empty state for new couples', async ({ browser, request }) => {
  const { contextA, contextB, pageA, pageB, partnerA, partnerB } = await setupPages(browser, request, 'lovejar');

  await pageB.goto('/love-jar');
  await expect(pageB.getByTestId('love-jar-empty')).toBeVisible();

  await pageA.goto('/love-jar');
  await expect(pageA.getByTestId('love-jar-category')).toContainText('Kompliment');
  await pageA.getByTestId('love-jar-category').selectOption('compliment');
  await pageA.getByTestId('love-jar-note-input').fill('Danke für deine Ruhe.');
  await pageA.getByTestId('love-jar-save').click();

  await openNotifications(pageB);
  await expect(pageB.getByTestId('notification-item').first()).toContainText('Zettel');
  await expect(pageB.getByTestId('notification-item').first()).toContainText(partnerA.user.displayName);

  await pageB.goto('/love-jar');
  await pageB.getByTestId('love-jar-draw').click();
  const drawnNote = pageB.getByTestId('love-jar-note').first();
  await expect(drawnNote).toContainText('Danke für deine Ruhe.');
  await expect(drawnNote).toContainText('Kompliment');
  await expect(drawnNote).not.toContainText('compliment');
  await expect(pageB.getByTestId('love-jar-draw')).toBeDisabled();
  await expect(pageB.getByTestId('love-jar-draw-hint')).toContainText('heute schon');
  const duplicateDraw = await apiPostRaw(request, '/api/love-jar/draw', {}, partnerB.token);
  expect(duplicateDraw.status()).toBe(409);
  const duplicateDrawPayload = await duplicateDraw.json();
  expect(duplicateDrawPayload).toEqual(
    expect.objectContaining({
      errorKey: 'loveJar.alreadyDrawnToday',
      error: expect.stringContaining('heute schon einen Zettel gezogen'),
    }),
  );

  await pageB.getByTestId('nav-garden').click();
  await pageB.getByTestId('garden-object').first().click();
  await expect(pageB.getByTestId('garden-detail')).toContainText('Kompliment');
  await expect(pageB.getByTestId('garden-detail')).not.toContainText('compliment');

  await contextA.close();
  await contextB.close();
});

test('know me game notifies partner and rewards correct guesses', async ({ browser, request }) => {
  const { contextA, contextB, pageA, pageB } = await setupPages(browser, request, 'knowme');

  await pageA.goto('/know-me');
  await pageA.getByTestId('know-me-question-input').fill('Was ist mein heimlicher Lieblingssnack?');
  await pageA.getByTestId('know-me-option-0').fill('Schokolade');
  await pageA.getByTestId('know-me-option-1').fill('Salzbrezeln');
  await pageA.getByTestId('know-me-option-2').fill('Apfel');
  await pageA.getByTestId('know-me-create-submit').click();
  await expect(pageA.getByTestId('know-me-own-card').first()).toContainText('Lieblingssnack');

  await openNotifications(pageB);
  await expect(pageB.getByTestId('notification-item').first()).toContainText('Kennst-du-mich');
  await pageB.getByTestId('notification-item').first().click();
  await expect(pageB).toHaveURL(/\/know-me$/);

  await pageB
    .getByTestId('know-me-open-card')
    .first()
    .getByTestId('know-me-answer-option')
    .filter({ hasText: 'Schokolade' })
    .click();
  await pageB.getByTestId('know-me-guess-submit').click();
  await expect(pageB.getByTestId('know-me-history-card').first()).toContainText('Treffer');
  await expect(pageB.getByTestId('know-me-history-card').first()).toContainText('Schokolade');

  await pageB.getByTestId('nav-garden').click();
  await pageB.getByTestId('garden-object').first().click();
  await expect(pageB.getByTestId('garden-detail')).toContainText('Wie gut kennst du mich?');
  await expect(pageB.getByTestId('garden-detail-celebration')).toContainText('besondere Blume');

  await contextA.close();
  await contextB.close();
});

test('know me catalog suggestions can be selected and are hidden per author after use', async ({ browser, request }) => {
  const { contextA, contextB, pageA, pageB } = await setupPages(browser, request, 'knowme-catalog');
  const catalogQuestion = 'Was waere mein perfekter Sonntag?';

  await pageA.goto('/know-me');
  await pageA.getByTestId('know-me-question-input').fill('Sonntag');
  await expect(pageA.getByTestId('know-me-catalog-suggestions')).toBeVisible();
  await pageA.getByTestId('know-me-catalog-suggestion').filter({ hasText: catalogQuestion }).click();
  await expect(pageA.getByTestId('know-me-question-input')).toHaveValue(catalogQuestion);
  await expect(pageA.getByTestId('know-me-question-source')).toContainText('Katalog');

  await pageA.getByTestId('know-me-option-0').fill('Lange schlafen und Kaffee');
  await pageA.getByTestId('know-me-option-1').fill('Um sechs Uhr joggen');
  await pageA.getByTestId('know-me-create-submit').click();
  await expect(pageA.getByTestId('know-me-own-card').first()).toContainText(catalogQuestion);
  await pageA.getByTestId('know-me-question-input').fill('Sonntag');
  await expect(
    pageA.getByTestId('know-me-catalog-suggestion').filter({ hasText: catalogQuestion }),
  ).toHaveCount(0);

  await pageB.goto('/know-me');
  await pageB.getByTestId('know-me-question-input').fill('Sonntag');
  await expect(pageB.getByTestId('know-me-catalog-suggestions')).toContainText(catalogQuestion);
  await pageB
    .getByTestId('know-me-open-card')
    .first()
    .getByTestId('know-me-answer-option')
    .filter({ hasText: 'Lange schlafen und Kaffee' })
    .click();
  await pageB.getByTestId('know-me-guess-submit').click();
  await expect(pageB.getByTestId('know-me-history-card').first()).toContainText('Treffer');

  await contextA.close();
  await contextB.close();
});

test('know me wrong guess is resolved without garden reward', async ({ browser, request }) => {
  const { contextA, contextB, pageA, pageB } = await setupPages(browser, request, 'knowme-wrong');

  await pageA.goto('/know-me');
  await pageA.getByTestId('know-me-question-input').fill('Welcher Ort gibt mir Ruhe?');
  await pageA.getByTestId('know-me-option-0').fill('Wald');
  await pageA.getByTestId('know-me-option-1').fill('Bahnhof');
  await pageA.getByTestId('know-me-create-submit').click();

  await pageB.goto('/know-me');
  await pageB
    .getByTestId('know-me-open-card')
    .first()
    .getByTestId('know-me-answer-option')
    .filter({ hasText: 'Bahnhof' })
    .click();
  await pageB.getByTestId('know-me-guess-submit').click();
  await expect(pageB.getByTestId('know-me-history-card').first()).toContainText('Nicht getroffen');

  await pageB.getByTestId('nav-garden').click();
  await expect(pageB.getByTestId('garden-object')).toHaveCount(0);

  await contextA.close();
  await contextB.close();
});

test('know me author cannot guess own question returns localized error key', async ({ browser, request }) => {
  const { contextA, contextB, partnerA } = await setupPages(browser, request, 'knowme-own-guess');
  const payload = await apiPost<{ rounds: Array<{ id: string; questionText: string }> }>(
    request,
    '/api/know-me',
    {
      questionText: 'Was waere mein freier Abend?',
      options: ['Lesen', 'Tanzen'],
      correctOptionIndex: 0,
    },
    partnerA.token,
  );
  const ownQuestion = payload.rounds.find((round) => round.questionText === 'Was waere mein freier Abend?');
  expect(ownQuestion).toBeTruthy();

  const response = await apiPostRaw(request, `/api/know-me/${ownQuestion!.id}/guess`, { selectedOptionIndex: 0 }, partnerA.token);
  expect(response.status()).toBe(403);
  const responsePayload = await response.json();
  expect(responsePayload).toEqual(
    expect.objectContaining({
      errorKey: 'knowMe.authorCannotGuessOwnQuestion',
      error: expect.stringContaining('selbst erstellt'),
    }),
  );

  await contextA.close();
  await contextB.close();
});

test('memory creates timeline entry notification and garden detail', async ({ browser, request }) => {
  const { contextA, contextB, pageA, pageB } = await setupPages(browser, request, 'memory');

  await pageA.goto('/memories');
  await pageA.getByTestId('memory-title').fill('Unser E2E Moment');
  await pageA.getByTestId('memory-description').fill('Ein kurzer Test für die Timeline.');
  await pageA.getByTestId('memory-date').fill('2026-06-09');
  await expect(pageA.getByTestId('memory-category')).toContainText('Alltag');
  await pageA.getByTestId('memory-category').selectOption('everyday');
  await pageA.getByTestId('memory-save').click();
  const memoryItem = pageA.getByTestId('memory-item').first();
  await expect(memoryItem).toContainText('Unser E2E Moment');
  await expect(memoryItem).toContainText('Alltag');
  await expect(memoryItem).not.toContainText('everyday');

  await openNotifications(pageB);
  await expect(pageB.getByTestId('notification-item').first()).toContainText('Erinnerung');

  await pageA.getByTestId('nav-garden').click();
  await expect(pageA.getByTestId('garden-progress')).toContainText('Erinnerungen');
  await pageA.getByTestId('garden-object').first().click();
  await expect(pageA.getByTestId('garden-detail')).toContainText('Unser E2E Moment');
  await expect(pageA.getByTestId('garden-detail')).toContainText('Alltag');
  await expect(pageA.getByTestId('garden-detail')).not.toContainText('everyday');
  await expect(pageA.getByTestId('garden-detail-celebration')).toContainText('bewahrt');

  await contextA.close();
  await contextB.close();
});

test('notifications can be opened and marked read', async ({ browser, request }) => {
  const { contextA, contextB, pageA, pageB } = await setupPages(browser, request, 'notifications');

  await pageA.goto('/love-jar');
  await pageA.getByTestId('love-jar-note-input').fill('Ein Hinweis für dich.');
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
  await expect(pageA.getByTestId('privacy-details')).toContainText('Datenschutz auf einen Blick');
  await expect(pageA.getByTestId('privacy-details')).toContainText('Konto löschen');
  const downloadPromise = pageA.waitForEvent('download');
  await pageA.getByTestId('settings-export').click();
  await downloadPromise;

  await pageA.getByTestId('settings-logout').click();
  await pageA.goto('/today');
  await expect(pageA).toHaveURL(/\/onboarding$/);

  await contextA.close();
  await contextB.close();
});

test('feature explainer boxes can be hidden and re-enabled in settings', async ({ browser, request }) => {
  const { contextA, contextB, pageA } = await setupPages(browser, request, 'settings-hints');

  await pageA.goto('/today');
  await expect(pageA.getByTestId('feature-explainer-today')).toBeVisible();
  await pageA.getByTestId('feature-explainer-close-today').click();
  await expect(pageA.getByTestId('feature-explainer-today')).toHaveCount(0);

  await pageA.goto('/settings');
  const todayToggle = pageA.getByTestId('settings-feature-explainer-today');
  await expect(todayToggle).not.toBeChecked();
  await todayToggle.check();
  await expect(todayToggle).toBeChecked();

  await pageA.goto('/today');
  await expect(pageA.getByTestId('feature-explainer-today')).toBeVisible();

  await contextA.close();
  await contextB.close();
});

test('settings allow deleting the account and remove login access', async ({ browser, request }) => {
  const runId = testRunId();
  const userA = testUser('delete-a', runId);
  const userB = testUser('delete-b', runId);
  const { partnerA, partnerB } = await setupCoupleByApi(request, userA, userB);
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  await authenticatePage(contextA, pageA, partnerA.token);
  await authenticatePage(contextB, pageB, partnerB.token);

  await pageA.goto('/settings');
  pageA.once('dialog', (dialog) => dialog.accept());
  await pageA.getByTestId('settings-delete-account').click();
  await expect(pageA).toHaveURL(/\/onboarding$/);
  await expect(pageA.getByTestId('auth-form')).toBeVisible();
  await expect(pageA.evaluate(() => window.localStorage.getItem('herzgarten_token'))).resolves.toBeNull();

  const loginResponse = await request.post(`${apiBaseURL}/api/auth/login`, {
    data: { email: userA.email, password: userA.password },
  });
  expect(loginResponse.status()).toBe(401);
  const loginPayload = await loginResponse.json();
  expect(loginPayload).toEqual(expect.objectContaining({ errorKey: 'auth.invalidCredentials' }));

  const partnerResponse = await apiGetRaw(request, '/api/me', partnerB.token);
  expect(partnerResponse.ok()).toBeTruthy();
  const partnerPayload = await partnerResponse.json();
  expect(partnerPayload.couple).toBeNull();

  await pageB.goto('/notifications');
  await expect(pageB.getByTestId('notification-item').first()).toContainText('Paarung wurde getrennt');
  await expect(pageB.getByTestId('notification-item').first()).toContainText('neu paaren');
  await pageB.getByTestId('notification-item').first().click();
  await expect(pageB).toHaveURL(/\/onboarding$/);
  await expect(pageB.getByTestId('join-couple-form')).toBeVisible();

  await contextA.close();
  await contextB.close();
});

test('api content i18n resolves query parameter and accept-language with fallbacks', async ({ request }) => {
  const runId = testRunId();
  const userA = testUser('api-i18n-a', runId);
  const userB = testUser('api-i18n-b', runId);
  const { partnerA } = await setupCoupleByApi(request, userA, userB);

  const englishQuests = await apiGet<{ quests: Array<{ title: string; description: string }>; locale: string }>(
    request,
    '/api/quests?lang=en',
    partnerA.token,
  );
  expect(englishQuests.locale).toBe('en');
  expect(englishQuests.quests.some((quest) => quest.title === 'Three Compliments')).toBeTruthy();

  const germanQuests = await apiGet<{ quests: Array<{ title: string }>; locale: string }>(
    request,
    '/api/quests?lang=de',
    partnerA.token,
  );
  expect(germanQuests.locale).toBe('de');
  expect(germanQuests.quests.some((quest) => quest.title === 'Drei Komplimente')).toBeTruthy();

  const headerResponse = await apiGetRaw(request, '/api/quests', partnerA.token, { 'Accept-Language': 'en-US,en;q=0.8' });
  expect(headerResponse.ok()).toBeTruthy();
  const headerPayload = await headerResponse.json();
  expect(headerPayload.locale).toBe('en');
  expect(headerPayload.quests.some((quest: { title: string }) => quest.title === 'Three Compliments')).toBeTruthy();

  const overrideResponse = await apiGetRaw(request, '/api/quests?lang=de', partnerA.token, {
    'Accept-Language': 'en',
  });
  expect(overrideResponse.ok()).toBeTruthy();
  const overridePayload = await overrideResponse.json();
  expect(overridePayload.locale).toBe('de');
  expect(overridePayload.quests.some((quest: { title: string }) => quest.title === 'Drei Komplimente')).toBeTruthy();

  const invalidResponse = await apiGetRaw(request, '/api/quests?lang=fr', partnerA.token);
  expect(invalidResponse.ok()).toBeTruthy();
  const invalidPayload = await invalidResponse.json();
  expect(invalidPayload.locale).toBe('de');
  expect(invalidPayload.quests.some((quest: { title: string }) => quest.title === 'Drei Komplimente')).toBeTruthy();

  const knowMe = await apiGet<{ catalogQuestions: Array<{ questionText: string; category: string }>; locale: string }>(
    request,
    '/api/know-me?lang=en',
    partnerA.token,
  );
  expect(knowMe.locale).toBe('en');
  expect(knowMe.catalogQuestions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ questionText: 'What would my perfect Sunday look like?', category: 'Everyday life' }),
    ]),
  );
});

test('api data isolation blocks foreign garden objects know-me rounds and exports', async ({ request }) => {
  const runId = testRunId();
  const userA1 = testUser('isolation-a1', runId);
  const userA2 = testUser('isolation-a2', runId);
  const userB1 = testUser('isolation-b1', runId);
  const userB2 = testUser('isolation-b2', runId);
  const coupleA = await setupCoupleByApi(request, userA1, userA2);
  const coupleB = await setupCoupleByApi(request, userB1, userB2);

  await apiPost(request, '/api/memories', {
    title: 'Isolation Secret',
    description: 'Darf nur Paar A sehen.',
    date: '2026-06-09',
    category: 'everyday',
  }, coupleA.partnerA.token);
  const gardenA = await apiGet<{ objects: Array<{ id: string }> }>(request, '/api/garden', coupleA.partnerA.token);
  const foreignGardenObjectId = gardenA.objects[0].id;
  const foreignGardenResponse = await apiGetRaw(
    request,
    `/api/garden/objects/${foreignGardenObjectId}`,
    coupleB.partnerA.token,
  );
  expect(foreignGardenResponse.status()).toBe(404);
  expect(await foreignGardenResponse.json()).toEqual(expect.objectContaining({ errorKey: 'garden.objectNotFound' }));

  const knowMeA = await apiPost<{ rounds: Array<{ id: string; questionText: string }> }>(
    request,
    '/api/know-me',
    {
      questionText: 'Was darf Paar B nicht raten?',
      options: ['Antwort A', 'Antwort B'],
      correctOptionIndex: 0,
    },
    coupleA.partnerA.token,
  );
  const foreignGuessResponse = await apiPostRaw(
    request,
    `/api/know-me/${knowMeA.rounds[0].id}/guess`,
    { selectedOptionIndex: 0 },
    coupleB.partnerA.token,
  );
  expect(foreignGuessResponse.status()).toBe(404);
  expect(await foreignGuessResponse.json()).toEqual(expect.objectContaining({ errorKey: 'knowMe.questionNotFound' }));

  const exportB = await apiGet<Record<string, unknown>>(request, '/api/me/export?lang=en', coupleB.partnerA.token);
  expect(JSON.stringify(exportB)).not.toContain('Isolation Secret');
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
