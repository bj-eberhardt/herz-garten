import { expect, test } from '@playwright/test';
import { authenticatePage, createCoupleByApi, joinCoupleByApi, registerByApi, setupCoupleByApi } from './helpers/api';
import { createCoupleViaUi, registerViaUi } from './helpers/auth';
import { testRunId, testUser } from './helpers/testUsers';

test('guest onboarding only shows auth form and register advertisement', async ({ page }) => {
  await page.goto('/onboarding');

  await expect(page.getByTestId('auth-form')).toBeVisible();
  await expect(page.getByTestId('auth-display-name')).toBeVisible();
  await expect(page.getByTestId('onboarding-ad')).toBeVisible();
  await expect(page.getByTestId('onboarding-returning')).toHaveCount(0);
  await expect(page.getByTestId('feature-explainer-onboarding')).toHaveCount(0);
  await expect(page.getByTestId('nav-garden')).toHaveCount(0);
  await expect(page.getByTestId('nav-today')).toHaveCount(0);
});

test('remembered email opens login tab and pre-fills email', async ({ page }) => {
  await page.goto('/onboarding');
  await page.evaluate(() => {
    window.localStorage.setItem('herzgarten_remembered_email', 'saved@example.test');
  });
  await page.goto('/onboarding');

  await expect(page.getByTestId('auth-mode-login')).toHaveClass(/active/);
  await expect(page.getByTestId('auth-email')).toHaveValue('saved@example.test');
  await expect(page.getByTestId('auth-display-name')).toHaveCount(0);
  await expect(page.getByTestId('onboarding-ad')).toHaveCount(0);
  await expect(page.getByTestId('onboarding-returning')).toBeVisible();
  await expect(page.getByTestId('onboarding-returning')).toContainText('Willkommen zurück');
  await expect(page.getByTestId('onboarding-returning')).toContainText('Garten weiter pflegen');
  await expect(page.getByTestId('nav-garden')).toHaveCount(0);
});

test('successful registration stores email in local storage', async ({ page }) => {
  const user = testUser('remember-email', testRunId());
  await registerViaUi(page, user);
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('herzgarten_remembered_email'))).toBe(user.email);
  await expect(page.getByTestId('feature-explainer-onboarding')).toBeVisible();
  await expect(page.getByTestId('nav-garden')).toBeVisible();
  await expect(page.getByTestId('onboarding-join-option')).toContainText('Partnercode eingeben');
  await expect(page.getByTestId('onboarding-join-option')).toContainText('Wenn dein Partner den Garten schon angelegt hat');
  await expect(page.getByTestId('onboarding-create-option')).toContainText('Neuen Garten anlegen');
  await expect(page.getByTestId('onboarding-create-option')).toContainText('Danach erhältst du einen Partnercode');
  await expect(page.getByTestId('create-couple-form')).toBeVisible();
  await expect(page.getByTestId('join-couple-form')).toBeVisible();
});

test('creating a garden shows invite code modal and stays on onboarding until partner joins', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await registerViaUi(page, testUser('onboarding-modal', testRunId()));

  await page.getByTestId('create-couple-submit').click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByTestId('invite-code-modal')).toBeVisible();
  await expect(page.getByTestId('invite-code-modal')).toContainText('Euer Paarcode ist bereit');
  await expect(page.getByTestId('invite-code-modal')).toContainText('Gib diesen Code deinem Partner weiter');

  const inviteCode = (await page.getByTestId('invite-modal-code').innerText()).trim();
  expect(inviteCode).toMatch(/^[a-z]+-[a-z]+-\d{4}$/);
  await page.getByTestId('invite-modal-copy').click();
  await expect(page.getByTestId('invite-modal-copy')).toContainText('Kopiert');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(inviteCode);

  await page.getByTestId('invite-modal-confirm').click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByTestId('header-couple-link')).toContainText(inviteCode);
  await expect(page.getByTestId('waiting-partner-panel')).toBeVisible();
  await expect(page.getByTestId('waiting-partner-panel')).toContainText('Partner fehlt noch');
  await expect(page.getByTestId('waiting-partner-panel')).toContainText('Der Garten funktioniert erst');
  await expect(page.getByTestId('couple-code-panel')).toContainText(inviteCode);
  await expect(page.getByTestId('copy-couple-code')).toBeVisible();
  await expect(page.getByTestId('nav-brand')).toBeVisible();
  await page.getByTestId('nav-brand').click();
  await expect(page).toHaveURL(/\/onboarding$/);
});

