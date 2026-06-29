import { expect, test, type APIResponse } from '@playwright/test';

import { apiGetRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../../helpers/api';
import { expectApiError, expectJson, expectLoveJarPayload, type LoveJarPayload } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

async function expectRejected(response: APIResponse) {
  await expectApiError(response, 400, 'rejected');
}

test.describe('user api / love jar', () => {
  test('rejects unauthenticated love jar access', async ({ request }) => {
    await test.step('Reject: list love jar without auth token', async () => {
      await expectApiError(await apiGetRaw(request, '/api/love-jar'), 401, 'auth.missingToken');
    });

    await test.step('Reject: list templates without auth token', async () => {
      await expectApiError(await apiGetRaw(request, '/api/love-jar/templates'), 401, 'auth.missingToken');
    });

    await test.step('Reject: create note without auth token', async () => {
      await expectApiError(await apiPostRaw(request, '/api/love-jar', { text: 'No token note', category: 'compliment' }), 401, 'auth.missingToken');
    });

    await test.step('Reject: draw note without auth token', async () => {
      await expectApiError(await apiPostRaw(request, '/api/love-jar/draw', {}), 401, 'auth.missingToken');
    });
  });

  test('rejects invalid love jar tokens', async ({ request }) => {
    await test.step('Reject: list love jar with invalid auth token', async () => {
      await expectApiError(await apiGetRaw(request, '/api/love-jar', 'invalid-token'), 401, 'auth.invalidToken');
    });

    await test.step('Reject: list templates with invalid auth token', async () => {
      await expectApiError(await apiGetRaw(request, '/api/love-jar/templates', 'invalid-token'), 401, 'auth.invalidToken');
    });

    await test.step('Reject: create note with invalid auth token', async () => {
      await expectApiError(
        await apiPostRaw(request, '/api/love-jar', { text: 'Invalid token note', category: 'compliment' }, 'invalid-token'),
        401,
        'auth.invalidToken',
      );
    });

    await test.step('Reject: draw note with invalid auth token', async () => {
      await expectApiError(await apiPostRaw(request, '/api/love-jar/draw', {}, 'invalid-token'), 401, 'auth.invalidToken');
    });
  });

  test('rejects invalid locale query parameters on love jar routes', async ({ request }) => {
    const runId = testRunId();
    const { partnerA } = await setupCoupleByApi(
      request,
      testUser('api-love-query-a', runId),
      testUser('api-love-query-b', runId),
    );
    const invalidQueries = ['unexpected=true', 'lang=de-DE-extra', 'lang=en&lang=de', 'lang='];

    for (const query of invalidQueries) {
      await test.step(`Reject: list love jar with invalid query ${query}`, async () => {
        await expectRejected(await apiGetRaw(request, `/api/love-jar?${query}`, partnerA.token));
      });

      await test.step(`Reject: list templates with invalid query ${query}`, async () => {
        await expectRejected(await apiGetRaw(request, `/api/love-jar/templates?${query}`, partnerA.token));
      });

      await test.step(`Reject: create love jar note with invalid query ${query}`, async () => {
        await expectRejected(
          await apiPostRaw(request, `/api/love-jar?${query}`, { text: 'Invalid query note', category: 'compliment' }, partnerA.token),
        );
      });

      await test.step(`Reject: draw love jar note with invalid query ${query}`, async () => {
        await expectRejected(await apiPostRaw(request, `/api/love-jar/draw?${query}`, {}, partnerA.token));
      });
    }
  });

  test('creates draws and blocks duplicate daily draw', async ({ request }) => {
    const runId = testRunId();
    const { partnerA, partnerB } = await setupCoupleByApi(
      request,
      testUser('api-love-a', runId),
      testUser('api-love-b', runId),
    );

    await test.step('Assert: partner starts with an empty love jar', async () => {

      const empty = await expectJson<LoveJarPayload>(await apiGetRaw(request, '/api/love-jar', partnerB.token));

      expectLoveJarPayload(empty);

      expect(empty.notes).toHaveLength(0);

    });

    await test.step('Assert: templates are localized from default and English locale', async () => {

      const templatesDe = await expectJson<{

      categories: Array<{ value: string; label: string; }>;

      templates: Array<{ category: string; categoryLabel: string; }>;

      }>(await apiGetRaw(request, '/api/love-jar/templates', partnerB.token));

      expect(templatesDe.categories.find((category) => category.value === 'compliment')?.label).toBe('Kompliment');

      expect(templatesDe.templates.find((template) => template.category === 'compliment')?.categoryLabel).toBe('Kompliment');


      const templatesEn = await expectJson<{

      categories: Array<{ value: string; label: string; }>;

      templates: Array<{ category: string; categoryLabel: string; }>;

      }>(await apiGetRaw(request, '/api/love-jar/templates', partnerB.token, { 'Accept-Language': 'en' }));

      expect(templatesEn.categories.find((category) => category.value === 'compliment')?.label).toBe('Compliment');

      expect(templatesEn.templates.find((template) => template.category === 'compliment')?.categoryLabel).toBe('Compliment');

    });

    await test.step('Act: partner creates a hidden love jar note', async () => {
      const created = await expectJson<LoveJarPayload>(
        await apiPostRaw(request, '/api/love-jar', { text: 'API note', category: 'compliment' }, partnerA.token),
        201,
      );
      expectLoveJarPayload(created);
      expect(created.notes.some((note) => note.text === null && note.category === 'compliment')).toBeTruthy();
      expect(created.notes.find((note) => note.category === 'compliment')?.categoryLabel).toBe('Kompliment');
    });

    await test.step('Act: other partner draws the note once today', async () => {
      const drawn = await expectJson<LoveJarPayload>(await apiPostRaw(request, '/api/love-jar/draw', {}, partnerB.token));
      expectLoveJarPayload(drawn);
      expect(drawn.drawStatus.drawnToday).toBeTruthy();
      expect(drawn.notes.some((note) => note.text === 'API note' && note.isDrawn)).toBeTruthy();
    });

    await test.step('Reject: second draw on the same day keeps domain error', async () => {
      await expectApiError(await apiPostRaw(request, '/api/love-jar/draw', {}, partnerB.token), 409, 'loveJar.alreadyDrawnToday');
    });
  });

  test('draw does not open own note when no partner note exists', async ({ request }) => {
    const runId = testRunId();
    const { partnerA } = await setupCoupleByApi(
      request,
      testUser('api-love-own-a', runId),
      testUser('api-love-own-b', runId),
    );

    await test.step('Setup: create unread own note only', async () => {
      const created = await expectJson<LoveJarPayload>(
        await apiPostRaw(request, '/api/love-jar', { text: 'Own fallback note', category: 'compliment' }, partnerA.token),
        201,
      );
      expect(created.drawStatus.ownUnreadCount).toBeGreaterThanOrEqual(1);
      expect(created.drawStatus.partnerUnreadCount).toBe(0);
      expect(created.drawStatus.canDrawToday).toBe(false);
    });

    await test.step('Reject: drawing without partner note keeps no-unread domain error', async () => {
      await expectApiError(await apiPostRaw(request, '/api/love-jar/draw', {}, partnerA.token), 404, 'loveJar.noUnreadNote');
    });

    await test.step('Assert: own note stays hidden and undrawn after failed draw', async () => {

      const afterDrawAttempt = await expectJson<LoveJarPayload>(await apiGetRaw(request, '/api/love-jar', partnerA.token));

      expect(afterDrawAttempt.drawStatus.drawnToday).toBe(false);

      expect(afterDrawAttempt.notes).toEqual(

      expect.arrayContaining([expect.objectContaining({ authorId: partnerA.user.id, text: null, isDrawn: false })]),

      );

    });
  });

  test('rejects no-couple love jar access while keeping domain error keys', async ({ request }) => {
    const noCouple = await registerByApi(request, testUser('api-love-no-couple', testRunId()));

    await test.step('Reject: list love jar without couple', async () => {
      await expectApiError(await apiGetRaw(request, '/api/love-jar', noCouple.token), 409, 'couple.notConnected');
    });

    await test.step('Reject: create love jar note without couple', async () => {
      await expectApiError(
        await apiPostRaw(request, '/api/love-jar', { text: 'No couple note', category: 'compliment' }, noCouple.token),
        409,
        'couple.notConnected',
      );
    });
  });

  test('rejects invalid love jar payload shapes and values', async ({ request }) => {
    const runId = testRunId();
    const { partnerA } = await setupCoupleByApi(
      request,
      testUser('api-love-invalid-a', runId),
      testUser('api-love-invalid-b', runId),
    );

    const invalidPayloads: Array<{ name: string; body: unknown }> = [
      { name: 'unknown field', body: { text: 'Extra field', category: 'compliment', extra: true } },
      { name: 'numeric text', body: { text: 123, category: 'compliment' } },
      { name: 'numeric category', body: { text: 'Numeric category', category: 123 } },
      { name: 'missing text', body: {} },
      { name: 'blank text', body: { text: '   ', category: 'compliment' } },
      { name: 'invalid category', body: { text: 'Bad category', category: 'bad' } },
    ];

    for (const { name, body } of invalidPayloads) {
      await test.step(`Reject: love jar payload ${name}`, async () => {
        await expectRejected(await apiPostRaw(request, '/api/love-jar', body, partnerA.token));
      });
    }

    await test.step('Reject: draw request with non-empty body', async () => {
      await expectRejected(await apiPostRaw(request, '/api/love-jar/draw', { unexpected: true }, partnerA.token));
    });

    await test.step('Reject: draw without unread partner note keeps domain error', async () => {
      await expectApiError(await apiPostRaw(request, '/api/love-jar/draw', {}, partnerA.token), 404, 'loveJar.noUnreadNote');
    });
  });
});