import { expect, test } from '@playwright/test';
import { authenticatePage, createCoupleByApi, registerByApi, setupCoupleByApi } from '../../helpers/api';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user flow / login', () => {
  test('remembered email opens login tab and pre-fills email', async ({ page }) => {
    await test.step('Flow: remembered email opens login tab and pre-fills email', async () => {
      await test.step('Open /onboarding', async () => {
        await page.goto('/onboarding');
      });
      await page.evaluate(() => {
        window.localStorage.setItem('herzgarten_remembered_email', 'saved@example.test');
      });
      await test.step('Open /onboarding', async () => {
        await page.goto('/onboarding');
      });

      await test.step('Verify auth mode login', async () => {
        await expect(page.getByTestId('auth-mode-login')).toHaveClass(/active/);
      });
      await test.step('Verify auth email', async () => {
        await expect(page.getByTestId('auth-email')).toHaveValue('saved@example.test');
      });
      await test.step('Verify auth display name', async () => {
        await expect(page.getByTestId('auth-display-name')).toHaveCount(0);
      });
      await test.step('Verify onboarding ad', async () => {
        await expect(page.getByTestId('onboarding-ad')).toHaveCount(0);
      });
      await test.step('Verify onboarding returning', async () => {
        await expect(page.getByTestId('onboarding-returning')).toBeVisible();
      });
      await test.step('Verify onboarding returning', async () => {
        await expect(page.getByTestId('onboarding-returning')).toContainText('Willkommen zurück');
      });
      await test.step('Verify onboarding returning', async () => {
        await expect(page.getByTestId('onboarding-returning')).toContainText('Garten weiter pflegen');
      });
      await test.step('Verify nav garden', async () => {
        await expect(page.getByTestId('nav-garden')).toHaveCount(0);
      });
    });
  });

  test('login with an existing couple opens today', async ({ page, request }) => {
    await test.step('Flow: login with an existing couple opens today', async () => {
      const runId = testRunId();
      const userA = testUser('login-couple-a', runId);
      const userB = testUser('login-couple-b', runId);
      await setupCoupleByApi(request, userA, userB);

      await test.step('Open /onboarding', async () => {
        await page.goto('/onboarding');
      });
      await test.step('Click auth mode login', async () => {
        await page.getByTestId('auth-mode-login').click();
      });
      await test.step('Fill auth email', async () => {
        await page.getByTestId('auth-email').fill(userA.email);
      });
      await test.step('Fill auth password', async () => {
        await page.getByTestId('auth-password').fill(userA.password);
      });
      await test.step('Click auth submit', async () => {
        await page.getByTestId('auth-submit').click();
      });
      await test.step('Assert: user reaches today page', async () => {
        await expect(page).toHaveURL(/\/today$/);
      });
      await test.step('Verify today card', async () => {
        await expect(page.getByTestId('today-card')).toBeVisible();
      });
    });
  });

  test('login with a one-member couple stays on onboarding and shows invite code', async ({ page, request }) => {
    await test.step('Flow: login with a one-member couple stays on onboarding and shows invite code', async () => {
      const user = testUser('login-one-member-couple', testRunId());
      const auth = await registerByApi(request, user);
      const created = await createCoupleByApi(request, auth.token);

      await test.step('Open /onboarding', async () => {
        await page.goto('/onboarding');
      });
      await test.step('Click auth mode login', async () => {
        await page.getByTestId('auth-mode-login').click();
      });
      await test.step('Fill auth email', async () => {
        await page.getByTestId('auth-email').fill(user.email);
      });
      await test.step('Fill auth password', async () => {
        await page.getByTestId('auth-password').fill(user.password);
      });
      await test.step('Click auth submit', async () => {
        await page.getByTestId('auth-submit').click();
      });
      await test.step('Assert: user is on onboarding page', async () => {
        await expect(page).toHaveURL(/\/onboarding$/);
      });
      await test.step('Verify waiting partner panel', async () => {
        await expect(page.getByTestId('waiting-partner-panel')).toBeVisible();
      });
      await test.step('Verify waiting partner panel', async () => {
        await expect(page.getByTestId('waiting-partner-panel')).toContainText('Dein Paarraum wartet auf deinen Partner');
      });
      await test.step('Verify waiting partner panel', async () => {
        await expect(page.getByTestId('waiting-partner-panel')).toContainText('registriert oder einloggt');
      });
      await test.step('Verify couple code panel', async () => {
        await expect(page.getByTestId('couple-code-panel')).toBeVisible();
      });
      await test.step('Verify couple code panel', async () => {
        await expect(page.getByTestId('couple-code-panel')).toContainText(created.couple.inviteCode);
      });
      await test.step('Verify copy couple code', async () => {
        await expect(page.getByTestId('copy-couple-code')).toBeVisible();
      });

      for (const testId of ['nav-garden', 'nav-today', 'nav-quests', 'nav-know-me', 'nav-love-jar', 'nav-memories', 'nav-settings']) {
        await expect(page.getByTestId(testId)).toBeVisible();
      }
      await test.step('Verify nav garden', async () => {
        await expect(page.getByTestId('nav-garden')).toHaveAttribute('href', '/garden');
      });
      await test.step('Verify nav settings', async () => {
        await expect(page.getByTestId('nav-settings')).toHaveAttribute('href', '/settings');
      });
      await test.step('Verify nav today', async () => {
        await expect(page.getByTestId('nav-today')).toBeDisabled();
      });
      await test.step('Verify nav quests', async () => {
        await expect(page.getByTestId('nav-quests')).toBeDisabled();
      });
      await test.step('Verify nav know me', async () => {
        await expect(page.getByTestId('nav-know-me')).toBeDisabled();
      });
      await test.step('Verify nav love jar', async () => {
        await expect(page.getByTestId('nav-love-jar')).toBeDisabled();
      });
      await test.step('Verify nav memories', async () => {
        await expect(page.getByTestId('nav-memories')).toBeDisabled();
      });

      await test.step('Click nav settings', async () => {
        await page.getByTestId('nav-settings').click();
      });
      await test.step('Assert: user reaches settings page', async () => {
        await expect(page).toHaveURL(/\/settings$/);
      });
      await test.step('Verify settings profile panel', async () => {
        await expect(page.getByTestId('settings-profile-panel')).toBeVisible();
      });
      await test.step('Click nav garden', async () => {
        await page.getByTestId('nav-garden').click();
      });
      await test.step('Assert: user is on onboarding page', async () => {
        await expect(page).toHaveURL(/\/onboarding$/);
      });
      await test.step('Verify waiting partner panel', async () => {
        await expect(page.getByTestId('waiting-partner-panel')).toBeVisible();
      });

      await test.step('Open /today', async () => {
        await page.goto('/today');
      });
      await test.step('Assert: user is on onboarding page', async () => {
        await expect(page).toHaveURL(/\/onboarding$/);
      });
    });
  });

  test('login without a couple stays on onboarding', async ({ page, request }) => {
    await test.step('Flow: login without a couple stays on onboarding', async () => {
      const user = testUser('login-no-couple', testRunId());
      await registerByApi(request, user);

      await test.step('Open /onboarding', async () => {
        await page.goto('/onboarding');
      });
      await test.step('Click auth mode login', async () => {
        await page.getByTestId('auth-mode-login').click();
      });
      await test.step('Fill auth email', async () => {
        await page.getByTestId('auth-email').fill(user.email);
      });
      await test.step('Fill auth password', async () => {
        await page.getByTestId('auth-password').fill(user.password);
      });
      await test.step('Click auth submit', async () => {
        await page.getByTestId('auth-submit').click();
      });
      await test.step('Assert: user is on onboarding page', async () => {
        await expect(page).toHaveURL(/\/onboarding$/);
      });
      await test.step('Verify join couple form', async () => {
        await expect(page.getByTestId('join-couple-form')).toBeVisible();
      });
      await test.step('Verify create couple form', async () => {
        await expect(page.getByTestId('create-couple-form')).toBeVisible();
      });
    });
  });

  test('header logout clears the session and returns to onboarding', async ({ page, request }) => {
    await test.step('Flow: header logout clears the session and returns to onboarding', async () => {
      const runId = testRunId();
      const userA = testUser('header-logout-a', runId);
      const userB = testUser('header-logout-b', runId);
      const { partnerA } = await setupCoupleByApi(request, userA, userB);

      await authenticatePage(page.context(), page, partnerA.token);
      await test.step('Verify nav notifications', async () => {
        await expect(page.getByTestId('nav-notifications')).toBeVisible();
      });
      await test.step('Verify nav logout', async () => {
        await expect(page.getByTestId('nav-logout')).toBeVisible();
      });
      await test.step('Verify nav logout', async () => {
        await expect(page.getByTestId('nav-logout')).toHaveAttribute('title', 'Ausloggen');
      });

      await test.step('Click nav logout', async () => {
        await page.getByTestId('nav-logout').click();
      });
      await test.step('Assert: user is on onboarding page', async () => {
        await expect(page).toHaveURL(/\/onboarding$/);
      });
      await test.step('Verify auth form', async () => {
        await expect(page.getByTestId('auth-form')).toBeVisible();
      });
      await test.step('Verify nav notifications', async () => {
        await expect(page.getByTestId('nav-notifications')).toHaveCount(0);
      });
      await test.step('Verify nav logout', async () => {
        await expect(page.getByTestId('nav-logout')).toHaveCount(0);
      });
      await test.step('Assert: auth token is removed from storage', async () => {
        await expect(page.evaluate(() => window.localStorage.getItem('herzgarten_token'))).resolves.toBeNull();
      });
    });
  });

  test('invalid stored user token clears session and shows expired message', async ({ page }) => {
    await test.step('Flow: invalid stored user token clears session and shows expired message', async () => {
      await test.step('Open /onboarding', async () => {
        await page.goto('/onboarding');
      });
      await page.evaluate(() => {
        window.localStorage.setItem('herzgarten_token', 'invalid-token');
      });
      await test.step('Open /today', async () => {
        await page.goto('/today');
      });
      await test.step('Assert: user is on onboarding page', async () => {
        await expect(page).toHaveURL(/\/onboarding$/);
      });
      await test.step('Verify auth form', async () => {
        await expect(page.getByTestId('auth-form')).toBeVisible();
      });
      await test.step('Verify auth error', async () => {
        await expect(page.getByTestId('auth-error')).toHaveText('Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.');
      });
      await test.step('Assert: auth token is removed from storage', async () => {
        await expect(page.evaluate(() => window.localStorage.getItem('herzgarten_token'))).resolves.toBeNull();
      });
    });
  });

  test('authenticated user without couple is routed to onboarding', async ({ page, request }) => {
    await test.step('Flow: authenticated user without couple is routed to onboarding', async () => {
      const auth = await registerByApi(request, testUser('no-couple', testRunId()));
      await test.step('Open /onboarding', async () => {
        await page.goto('/onboarding');
      });
      await page.evaluate((token) => {
        window.localStorage.setItem('herzgarten_token', token);
      }, auth.token);
      await test.step('Open /today', async () => {
        await page.goto('/today');
      });
      await test.step('Assert: user is on onboarding page', async () => {
        await expect(page).toHaveURL(/\/onboarding$/);
      });
      await test.step('Verify join couple form', async () => {
        await expect(page.getByTestId('join-couple-form')).toBeVisible();
      });
    });
  });
});