test('partner can register separately and join later with invite code', async ({ browser }) => {
  const runId = testRunId();
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const partnerA = await contextA.newPage();
  const partnerB = await contextB.newPage();

  await registerViaUi(partnerA, testUser('onboarding-a', runId));
  const inviteCode = await createCoupleViaUi(partnerA);

  await registerViaUi(partnerB, testUser('onboarding-b', runId));
  await expect(partnerB.getByTestId('join-couple-form')).toBeVisible();
  await partnerB.getByTestId('invite-code-input').fill(inviteCode);
  await partnerB.getByTestId('join-couple-submit').click();

  await expect(partnerB).toHaveURL(/\/today$/);
  await expect(partnerB.getByTestId('today-card')).toBeVisible();

  await contextA.close();
  await contextB.close();
});

test('opening partner joined notification refreshes stale couple details', async ({ page, request }) => {
  const runId = testRunId();
  await registerViaUi(page, testUser('notification-refresh-a', runId));
  const inviteCode = await createCoupleViaUi(page);
  await expect(page.getByTestId('waiting-partner-panel')).toBeVisible();

  const partnerB = await registerByApi(request, testUser('notification-refresh-b', runId));
  await joinCoupleByApi(request, partnerB.token, inviteCode);

  await page.goto('/notifications');
  const joinedNotification = page.getByTestId('notification-item').filter({ hasText: 'Dein Partner ist da' });
  await expect(joinedNotification).toBeVisible();
  await joinedNotification.click();
  await expect(page.getByTestId('notification-detail')).toBeVisible();

  await page.goto('/today');
  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByTestId('today-card')).toBeVisible();
});

test('wrong invite code shows a clear error', async ({ page }) => {
  await registerViaUi(page, testUser('bad-code'));
  await page.getByTestId('invite-code-input').fill('apfel-sonne-0000');
  await page.getByTestId('join-couple-submit').click();
  await expect(page.getByTestId('join-couple-error')).toBeVisible();
  await expect(page.getByTestId('join-couple-error')).toContainText('Diesen Paar-Code konnten wir nicht finden');
  await expect(page.getByTestId('couple-error')).toHaveCount(0);
});

test('full invite code shows a clear error', async ({ browser }) => {
  const runId = testRunId();
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const contextC = await browser.newContext();
  const partnerA = await contextA.newPage();
  const partnerB = await contextB.newPage();
  const thirdUser = await contextC.newPage();

  await registerViaUi(partnerA, testUser('full-code-a', runId));
  const inviteCode = await createCoupleViaUi(partnerA);

  await registerViaUi(partnerB, testUser('full-code-b', runId));
  await partnerB.getByTestId('invite-code-input').fill(inviteCode);
  await partnerB.getByTestId('join-couple-submit').click();
  await expect(partnerB).toHaveURL(/\/today$/);

  await registerViaUi(thirdUser, testUser('full-code-c', runId));
  await thirdUser.getByTestId('invite-code-input').fill(inviteCode);
  await thirdUser.getByTestId('join-couple-submit').click();
  await expect(thirdUser.getByTestId('join-couple-error')).toContainText('Dieser Paarraum hat bereits zwei Mitglieder');
  await expect(thirdUser.getByTestId('couple-error')).toHaveCount(0);

  await contextA.close();
  await contextB.close();
  await contextC.close();
});

test('authenticated user without couple is routed to onboarding', async ({ page, request }) => {
  const auth = await registerByApi(request, testUser('no-couple', testRunId()));
  await page.goto('/onboarding');
  await page.evaluate((token) => {
    window.localStorage.setItem('herzgarten_token', token);
  }, auth.token);
  await page.goto('/today');
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByTestId('join-couple-form')).toBeVisible();
});

test('invalid stored user token clears session and shows expired message', async ({ page }) => {
  await page.goto('/onboarding');
  await page.evaluate(() => {
    window.localStorage.setItem('herzgarten_token', 'invalid-token');
  });
  await page.goto('/today');

  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByTestId('auth-form')).toBeVisible();
  await expect(page.getByTestId('auth-error')).toHaveText('Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.');
  await expect(page.evaluate(() => window.localStorage.getItem('herzgarten_token'))).resolves.toBeNull();
});

