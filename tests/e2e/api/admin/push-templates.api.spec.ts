import { expect, test } from '@playwright/test';
import { adminLogin } from '../../helpers/adminApi';
import { apiGet, apiGetRaw, apiPatchRaw } from '../../helpers/api';
import { expectApiError, expectJson, type ErrorPayload } from '../../helpers/apiAssertions';

interface MessageTemplateItem {
  key: string;
  namespace: string;
  description: string;
  active: boolean;
  requiredParams: string[];
  translations: Record<string, { text: string; description: string }>;
}

const key = 'push.bodies.questWaitingConfirmation';
const subjectKey = 'push.titles.test';
const validText = 'Admin-Test: {name} bestaetigt "{title}".';
const overlongDescription = 'x'.repeat(501);
const overlongQueryValue = 'x'.repeat(201);

function validationErrorCodes(payload: ErrorPayload) {
  const validationErrors = payload.params?.validationErrors;
  expect(Array.isArray(validationErrors)).toBeTruthy();
  return (validationErrors as Array<{ errorCode: string }>).map((error) => error.errorCode);
}

test.describe('admin api / push templates', () => {
  test('manages push message templates and validates placeholders', async ({ request }) => {
    await test.step('Flow: manages push message templates and validates placeholders', async () => {
      const token = await adminLogin(request);
      const listed = await apiGet<{ items: MessageTemplateItem[] }>(request, '/api/admin/message-templates?namespace=push', token);
      const questPush = listed.items.find((item) => item.key === key);
      const testTitle = listed.items.find((item) => item.key === 'push.titles.test');
      const testPush = listed.items.find((item) => item.key === 'push.bodies.test');
      const adminPasswordResetTitle = listed.items.find((item) => item.key === 'push.titles.adminPasswordReset');
      const adminPasswordResetBody = listed.items.find((item) => item.key === 'push.bodies.adminPasswordReset');

      expect(questPush).toBeTruthy();
      expect(questPush).toEqual(expect.objectContaining({ namespace: 'push', active: true, description: expect.any(String) }));
      expect([...questPush!.requiredParams].sort()).toEqual(['name', 'title']);
      expect(questPush!.translations.de).toEqual(
        expect.objectContaining({ text: expect.stringContaining('{name}'), description: expect.any(String) }),
      );
      expect(questPush!.translations.en).toEqual(
        expect.objectContaining({ text: expect.stringContaining('{title}'), description: expect.any(String) }),
      );
      expect(testTitle).toEqual(
        expect.objectContaining({ namespace: 'push', requiredParams: [], translations: expect.objectContaining({ de: expect.any(Object) }) }),
      );
      expect(testPush?.translations.de.text).toBe('Push-Benachrichtigungen sind aktiv.');
      expect(testPush?.translations.en.text).toBe('Push notifications are active.');
      expect(adminPasswordResetTitle?.translations.de.text).toContain('Passwort');
      expect(adminPasswordResetBody?.translations.de.text).toContain('Administrator');
      const originalTranslations = questPush!.translations;

      await expectApiError(
        await apiPatchRaw(request, `/api/admin/message-templates/${key}`, { translations: { de: { text: '{name} hat bestaetigt.' } } }, token),
        400,
        'admin.messageTemplateInvalid',
      );

      await expectApiError(
        await apiPatchRaw(
          request,
          `/api/admin/message-templates/${key}`,
          { translations: { de: { text: '{name} hat "{title}" mit {extra} bestaetigt.' } } },
          token,
        ),
        400,
        'admin.messageTemplateInvalid',
      );

      try {
        const saved = await expectJson<{ items: MessageTemplateItem[] }>(
          await apiPatchRaw(request, `/api/admin/message-templates/${key}`, { translations: { de: { text: validText } } }, token),
        );
        expect(saved.items.find((item) => item.key === key)?.translations.de.text).toBe(validText);
      } finally {
        await apiPatchRaw(request, `/api/admin/message-templates/${key}`, { translations: originalTranslations }, token);
      }
    });
  });

  test('rejects invalid auth and query parameters', async ({ request }) => {
    const token = await adminLogin(request);

    await test.step('Reject missing and invalid auth', async () => {
      await expectApiError(await apiGetRaw(request, '/api/admin/message-templates?namespace=push'), 401, 'auth.missingToken');
      await expectApiError(await apiGetRaw(request, '/api/admin/message-templates?namespace=push', 'not-a-token'), 401, 'auth.invalidToken');
      await expectApiError(
        await apiPatchRaw(request, `/api/admin/message-templates/${key}`, { translations: { de: { text: validText } } }),
        401,
        'auth.missingToken',
      );
      await expectApiError(
        await apiPatchRaw(request, `/api/admin/message-templates/${key}`, { translations: { de: { text: validText } } }, 'not-a-token'),
        401,
        'auth.invalidToken',
      );
    });

    await test.step('Reject invalid list queries', async () => {
      for (const path of [
        '/api/admin/message-templates?namespace=unknown',
        '/api/admin/message-templates?namespace=',
        `/api/admin/message-templates?namespace=${overlongQueryValue}`,
        '/api/admin/message-templates?lang=de-DE-extra',
        '/api/admin/message-templates?namespace=push&unexpected=true',
      ]) {
        await expectApiError(await apiGetRaw(request, path, token), 400, 'common.validation');
      }
    });

    await test.step('Reject invalid patch queries', async () => {
      for (const path of [`/api/admin/message-templates/${key}?lang=de-DE-extra`, `/api/admin/message-templates/${key}?unexpected=true`]) {
        await expectApiError(await apiPatchRaw(request, path, { translations: { de: { text: validText } } }, token), 400, 'common.validation');
      }
    });
  });

  test('rejects invalid push template payload shapes', async ({ request }) => {
    const token = await adminLogin(request);
    const invalidBodies = [
      {},
      { translations: null },
      { translations: {} },
      { translations: { de: null } },
      { translations: { de: {} } },
      { translations: { de: { text: null } } },
      { translations: { de: { text: 123 } } },
      { translations: { de: { description: null } } },
      { translations: { de: { description: 123 } } },
      { translations: { de: { text: validText, extra: true } } },
      { translations: { de: { text: validText, description: overlongDescription } } },
      { translations: { 'de-extra': { text: validText } } },
      { translations: { de: { text: validText } }, extra: true },
    ];

    for (const body of invalidBodies) {
      await expectApiError(await apiPatchRaw(request, `/api/admin/message-templates/${key}`, body, token), 400, 'common.validation');
    }
  });

  test('rejects invalid push template content', async ({ request }) => {
    const token = await adminLogin(request);
    const listed = await apiGet<{ items: MessageTemplateItem[] }>(request, '/api/admin/message-templates?namespace=push', token);
    const template = listed.items.find((item) => item.key === key);
    const subjectTemplate = listed.items.find((item) => item.key === subjectKey);
    expect(template).toBeTruthy();
    expect(subjectTemplate).toBeTruthy();

    await test.step('Reject unknown template key', async () => {
      await expectApiError(
        await apiPatchRaw(request, '/api/admin/message-templates/push.unknown.body', { translations: { de: { text: validText } } }, token),
        404,
        'admin.messageTemplateNotFound',
      );
    });

    await test.step('Reject missing default text', async () => {
      const payload = await expectApiError(
        await apiPatchRaw(
          request,
          `/api/admin/message-templates/${key}`,
          { translations: { de: { text: ' ', description: template!.translations.de.description } } },
          token,
        ),
        400,
        'admin.messageTemplateInvalid',
      );
      expect(validationErrorCodes(payload)).toContain('admin.messageTemplate.defaultTranslationRequired');
    });

    await test.step('Reject missing default description', async () => {
      const payload = await expectApiError(
        await apiPatchRaw(request, `/api/admin/message-templates/${key}`, { translations: { de: { text: validText, description: ' ' } } }, token),
        400,
        'admin.messageTemplateInvalid',
      );
      expect(validationErrorCodes(payload)).toContain('admin.messageTemplate.defaultDescriptionRequired');
    });

    await test.step('Reject extra and wrong placeholders', async () => {
      for (const text of [
        'Admin-Test: {name} bestaetigt.',
        'Admin-Test: {name} bestaetigt "{headline}".',
        `${validText} {extra}`,
        template!.translations.en.text.replace('{title}', '{headline}'),
      ]) {
        const payload = await expectApiError(
          await apiPatchRaw(request, `/api/admin/message-templates/${key}`, { translations: { de: { text } } }, token),
          400,
          'admin.messageTemplateInvalid',
        );
        expect(validationErrorCodes(payload)).toContain('admin.messageTemplate.placeholderMismatch');
      }
    });

    await test.step('Reject malformed placeholder syntax even when no placeholders are required', async () => {
      const payload = await expectApiError(
        await apiPatchRaw(
          request,
          `/api/admin/message-templates/${subjectKey}`,
          { translations: { de: { text: 'Push {broken', description: subjectTemplate!.translations.de.description } } },
          token,
        ),
        400,
        'admin.messageTemplateInvalid',
      );
      expect(validationErrorCodes(payload)).toContain('admin.messageTemplate.placeholderMalformed');
    });

    await test.step('Reject unsupported locale keys', async () => {
      const payload = await expectApiError(
        await apiPatchRaw(request, `/api/admin/message-templates/${key}`, { translations: { xx: { text: validText, description: 'Unsupported' } } }, token),
        400,
        'admin.messageTemplateInvalid',
      );
      expect(validationErrorCodes(payload)).toContain('admin.messageTemplate.unsupportedLocale');
    });
  });
});
