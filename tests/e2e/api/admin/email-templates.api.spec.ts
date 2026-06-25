import { expect, test } from '@playwright/test';
import { adminLogin } from '../../helpers/adminApi';
import { apiGet, apiPatchRaw } from '../../helpers/api';
import { expectApiError, expectJson } from '../../helpers/apiAssertions';

test.describe('admin api / email templates', () => {
  test('manages email message templates and validates placeholders', async ({ request }) => {
    await test.step('Flow: manages email message templates and validates placeholders', async () => {
      const token = await adminLogin(request);
      const key = 'emails.passwordReset.body';
      const listed = await apiGet<{
        items: Array<{ key: string; namespace: string; requiredParams: string[]; translations: Record<string, { text: string; }>; }>;
      }>(request, '/api/admin/message-templates?namespace=email', token);
      const template = listed.items.find((item) => item.key === key);
      const adminSubject = listed.items.find((item) => item.key === 'emails.adminPasswordReset.subject');
      const adminBody = listed.items.find((item) => item.key === 'emails.adminPasswordReset.body');
      await test.step('Verify expected result', async () => {
        expect(template).toBeTruthy();
      });
      await test.step('Verify expected result', async () => {
        expect(template!.namespace).toBe('email');
      });
      await test.step('Verify expected result', async () => {
        expect(template!.requiredParams.sort()).toEqual(['displayName', 'expiresInMinutes', 'resetUrl']);
      });
      await test.step('Verify expected result', async () => {
        expect(adminSubject).toEqual(
          expect.objectContaining({
            namespace: 'email',
            requiredParams: [],
            translations: expect.objectContaining({
              de: expect.objectContaining({ text: 'Dein Herzgarten-Passwort wurde neu gesetzt' }),
              en: expect.objectContaining({ text: 'Your Herzgarten password was reset' }),
            }),
          }),
        );
      });
      await test.step('Verify expected result', async () => {
        expect(adminBody).toEqual(
          expect.objectContaining({
            namespace: 'email',
            requiredParams: ['displayName'],
            translations: expect.objectContaining({
              de: expect.objectContaining({ text: expect.stringContaining('{displayName}') }),
              en: expect.objectContaining({ text: expect.stringContaining('{displayName}') }),
            }),
          }),
        );
      });
      const originalText = template!.translations.de.text;

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPatchRaw(
            request,
            `/api/admin/message-templates/${key}`,
            { translations: { de: { text: 'Hallo {displayName}, dein Link ist {resetUrl}.' } } },
            token,
          ),
          400,
          'admin.messageTemplateInvalid',
        );
      });

      const customText = 'Hallo {displayName}, dein Link ist {resetUrl} und gilt {expiresInMinutes} Minuten.';
      try {
        const saved = await expectJson<{ items: Array<{ key: string; translations: Record<string, { text: string; }>; }>; }>(
          await apiPatchRaw(
            request,
            `/api/admin/message-templates/${key}`,
            { translations: { de: { text: customText } } },
            token,
          ),
        );
        expect(saved.items.find((item) => item.key === key)?.translations.de.text).toBe(customText);
      } finally {
        await apiPatchRaw(
          request,
          `/api/admin/message-templates/${key}`,
          { translations: { de: { text: originalText } } },
          token,
        );
      }
    });
  });
});
