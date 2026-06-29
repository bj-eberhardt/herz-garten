import { expect, test } from '@playwright/test';

import { apiGetRaw, registerByApi, setupCoupleByApi } from '../../helpers/api';

import {
  expectApiError,
  expectExportPayload,
  expectJson,
  type AuthPayload,
  type ExportPayload,
} from '../../helpers/apiAssertions';

import { testRunId, testUser } from '../../helpers/testUsers';

const exportDataKeys = [
  'members',
  'dailyQuestionAnswers',
  'coupleQuests',
  'gardenObjects',
  'loveJarNotes',
  'memories',
  'knowMeQuestions',
  'knowMeGuesses',
  'notifications',
] as const;

test.describe('user api / account overview export', () => {
  test('exports paired account overview data with locale selection', async ({ request }) => {
    await test.step('Flow: exports paired account overview data with locale selection', async () => {
      const runId = testRunId();
      let partnerA!: AuthPayload;
      let partnerB!: AuthPayload;

      await test.step('Arrange: create paired users', async () => {
        const setup = await setupCoupleByApi(
          request,
          testUser('api-export-couple-a', runId),
          testUser('api-export-couple-b', runId),
        );
        partnerA = setup.partnerA;
        partnerB = setup.partnerB;
      });

      let exported!: ExportPayload;
      await test.step('Act: export account overview in English', async () => {
        exported = await expectJson<ExportPayload>(await apiGetRaw(request, '/api/me/export?lang=en', partnerA.token));
      });

      await test.step('Assert: export contains current user and couple data', async () => {

        expectExportPayload(exported);

        expect(exported.locale).toBe('en');

        expect(exported.user.id).toBe(partnerA.user.id);

        expect(exported.couple).toEqual(expect.objectContaining({ memberCount: 2 }));

        expect(exported.data).toEqual(expect.any(Object));

        for (const key of exportDataKeys) {

        expect(exported.data?.[key]).toEqual(expect.any(Array));

        }

      });

      await test.step('Assert: export includes both couple members', async () => {

        const members = exported.data?.members ?? [];

        expect(members).toEqual(

        expect.arrayContaining([

        expect.objectContaining({ id: partnerA.user.id }),

        expect.objectContaining({ id: partnerB.user.id }),

        ]),

        );

      });
    });
  });

  test('exports user without couple with minimal data', async ({ request }) => {
    await test.step('Flow: exports user without couple with minimal data', async () => {
      let user!: AuthPayload;

      await test.step('Arrange: create authenticated user without couple', async () => {
        user = await registerByApi(request, testUser('api-export-no-couple', testRunId()));
      });

      let exported!: ExportPayload;
      await test.step('Act: export account overview', async () => {
        exported = await expectJson<ExportPayload>(await apiGetRaw(request, '/api/me/export', user.token));
      });

      await test.step('Assert: export omits couple-only data', async () => {

        expectExportPayload(exported);

        expect(exported.user.id).toBe(user.user.id);

        expect(exported.couple).toBeNull();

        expect(exported.data).toBeUndefined();

      });
    });
  });

  test('falls back for syntactically valid unsupported locale', async ({ request }) => {
    await test.step('Flow: falls back for syntactically valid unsupported locale', async () => {
      let user!: AuthPayload;

      await test.step('Arrange: create authenticated user', async () => {
        user = await registerByApi(request, testUser('api-export-locale-fallback', testRunId()));
      });

      let exported!: ExportPayload;
      await test.step('Act: export with unsupported but valid locale', async () => {
        exported = await expectJson<ExportPayload>(await apiGetRaw(request, '/api/me/export?lang=fr', user.token));
      });

      await test.step('Assert: export falls back to supported locale', async () => {

        expectExportPayload(exported);

        expect(exported.locale).not.toBe('fr');

        expect(exported.locale).toEqual(expect.any(String));

      });
    });
  });

  test('rejects missing auth and invalid auth token', async ({ request }) => {
    await test.step('Flow: rejects missing auth and invalid auth token', async () => {
      await test.step('Assert: rejects missing auth token', async () => {
        await expectApiError(await apiGetRaw(request, '/api/me/export'), 401, 'auth.missingToken');
      });

      await test.step('Assert: rejects invalid auth token', async () => {

        await expectApiError(await apiGetRaw(request, '/api/me/export', 'invalid-token'), 401, 'auth.invalidToken');

      });
    });
  });

  test('rejects invalid export query parameters', async ({ request }) => {
    await test.step('Flow: rejects invalid export query parameters', async () => {
      let token = '';

      await test.step('Arrange: create authenticated user', async () => {
        const user = await registerByApi(request, testUser('api-export-query-validation', testRunId()));
        token = user.token;
      });

      await test.step('Assert: rejects unexpected query parameters', async () => {

        await expectApiError(await apiGetRaw(request, '/api/me/export?unexpected=true', token), 400, 'common.validation');

      });

      await test.step('Assert: rejects malformed locale parameter', async () => {

        await expectApiError(await apiGetRaw(request, '/api/me/export?lang=de-DE-extra', token), 400, 'common.validation');

      });

      await test.step('Assert: rejects duplicate locale parameters', async () => {

        await expectApiError(await apiGetRaw(request, '/api/me/export?lang=en&lang=de', token), 400, 'common.validation');

      });

      await test.step('Assert: rejects empty locale parameter', async () => {

        await expectApiError(await apiGetRaw(request, '/api/me/export?lang=', token), 400, 'common.validation');

      });
    });
  });
});
