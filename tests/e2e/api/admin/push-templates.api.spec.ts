import { expect, test } from '@playwright/test';
import { adminLogin } from '../../helpers/adminApi';
import { apiGet } from '../../helpers/api';

test.describe('admin api / push templates', () => {
  test('lists push message templates', async ({ request }) => {
    await test.step('Flow: lists push message templates', async () => {
      const token = await adminLogin(request);
      const listed = await apiGet<{
        items: Array<{ key: string; namespace: string; requiredParams: string[]; translations: Record<string, { text: string; }>; }>;
      }>(request, '/api/admin/message-templates?namespace=push', token);
      const questPush = listed.items.find((item) => item.key === 'push.bodies.questWaitingConfirmation');
      const testPush = listed.items.find((item) => item.key === 'push.bodies.test');
      const adminPasswordResetTitle = listed.items.find((item) => item.key === 'push.titles.adminPasswordReset');
      const adminPasswordResetBody = listed.items.find((item) => item.key === 'push.bodies.adminPasswordReset');
      await test.step('Verify expected result', async () => {
        expect(questPush).toBeTruthy();
      });
      await test.step('Verify expected result', async () => {
        expect(questPush!.namespace).toBe('push');
      });
      await test.step('Verify expected result', async () => {
        expect(questPush!.requiredParams.sort()).toEqual(['name', 'title']);
      });
      await test.step('Verify expected result', async () => {
        expect(questPush!.translations.de.text).toContain('{name}');
      });
      await test.step('Verify expected result', async () => {
        expect(testPush?.translations.de.text).toBe('Push-Benachrichtigungen sind aktiv.');
      });
      await test.step('Verify expected result', async () => {
        expect(adminPasswordResetTitle?.translations.de.text).toContain('Passwort');
      });
      await test.step('Verify expected result', async () => {
        expect(adminPasswordResetBody?.translations.de.text).toContain('Administrator');
      });
    });
  });
});
