import { expect, test } from '@playwright/test';
import { joinCoupleByApi, registerByApi } from '../../helpers/api';
import { createCoupleViaUi, registerViaUi } from '../../helpers/auth';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user flow / pairing create join', () => {
  test('creating a garden shows invite code modal and stays on onboarding until partner joins', async ({ page, context }) => {
    await test.step('Flow: creating a garden shows invite code modal and stays on onboarding until partner joins', async () => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await registerViaUi(page, testUser('onboarding-modal', testRunId()));

      await test.step('Click create couple submit', async () => {
        await page.getByTestId('create-couple-submit').click();
      });
      await test.step('Verify expected result', async () => {
        await expect(page).toHaveURL(/\/onboarding$/);
      });
      await test.step('Verify invite code modal', async () => {
        await expect(page.getByTestId('invite-code-modal')).toBeVisible();
      });
      await test.step('Verify invite code modal', async () => {
        await expect(page.getByTestId('invite-code-modal')).toContainText('Euer Paarcode ist bereit');
      });
      await test.step('Verify invite code modal', async () => {
        await expect(page.getByTestId('invite-code-modal')).toContainText('Gib diesen Code deinem Partner weiter');
      });

      const inviteCode = (await page.getByTestId('invite-modal-code').innerText()).trim();
      await test.step('Verify expected result', async () => {
        expect(inviteCode).toMatch(/^[a-z]+-[a-z]+-\d{4}$/);
      });
      await test.step('Click invite modal copy', async () => {
        await page.getByTestId('invite-modal-copy').click();
      });
      await test.step('Verify invite modal copy', async () => {
        await expect(page.getByTestId('invite-modal-copy')).toContainText('Kopiert');
      });
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(inviteCode);

      await test.step('Click invite modal confirm', async () => {
        await page.getByTestId('invite-modal-confirm').click();
      });
      await test.step('Verify expected result', async () => {
        await expect(page).toHaveURL(/\/onboarding$/);
      });
      await test.step('Verify header couple link', async () => {
        await expect(page.getByTestId('header-couple-link')).toContainText(inviteCode);
      });
      await test.step('Verify waiting partner panel', async () => {
        await expect(page.getByTestId('waiting-partner-panel')).toBeVisible();
      });
      await test.step('Verify waiting partner panel', async () => {
        await expect(page.getByTestId('waiting-partner-panel')).toContainText('Partner fehlt noch');
      });
      await test.step('Verify waiting partner panel', async () => {
        await expect(page.getByTestId('waiting-partner-panel')).toContainText('Der Garten funktioniert erst');
      });
      await test.step('Verify couple code panel', async () => {
        await expect(page.getByTestId('couple-code-panel')).toContainText(inviteCode);
      });
      await test.step('Verify copy couple code', async () => {
        await expect(page.getByTestId('copy-couple-code')).toBeVisible();
      });
      await test.step('Verify nav brand', async () => {
        await expect(page.getByTestId('nav-brand')).toBeVisible();
      });
      await test.step('Click nav brand', async () => {
        await page.getByTestId('nav-brand').click();
      });
      await test.step('Verify expected result', async () => {
        await expect(page).toHaveURL(/\/onboarding$/);
      });
    });
  });

  test('partner can register separately and join later with invite code', async ({ browser }) => {
    await test.step('Flow: partner can register separately and join later with invite code', async () => {
      const runId = testRunId();
      const contextA = await browser.newContext();
      const contextB = await browser.newContext();
      const partnerA = await contextA.newPage();
      const partnerB = await contextB.newPage();

      await registerViaUi(partnerA, testUser('onboarding-a', runId));
      const inviteCode = await createCoupleViaUi(partnerA);

      await registerViaUi(partnerB, testUser('onboarding-b', runId));
      await test.step('Verify join couple form', async () => {
        await expect(partnerB.getByTestId('join-couple-form')).toBeVisible();
      });
      await test.step('Fill invite code input', async () => {
        await partnerB.getByTestId('invite-code-input').fill(inviteCode);
      });
      await test.step('Click join couple submit', async () => {
        await partnerB.getByTestId('join-couple-submit').click();
      });

      await test.step('Verify expected result', async () => {
        await expect(partnerB).toHaveURL(/\/today$/);
      });
      await test.step('Verify today card', async () => {
        await expect(partnerB.getByTestId('today-card')).toBeVisible();
      });

      await contextA.close();
      await contextB.close();
    });
  });

  test('opening partner joined notification refreshes stale couple details', async ({ page, request }) => {
    await test.step('Flow: opening partner joined notification refreshes stale couple details', async () => {
      const runId = testRunId();
      await registerViaUi(page, testUser('notification-refresh-a', runId));
      const inviteCode = await createCoupleViaUi(page);
      await test.step('Verify waiting partner panel', async () => {
        await expect(page.getByTestId('waiting-partner-panel')).toBeVisible();
      });

      const partnerB = await registerByApi(request, testUser('notification-refresh-b', runId));
      await joinCoupleByApi(request, partnerB.token, inviteCode);

      await test.step('Open /notifications', async () => {
        await page.goto('/notifications');
      });
      const joinedNotification = page.getByTestId('notification-item').filter({ hasText: 'Dein Partner ist da' });
      await test.step('Verify expected result', async () => {
        await expect(joinedNotification).toBeVisible();
      });
      await test.step('Click UI control', async () => {
        await joinedNotification.click();
      });
      await test.step('Verify notification detail', async () => {
        await expect(page.getByTestId('notification-detail')).toBeVisible();
      });

      await test.step('Open /today', async () => {
        await page.goto('/today');
      });
      await test.step('Verify expected result', async () => {
        await expect(page).toHaveURL(/\/today$/);
      });
      await test.step('Verify today card', async () => {
        await expect(page.getByTestId('today-card')).toBeVisible();
      });
    });
  });

  test('wrong invite code shows a clear error', async ({ page }) => {
    await test.step('Flow: wrong invite code shows a clear error', async () => {
      await registerViaUi(page, testUser('bad-code'));
      await test.step('Fill invite code input', async () => {
        await page.getByTestId('invite-code-input').fill('apfel-sonne-0000');
      });
      await test.step('Click join couple submit', async () => {
        await page.getByTestId('join-couple-submit').click();
      });
      await test.step('Verify join couple error', async () => {
        await expect(page.getByTestId('join-couple-error')).toBeVisible();
      });
      await test.step('Verify join couple error', async () => {
        await expect(page.getByTestId('join-couple-error')).toContainText('Diesen Paar-Code konnten wir nicht finden');
      });
      await test.step('Verify couple error', async () => {
        await expect(page.getByTestId('couple-error')).toHaveCount(0);
      });
    });
  });

  test('full invite code shows a clear error', async ({ browser }) => {
    await test.step('Flow: full invite code shows a clear error', async () => {
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
      await test.step('Fill invite code input', async () => {
        await partnerB.getByTestId('invite-code-input').fill(inviteCode);
      });
      await test.step('Click join couple submit', async () => {
        await partnerB.getByTestId('join-couple-submit').click();
      });
      await test.step('Verify expected result', async () => {
        await expect(partnerB).toHaveURL(/\/today$/);
      });

      await registerViaUi(thirdUser, testUser('full-code-c', runId));
      await test.step('Fill invite code input', async () => {
        await thirdUser.getByTestId('invite-code-input').fill(inviteCode);
      });
      await test.step('Click join couple submit', async () => {
        await thirdUser.getByTestId('join-couple-submit').click();
      });
      await test.step('Verify join couple error', async () => {
        await expect(thirdUser.getByTestId('join-couple-error')).toContainText('Dieser Paarraum hat bereits zwei Mitglieder');
      });
      await test.step('Verify couple error', async () => {
        await expect(thirdUser.getByTestId('couple-error')).toHaveCount(0);
      });

      await contextA.close();
      await contextB.close();
      await contextC.close();
    });
  });
});
