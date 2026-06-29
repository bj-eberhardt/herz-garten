import { expect, test } from '@playwright/test';
import { adminLogin } from '../../helpers/adminApi';
import { apiGet, apiGetRaw, apiPatchRaw, apiPostRaw, setupCoupleByApi } from '../../helpers/api';
import { expectApiError, expectJson, type ErrorPayload } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

interface MessageTemplateItem {
  key: string;
  namespace: string;
  description: string;
  active: boolean;
  requiredParams: string[];
  translations: Record<string, { text: string; description: string }>;
}

const key = 'notifications.bodies.questWaitingConfirmation';
const subjectKey = 'notifications.titles.dailyAnswerWaiting';
const validText = 'Admin-Test: {name} wartet bei "{title}".';
const overlongDescription = 'x'.repeat(501);
const overlongQueryValue = 'x'.repeat(201);

function validationErrorCodes(payload: ErrorPayload) {
  const validationErrors = payload.params?.validationErrors;
  expect(Array.isArray(validationErrors)).toBeTruthy();
  return (validationErrors as Array<{ errorCode: string }>).map((error) => error.errorCode);
}

test.describe('admin api / notification templates', () => {
  test('manages notification message templates and validates placeholders', async ({ request }) => {
    await test.step('Flow: manages notification message templates and validates placeholders', async () => {
      const token = await adminLogin(request);

      const listed = await apiGet<{ items: MessageTemplateItem[] }>(request, '/api/admin/message-templates?namespace=notifications', token);
      const template = listed.items.find((item) => item.key === key);
      expect(template).toBeTruthy();
      expect(template).toEqual(expect.objectContaining({ namespace: 'notifications', active: true, description: expect.any(String) }));
      expect(template!.requiredParams.sort()).toEqual(['name', 'title']);
      expect(template!.translations.de.description).toEqual(expect.any(String));
      const originalTranslations = template!.translations;
      const coupleJoinedTitle = listed.items.find((item) => item.key === 'notifications.titles.coupleJoined');
      const coupleJoinedBody = listed.items.find((item) => item.key === 'notifications.bodies.coupleJoined');
      expect(coupleJoinedTitle).toBeTruthy();
      expect(coupleJoinedTitle!.requiredParams).toEqual(['name']);
      expect(coupleJoinedTitle!.translations.de.text).toBe('Dein Partner ist da');
      expect(coupleJoinedBody).toBeTruthy();
      expect(coupleJoinedBody!.requiredParams).toEqual(['name']);
      expect(coupleJoinedBody!.translations.de.text).toBe(
        'Toll, {name} hat deinen Paarraum betreten. Ihr k\u00f6nnt nun gemeinsam an eurem Garten arbeiten.',
      );

      await expectApiError(
        await apiPatchRaw(request, `/api/admin/message-templates/${key}`, { translations: { de: { text: '{name} hat best?tigt.' } } }, token),
        400,
        'admin.messageTemplateInvalid',
      );

      await expectApiError(
        await apiPatchRaw(request, `/api/admin/message-templates/${key}`, { translations: { de: { text: '{name} hat "{title}" mit {extra} best?tigt.' } } }, token),
        400,
        'admin.messageTemplateInvalid',
      );

      try {
        const saved = await expectJson<{ items: MessageTemplateItem[] }>(
          await apiPatchRaw(request, `/api/admin/message-templates/${key}`, { translations: { de: { text: validText } } }, token),
        );
        expect(saved.items.find((item) => item.key === key)?.translations.de.text).toBe(validText);

        const runId = testRunId();
        const setup = await setupCoupleByApi(request, testUser('admin-message-a', runId), testUser('admin-message-b', runId));
        const questPayload = await apiGet<{ quests: Array<{ id: string; title: string; requiresBothPartners: boolean }> }>(
          request,
          '/api/quests',
          setup.partnerA.token,
        );
        const quest = questPayload.quests.find((item) => item.requiresBothPartners);
        expect(quest).toBeTruthy();

        await expectJson(await apiPostRaw(request, `/api/quests/${quest!.id}/complete`, {}, setup.partnerA.token));
        const notifications = await apiGet<{ notifications: Array<{ body: string; bodyKey: string }> }>(
          request,
          '/api/notifications',
          setup.partnerB.token,
        );
        expect(notifications.notifications.find((item) => item.bodyKey === key)?.body).toBe(
          `Admin-Test: ${setup.partnerA.user.displayName} wartet bei "${quest!.title}".`,
        );
      } finally {
        await apiPatchRaw(request, `/api/admin/message-templates/${key}`, { translations: originalTranslations }, token);
      }
    });
  });

  test('rejects invalid auth and query parameters', async ({ request }) => {
    const token = await adminLogin(request);

    await expectApiError(await apiGetRaw(request, '/api/admin/message-templates?namespace=notifications'), 401, 'auth.missingToken');
    await expectApiError(await apiGetRaw(request, '/api/admin/message-templates?namespace=notifications', 'not-a-token'), 401, 'auth.invalidToken');
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

    const defaultList = await apiGet<{ items: MessageTemplateItem[] }>(request, '/api/admin/message-templates', token);
    expect(defaultList.items.some((item) => item.namespace === 'notifications')).toBe(true);
    const englishList = await apiGet<{ items: MessageTemplateItem[] }>(request, '/api/admin/message-templates?namespace=notifications&lang=en', token);
    expect(englishList.items.find((item) => item.key === key)?.description).toEqual(expect.any(String));

    for (const path of [
      '/api/admin/message-templates?namespace=unknown',
      '/api/admin/message-templates?namespace=',
      `/api/admin/message-templates?namespace=${overlongQueryValue}`,
      '/api/admin/message-templates?lang=de-DE-extra',
      '/api/admin/message-templates?namespace=notifications&unexpected=true',
    ]) {
      await expectApiError(await apiGetRaw(request, path, token), 400, 'common.validation');
    }

    for (const path of [
      `/api/admin/message-templates/${key}?unexpected=true`,
      `/api/admin/message-templates/${key}?lang=de-DE-extra`,
    ]) {
      await expectApiError(await apiPatchRaw(request, path, { translations: { de: { text: validText } } }, token), 400, 'common.validation');
    }
  });

  test('rejects invalid notification template payload shapes', async ({ request }) => {
    const token = await adminLogin(request);
    const invalidBodies = [
      {},
      { translations: null },
      { translations: { de: null } },
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

  test('rejects invalid notification template content', async ({ request }) => {
    const token = await adminLogin(request);
    const listed = await apiGet<{ items: MessageTemplateItem[] }>(request, '/api/admin/message-templates?namespace=notifications', token);
    const template = listed.items.find((item) => item.key === key);
    const subjectTemplate = listed.items.find((item) => item.key === subjectKey);
    expect(template).toBeTruthy();
    expect(subjectTemplate).toBeTruthy();

    await expectApiError(
      await apiPatchRaw(request, '/api/admin/message-templates/notifications.unknown.body', { translations: { de: { text: validText } } }, token),
      404,
      'admin.messageTemplateNotFound',
    );

    const missingText = await expectApiError(
      await apiPatchRaw(
        request,
        `/api/admin/message-templates/${key}`,
        { translations: { de: { text: ' ', description: template!.translations.de.description } } },
        token,
      ),
      400,
      'admin.messageTemplateInvalid',
    );
    expect(validationErrorCodes(missingText)).toContain('admin.messageTemplate.defaultTranslationRequired');

    const missingDescription = await expectApiError(
      await apiPatchRaw(request, `/api/admin/message-templates/${key}`, { translations: { de: { text: validText, description: ' ' } } }, token),
      400,
      'admin.messageTemplateInvalid',
    );
    expect(validationErrorCodes(missingDescription)).toContain('admin.messageTemplate.defaultDescriptionRequired');

    for (const text of [
      'Admin-Test: {name} wartet bei "{headline}".',
      template!.translations.en.text.replace('{title}', '{headline}'),
    ]) {
      const payload = await expectApiError(
        await apiPatchRaw(request, `/api/admin/message-templates/${key}`, { translations: { de: { text } } }, token),
        400,
        'admin.messageTemplateInvalid',
      );
      expect(validationErrorCodes(payload)).toContain('admin.messageTemplate.placeholderMismatch');
    }

    const malformed = await expectApiError(
      await apiPatchRaw(
        request,
        `/api/admin/message-templates/${subjectKey}`,
        { translations: { de: { text: 'Titel {broken', description: subjectTemplate!.translations.de.description } } },
        token,
      ),
      400,
      'admin.messageTemplateInvalid',
    );
    expect(validationErrorCodes(malformed)).toContain('admin.messageTemplate.placeholderMalformed');

    const unsupportedLocale = await expectApiError(
      await apiPatchRaw(request, `/api/admin/message-templates/${key}`, { translations: { xx: { text: validText, description: 'Unsupported' } } }, token),
      400,
      'admin.messageTemplateInvalid',
    );
    expect(validationErrorCodes(unsupportedLocale)).toContain('admin.messageTemplate.unsupportedLocale');
  });
});