import { expect, test } from '@playwright/test';
import { apiGetRaw, authenticatePage, setupCoupleByApi } from '../../helpers/api';
import { testRunId, testUser } from '../../helpers/testUsers';

const apiBaseURL = process.env.E2E_API_URL ?? 'http://localhost:3001';

test.describe('user flow / account delete', () => {
  test('settings allow deleting the account and remove login access', async ({ browser, request }) => {
    await test.step('Flow: settings allow deleting the account and remove login access', async () => {
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

      await test.step('Open /settings', async () => {
        await pageA.goto('/settings');
      });
      await test.step('Click settings delete account', async () => {
        await pageA.getByTestId('settings-delete-account').click();
      });
      await test.step('Verify settings confirm dialog', async () => {
        await expect(pageA.getByTestId('settings-confirm-dialog')).toContainText('Konto wirklich dauerhaft');
      });
      await test.step('Click settings confirm accept', async () => {
        await pageA.getByTestId('settings-confirm-accept').click();
      });
      await test.step('Assert: user is on onboarding page', async () => {
        await expect(pageA).toHaveURL(/\/onboarding$/);
      });
      await test.step('Verify auth form', async () => {
        await expect(pageA.getByTestId('auth-form')).toBeVisible();
      });
      await test.step('Assert: auth token is removed from storage', async () => {
        await expect(pageA.evaluate(() => window.localStorage.getItem('herzgarten_token'))).resolves.toBeNull();
      });

      const loginResponse = await request.post(`${apiBaseURL}/api/auth/login`, {
        data: { email: userA.email, password: userA.password },
      });
      await test.step('Assert: response status is 401', async () => {
        expect(loginResponse.status()).toBe(401);
      });
      const loginPayload = await loginResponse.json();
      await test.step('Assert: login is rejected with invalid credentials', async () => {
        expect(loginPayload).toEqual(expect.objectContaining({ errorKey: 'auth.invalidCredentials' }));
      });

      const partnerResponse = await apiGetRaw(request, '/api/me', partnerB.token);
      await test.step('Assert: API response succeeds', async () => {
        expect(partnerResponse.ok()).toBeTruthy();
      });
      const partnerPayload = await partnerResponse.json();
      await test.step('Assert: partner is no longer connected to a couple', async () => {
        expect(partnerPayload.couple).toBeNull();
      });

      await test.step('Open /notifications', async () => {
        await pageB.goto('/notifications');
      });
      await test.step('Verify notification item', async () => {
        await expect(pageB.getByTestId('notification-item').first()).toContainText('Paarung wurde getrennt');
      });
      await test.step('Verify notification item', async () => {
        await expect(pageB.getByTestId('notification-item').first()).toContainText('neu paaren');
      });
      await test.step('Click notification item', async () => {
        await pageB.getByTestId('notification-item').first().click();
      });
      await test.step('Click notification detail cta', async () => {
        await pageB.getByTestId('notification-detail-cta').click();
      });
      await test.step('Assert: user is on onboarding page', async () => {
        await expect(pageB).toHaveURL(/\/onboarding$/);
      });
      await test.step('Verify join couple form', async () => {
        await expect(pageB.getByTestId('join-couple-form')).toBeVisible();
      });

      await contextA.close();
      await contextB.close();
    });
  });
});
