import { expect, test } from '@playwright/test';
import { registerByApi } from './helpers/api';
import { createCoupleViaUi, registerViaUi } from './helpers/auth';
import { testRunId, testUser } from './helpers/testUsers';

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