test('login with an existing couple opens today', async ({ page, request }) => {
  const runId = testRunId();
  const userA = testUser('login-couple-a', runId);
  const userB = testUser('login-couple-b', runId);
  await setupCoupleByApi(request, userA, userB);

  await page.goto('/onboarding');
  await page.getByTestId('auth-mode-login').click();
  await page.getByTestId('auth-email').fill(userA.email);
  await page.getByTestId('auth-password').fill(userA.password);
  await page.getByTestId('auth-submit').click();

  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByTestId('today-card')).toBeVisible();
});

test('login with a one-member couple stays on onboarding and shows invite code', async ({ page, request }) => {
  const user = testUser('login-one-member-couple', testRunId());
  const auth = await registerByApi(request, user);
  const created = await createCoupleByApi(request, auth.token);

  await page.goto('/onboarding');
  await page.getByTestId('auth-mode-login').click();
  await page.getByTestId('auth-email').fill(user.email);
  await page.getByTestId('auth-password').fill(user.password);
  await page.getByTestId('auth-submit').click();

  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByTestId('waiting-partner-panel')).toBeVisible();
  await expect(page.getByTestId('waiting-partner-panel')).toContainText('Dein Paarraum wartet auf deinen Partner');
  await expect(page.getByTestId('waiting-partner-panel')).toContainText('registriert oder einloggt');
  await expect(page.getByTestId('couple-code-panel')).toBeVisible();
  await expect(page.getByTestId('couple-code-panel')).toContainText(created.couple.inviteCode);
  await expect(page.getByTestId('copy-couple-code')).toBeVisible();

  for (const testId of ['nav-garden', 'nav-today', 'nav-quests', 'nav-know-me', 'nav-love-jar', 'nav-memories', 'nav-settings']) {
    await expect(page.getByTestId(testId)).toBeVisible();
  }
  await expect(page.getByTestId('nav-garden')).toHaveAttribute('href', '/garden');
  await expect(page.getByTestId('nav-settings')).toHaveAttribute('href', '/settings');
  await expect(page.getByTestId('nav-today')).toBeDisabled();
  await expect(page.getByTestId('nav-quests')).toBeDisabled();
  await expect(page.getByTestId('nav-know-me')).toBeDisabled();
  await expect(page.getByTestId('nav-love-jar')).toBeDisabled();
  await expect(page.getByTestId('nav-memories')).toBeDisabled();

  await page.getByTestId('nav-settings').click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByTestId('settings-profile-panel')).toBeVisible();
  await page.getByTestId('nav-garden').click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByTestId('waiting-partner-panel')).toBeVisible();

  await page.goto('/today');
  await expect(page).toHaveURL(/\/onboarding$/);
});

test('login without a couple stays on onboarding', async ({ page, request }) => {
  const user = testUser('login-no-couple', testRunId());
  await registerByApi(request, user);

  await page.goto('/onboarding');
  await page.getByTestId('auth-mode-login').click();
  await page.getByTestId('auth-email').fill(user.email);
  await page.getByTestId('auth-password').fill(user.password);
  await page.getByTestId('auth-submit').click();

  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByTestId('join-couple-form')).toBeVisible();
  await expect(page.getByTestId('create-couple-form')).toBeVisible();
});

test('header logout clears the session and returns to onboarding', async ({ page, request }) => {
  const runId = testRunId();
  const userA = testUser('header-logout-a', runId);
  const userB = testUser('header-logout-b', runId);
  const { partnerA } = await setupCoupleByApi(request, userA, userB);

  await authenticatePage(page.context(), page, partnerA.token);
  await expect(page.getByTestId('nav-notifications')).toBeVisible();
  await expect(page.getByTestId('nav-logout')).toBeVisible();
  await expect(page.getByTestId('nav-logout')).toHaveAttribute('title', 'Ausloggen');

  await page.getByTestId('nav-logout').click();

  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByTestId('auth-form')).toBeVisible();
  await expect(page.getByTestId('nav-notifications')).toHaveCount(0);
  await expect(page.getByTestId('nav-logout')).toHaveCount(0);
  await expect(page.evaluate(() => window.localStorage.getItem('herzgarten_token'))).resolves.toBeNull();
});
