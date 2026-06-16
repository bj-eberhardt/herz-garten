import { expect, test } from '@playwright/test';
import { registerByApi } from './helpers/api';
import { createCoupleViaUi, registerViaUi } from './helpers/auth';
import { testRunId, testUser } from './helpers/testUsers';

test('guest onboarding only shows auth form and register advertisement', async ({ page }) => {
  await page.goto('/onboarding');

  await expect(page.getByTestId('auth-form')).toBeVisible();
  await expect(page.getByTestId('auth-display-name')).toBeVisible();
  await expect(page.getByTestId('onboarding-ad')).toBeVisible();
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

test('creating a garden shows invite code modal with copy before today', async ({ page, context }) => {
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
  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByTestId('header-couple-link')).toContainText(inviteCode);
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

test('wrong invite code shows a clear error', async ({ page }) => {
  await registerViaUi(page, testUser('bad-code'));
  await page.getByTestId('invite-code-input').fill('apfel-sonne-0000');
  await page.getByTestId('join-couple-submit').click();
  await expect(page.getByTestId('couple-error')).toBeVisible();
  await expect(page.getByTestId('couple-error')).toContainText('Diesen Paar-Code konnten wir nicht finden');
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
  await expect(thirdUser.getByTestId('couple-error')).toContainText('Dieser Paarraum hat bereits zwei Mitglieder');

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
