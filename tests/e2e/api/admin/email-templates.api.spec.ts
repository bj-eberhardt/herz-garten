import { expect, test } from '@playwright/test';
import { adminLogin } from '../../helpers/adminApi';
import { apiGet, apiGetRaw, apiPatchRaw } from '../../helpers/api';
import { expectApiError, expectJson, type ErrorPayload } from '../../helpers/apiAssertions';

interface MessageTemplateItem {
  key: string;
  namespace: string;
  requiredParams: string[];
  translations: Record<string, { text: string; description: string; }>;
}

const passwordResetBodyKey = 'emails.passwordReset.body';
const passwordResetSubjectKey = 'emails.passwordReset.subject';
const validPasswordResetBody = 'Hallo {displayName}, dein Link ist {resetUrl} und gilt {expiresInMinutes} Minuten.';
const overlongDescription = 'x'.repeat(501);
const overlongQueryValue = 'x'.repeat(201);

function validationErrorCodes(payload: ErrorPayload) {
  const validationErrors = payload.params?.validationErrors;
  expect(Array.isArray(validationErrors)).toBeTruthy();
  return (validationErrors as Array<{ errorCode: string }>).map((error) => error.errorCode);
}

test.describe('admin api / email templates', () => {
  test('manages email message templates and validates placeholders', async ({ request }) => {
    await test.step('Flow: manages email message templates and validates placeholders', async () => {
      const token = await adminLogin(request);
      const listed = await apiGet<{ items: MessageTemplateItem[]; }>(request, '/api/admin/message-templates?namespace=email', token);
      const template = listed.items.find((item) => item.key === passwordResetBodyKey);
      const adminSubject = listed.items.find((item) => item.key === 'emails.adminPasswordReset.subject');
      const adminBody = listed.items.find((item) => item.key === 'emails.adminPasswordReset.body');
      await test.step('Verify password reset template metadata', async () => {
        expect(template).toBeTruthy();
        expect(template!.namespace).toBe('email');
        expect(template!.requiredParams.sort()).toEqual(['displayName', 'expiresInMinutes', 'resetUrl']);
      });
      await test.step('Verify admin password reset seed templates', async () => {
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

      await test.step('Reject missing placeholder', async () => {
        await expectApiError(
          await apiPatchRaw(
            request,
            `/api/admin/message-templates/${passwordResetBodyKey}`,
            { translations: { de: { text: 'Hallo {displayName}, dein Link ist {resetUrl}.' } } },
            token,
          ),
          400,
          'admin.messageTemplateInvalid',
        );
      });

      try {
        const saved = await expectJson<{ items: MessageTemplateItem[]; }>(
          await apiPatchRaw(
            request,
            `/api/admin/message-templates/${passwordResetBodyKey}`,
            { translations: { de: { text: validPasswordResetBody } } },
            token,
          ),
        );
        expect(saved.items.find((item) => item.key === passwordResetBodyKey)?.translations.de.text).toBe(validPasswordResetBody);
      } finally {
        await apiPatchRaw(
          request,
          `/api/admin/message-templates/${passwordResetBodyKey}`,
          { translations: { de: { text: originalText } } },
          token,
        );
      }
    });
  });

  test('rejects invalid auth and query parameters', async ({ request }) => {
    const token = await adminLogin(request);

    await test.step('Reject missing and invalid auth', async () => {
      await expectApiError(await apiGetRaw(request, '/api/admin/message-templates?namespace=email'), 401, 'auth.missingToken');
      await expectApiError(await apiGetRaw(request, '/api/admin/message-templates?namespace=email', 'not-a-token'), 401, 'auth.invalidToken');
      await expectApiError(
        await apiPatchRaw(request, `/api/admin/message-templates/${passwordResetBodyKey}`, { translations: { de: { text: validPasswordResetBody } } }),
        401,
        'auth.missingToken',
      );
      await expectApiError(
        await apiPatchRaw(
          request,
          `/api/admin/message-templates/${passwordResetBodyKey}`,
          { translations: { de: { text: validPasswordResetBody } } },
          'not-a-token',
        ),
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
        '/api/admin/message-templates?namespace=email&unexpected=true',
      ]) {
        await expectApiError(await apiGetRaw(request, path, token), 400, 'common.validation');
      }
    });

    await test.step('Reject invalid patch queries', async () => {
      for (const path of [
        `/api/admin/message-templates/${passwordResetBodyKey}?lang=de-DE-extra`,
        `/api/admin/message-templates/${passwordResetBodyKey}?unexpected=true`,
      ]) {
        await expectApiError(
          await apiPatchRaw(request, path, { translations: { de: { text: validPasswordResetBody } } }, token),
          400,
          'common.validation',
        );
      }
    });
  });

  test('rejects invalid message template payload shapes', async ({ request }) => {
    const token = await adminLogin(request);
    const invalidBodies = [
      {},
      { translations: null },
      { translations: { de: null } },
      { translations: { de: { text: null } } },
      { translations: { de: { text: 123 } } },
      { translations: { de: { description: null } } },
      { translations: { de: { description: 123 } } },
      { translations: { de: { text: validPasswordResetBody, extra: true } } },
      { translations: { de: { text: validPasswordResetBody, description: overlongDescription } } },
      { translations: { 'de-extra': { text: validPasswordResetBody } } },
      { translations: { de: { text: validPasswordResetBody } }, extra: true },
    ];

    for (const body of invalidBodies) {
      await expectApiError(
        await apiPatchRaw(request, `/api/admin/message-templates/${passwordResetBodyKey}`, body, token),
        400,
        'common.validation',
      );
    }
  });

  test('rejects invalid email template content', async ({ request }) => {
    const token = await adminLogin(request);
    const listed = await apiGet<{ items: MessageTemplateItem[]; }>(request, '/api/admin/message-templates?namespace=email', token);
    const bodyTemplate = listed.items.find((item) => item.key === passwordResetBodyKey);
    const subjectTemplate = listed.items.find((item) => item.key === passwordResetSubjectKey);
    expect(bodyTemplate).toBeTruthy();
    expect(subjectTemplate).toBeTruthy();

    await test.step('Reject unknown template key', async () => {
      await expectApiError(
        await apiPatchRaw(request, '/api/admin/message-templates/emails.unknown.body', { translations: { de: { text: validPasswordResetBody } } }, token),
        404,
        'admin.messageTemplateNotFound',
      );
    });

    await test.step('Reject missing default text', async () => {
      const payload = await expectApiError(
        await apiPatchRaw(
          request,
          `/api/admin/message-templates/${passwordResetBodyKey}`,
          { translations: { de: { text: ' ', description: bodyTemplate!.translations.de.description } } },
          token,
        ),
        400,
        'admin.messageTemplateInvalid',
      );
      expect(validationErrorCodes(payload)).toContain('admin.messageTemplate.defaultTranslationRequired');
    });

    await test.step('Reject missing default description', async () => {
      const payload = await expectApiError(
        await apiPatchRaw(
          request,
          `/api/admin/message-templates/${passwordResetBodyKey}`,
          { translations: { de: { text: validPasswordResetBody, description: ' ' } } },
          token,
        ),
        400,
        'admin.messageTemplateInvalid',
      );
      expect(validationErrorCodes(payload)).toContain('admin.messageTemplate.defaultDescriptionRequired');
    });

    await test.step('Reject extra and wrong placeholders', async () => {
      for (const text of [
        `${validPasswordResetBody} {extra}`,
        'Hallo {displayName}, dein Link ist {resetLink} und gilt {expiresInMinutes} Minuten.',
        bodyTemplate!.translations.en.text.replace('{resetUrl}', '{resetLink}'),
      ]) {
        const payload = await expectApiError(
          await apiPatchRaw(request, `/api/admin/message-templates/${passwordResetBodyKey}`, { translations: { de: { text } } }, token),
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
          `/api/admin/message-templates/${passwordResetSubjectKey}`,
          { translations: { de: { text: 'Reset {broken', description: subjectTemplate!.translations.de.description } } },
          token,
        ),
        400,
        'admin.messageTemplateInvalid',
      );
      expect(validationErrorCodes(payload)).toContain('admin.messageTemplate.placeholderMalformed');
    });

    await test.step('Reject unsupported locale keys', async () => {
      const payload = await expectApiError(
        await apiPatchRaw(
          request,
          `/api/admin/message-templates/${passwordResetBodyKey}`,
          { translations: { xx: { text: validPasswordResetBody, description: 'Unsupported locale' } } },
          token,
        ),
        400,
        'admin.messageTemplateInvalid',
      );
      expect(validationErrorCodes(payload)).toContain('admin.messageTemplate.unsupportedLocale');
    });
  });
});