import { expect, test } from '@playwright/test';
import { apiGetRaw } from '../../helpers/api';
import { setupPages } from '../../helpers/userFlows';

test.describe('user flow / settings', () => {
  test('settings expose export logout and leave couple flows', async ({ browser, request }) => {
    await test.step('Flow: settings expose export logout and leave couple flows', async () => {
      const { contextA, contextB, pageA, partnerA, inviteCode } = await setupPages(browser, request, 'settings');
      const updatedEmail = partnerA.user.email.replace('@', '+updated@');
      const updatedPassword = 'new-password-123';
      await contextA.grantPermissions(['clipboard-read', 'clipboard-write']);

      await test.step('Open /settings', async () => {
        await pageA.goto('/settings');
      });
      await test.step('Verify privacy details', async () => {
        await expect(pageA.getByTestId('privacy-details')).toContainText('Datenschutz auf einen Blick');
      });
      await test.step('Verify privacy details', async () => {
        await expect(pageA.getByTestId('privacy-details')).toContainText('Konto löschen');
      });
      await test.step('Verify settings profile panel', async () => {
        await expect(pageA.getByTestId('settings-profile-panel')).toContainText('Gemischt');
      });
      await test.step('Verify settings profile panel', async () => {
        await expect(pageA.getByTestId('settings-profile-panel')).toContainText('Ausgewogen');
      });
      await test.step('Verify settings profile panel', async () => {
        await expect(pageA.getByTestId('settings-profile-panel')).not.toContainText('mixed');
      });
      await test.step('Verify settings profile panel', async () => {
        await expect(pageA.getByTestId('settings-profile-panel')).not.toContainText('balanced');
      });
      await test.step('Verify settings couple code', async () => {
        await expect(pageA.getByTestId('settings-couple-code')).toHaveText(inviteCode);
      });
      await test.step('Click settings copy couple code', async () => {
        await pageA.getByTestId('settings-copy-couple-code').click();
      });
      await test.step('Verify settings copy couple code', async () => {
        await expect(pageA.getByTestId('settings-copy-couple-code')).toContainText('Kopiert');
      });
      await expect.poll(() => pageA.evaluate(() => navigator.clipboard.readText())).toBe(inviteCode);
      await test.step('Verify settings display name value', async () => {
        await expect(pageA.getByTestId('settings-display-name-value')).toContainText(partnerA.user.displayName);
      });
      await test.step('Click settings display name edit', async () => {
        await pageA.getByTestId('settings-display-name-edit').click();
      });
      await test.step('Fill settings display name input', async () => {
        await pageA.getByTestId('settings-display-name-input').fill('   ');
      });
      await test.step('Click settings display name save', async () => {
        await pageA.getByTestId('settings-display-name-save').click();
      });
      await test.step('Verify settings display name error', async () => {
        await expect(pageA.getByTestId('settings-display-name-error')).toContainText('Bitte gib einen Namen ein');
      });
      await test.step('Fill settings display name input', async () => {
        await pageA.getByTestId('settings-display-name-input').fill('Neuer Profilname');
      });
      await test.step('Click settings display name save', async () => {
        await pageA.getByTestId('settings-display-name-save').click();
      });
      await test.step('Verify settings display name value', async () => {
        await expect(pageA.getByTestId('settings-display-name-value')).toContainText('Neuer Profilname');
      });
      await test.step('Verify settings display name success', async () => {
        await expect(pageA.getByTestId('settings-display-name-success')).toContainText('Profil wurde gespeichert');
      });

      await test.step('Click settings email edit', async () => {
        await pageA.getByTestId('settings-email-edit').click();
      });
      await test.step('Fill settings email input', async () => {
        await pageA.getByTestId('settings-email-input').fill('keine-email');
      });
      await test.step('Click settings email save', async () => {
        await pageA.getByTestId('settings-email-save').click();
      });
      await test.step('Verify settings email error', async () => {
        await expect(pageA.getByTestId('settings-email-error')).toContainText('gültige E-Mail-Adresse');
      });
      await test.step('Fill settings email input', async () => {
        await pageA.getByTestId('settings-email-input').fill(updatedEmail);
      });
      await test.step('Click settings email save', async () => {
        await pageA.getByTestId('settings-email-save').click();
      });
      await test.step('Verify settings email value', async () => {
        await expect(pageA.getByTestId('settings-email-value')).toContainText(updatedEmail);
      });
      await test.step('Verify settings email success', async () => {
        await expect(pageA.getByTestId('settings-email-success')).toContainText('Profil wurde gespeichert');
      });

      await test.step('Click settings password edit', async () => {
        await pageA.getByTestId('settings-password-edit').click();
      });
      await test.step('Fill settings current password input', async () => {
        await pageA.getByTestId('settings-current-password-input').fill('password123');
      });
      await test.step('Fill settings new password input', async () => {
        await pageA.getByTestId('settings-new-password-input').fill('short');
      });
      await test.step('Click settings password save', async () => {
        await pageA.getByTestId('settings-password-save').click();
      });
      await test.step('Verify settings password error', async () => {
        await expect(pageA.getByTestId('settings-password-error')).toContainText('mindestens 8 Zeichen');
      });
      await test.step('Fill settings new password input', async () => {
        await pageA.getByTestId('settings-new-password-input').fill(updatedPassword);
      });
      await test.step('Click settings password save', async () => {
        await pageA.getByTestId('settings-password-save').click();
      });
      await test.step('Verify settings password success', async () => {
        await expect(pageA.getByTestId('settings-password-success')).toContainText('Passwort wurde gespeichert');
      });
      await test.step('Verify settings password success', async () => {
        await expect(pageA.getByTestId('settings-password-success')).toHaveCount(0, { timeout: 7000 });
      });

      const meResponse = await apiGetRaw(request, '/api/me', partnerA.token);
      await test.step('Verify expected result', async () => {
        expect(meResponse.ok()).toBeTruthy();
      });
      const mePayload = await meResponse.json();
      await test.step('Verify expected result', async () => {
        expect(mePayload.user).toEqual(expect.objectContaining({ displayName: 'Neuer Profilname', email: updatedEmail }));
      });

      const downloadPromise = pageA.waitForEvent('download');
      await test.step('Click settings export', async () => {
        await pageA.getByTestId('settings-export').click();
      });
      await downloadPromise;

      await test.step('Click settings logout', async () => {
        await pageA.getByTestId('settings-logout').click();
      });
      await test.step('Open /today', async () => {
        await pageA.goto('/today');
      });
      await test.step('Verify expected result', async () => {
        await expect(pageA).toHaveURL(/\/onboarding$/);
      });
      await test.step('Click auth mode login', async () => {
        await pageA.getByTestId('auth-mode-login').click();
      });
      await test.step('Fill auth email', async () => {
        await pageA.getByTestId('auth-email').fill(updatedEmail);
      });
      await test.step('Fill auth password', async () => {
        await pageA.getByTestId('auth-password').fill(updatedPassword);
      });
      await test.step('Click auth submit', async () => {
        await pageA.getByTestId('auth-submit').click();
      });
      await test.step('Verify expected result', async () => {
        await expect(pageA).toHaveURL(/\/today$/);
      });
      await test.step('Verify today card', async () => {
        await expect(pageA.getByTestId('today-card')).toBeVisible();
      });

      await contextA.close();
      await contextB.close();
    });
  });

  test('settings persist push notification mode', async ({ browser, request }) => {
    await test.step('Flow: settings persist push notification mode', async () => {
      const { contextA, contextB, pageA, partnerA } = await setupPages(browser, request, 'settings-push-mode');

      await test.step('Open /settings', async () => {
        await pageA.goto('/settings');
      });
      await test.step('Verify settings push mode all', async () => {
        await expect(pageA.getByTestId('settings-push-mode-all')).toHaveAttribute('aria-pressed', 'true');
      });
      await test.step('Verify settings push mode actions only', async () => {
        await expect(pageA.getByTestId('settings-push-mode-actions-only')).toHaveAttribute('aria-pressed', 'false');
      });

      await test.step('Click settings push mode actions only', async () => {
        await pageA.getByTestId('settings-push-mode-actions-only').click();
      });
      await test.step('Verify settings push mode success', async () => {
        await expect(pageA.getByTestId('settings-push-mode-success')).toContainText('Push-Auswahl wurde gespeichert');
      });
      await test.step('Verify settings push mode actions only', async () => {
        await expect(pageA.getByTestId('settings-push-mode-actions-only')).toHaveAttribute('aria-pressed', 'true');
      });

      const meResponse = await apiGetRaw(request, '/api/me', partnerA.token);
      await test.step('Verify expected result', async () => {
        expect(meResponse.ok()).toBeTruthy();
      });
      const mePayload = await meResponse.json();
      await test.step('Verify expected result', async () => {
        expect(mePayload.user.preferences.pushNotificationMode).toBe('actions_only');
      });

      await pageA.reload();
      await test.step('Verify settings push mode actions only', async () => {
        await expect(pageA.getByTestId('settings-push-mode-actions-only')).toHaveAttribute('aria-pressed', 'true');
      });

      await contextA.close();
      await contextB.close();
    });
  });

  test('feature explainer boxes can be hidden and re-enabled in settings', async ({ browser, request }) => {
    await test.step('Flow: feature explainer boxes can be hidden and re-enabled in settings', async () => {
      const { contextA, contextB, pageA } = await setupPages(browser, request, 'settings-hints');

      await test.step('Open /today', async () => {
        await pageA.goto('/today');
      });
      await test.step('Verify feature explainer today', async () => {
        await expect(pageA.getByTestId('feature-explainer-today')).toBeVisible();
      });
      await test.step('Click feature explainer close today', async () => {
        await pageA.getByTestId('feature-explainer-close-today').click();
      });
      await test.step('Verify feature explainer today', async () => {
        await expect(pageA.getByTestId('feature-explainer-today')).toHaveCount(0);
      });

      await test.step('Open /settings', async () => {
        await pageA.goto('/settings');
      });
      const todayToggle = pageA.getByTestId('settings-feature-explainer-today');
      await test.step('Verify expected result', async () => {
        await expect(todayToggle).not.toBeChecked();
      });
      await todayToggle.check();
      await test.step('Verify expected result', async () => {
        await expect(todayToggle).toBeChecked();
      });
      await test.step('Verify settings feature explainer today success', async () => {
        await expect(pageA.getByTestId('settings-feature-explainer-today-success')).toContainText('Hinweis-Einstellung wurde gespeichert');
      });
      await test.step('Verify settings feature explainer today success', async () => {
        await expect(pageA.getByTestId('settings-feature-explainer-today-success')).toHaveCount(0, { timeout: 7000 });
      });

      await test.step('Open /today', async () => {
        await pageA.goto('/today');
      });
      await test.step('Verify feature explainer today', async () => {
        await expect(pageA.getByTestId('feature-explainer-today')).toBeVisible();
      });

      await contextA.close();
      await contextB.close();
    });
  });
});
