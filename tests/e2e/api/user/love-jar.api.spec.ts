import { expect, test } from '@playwright/test';

import { apiGetRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../../helpers/api';

import {
  expectApiError,
  expectJson,

  expectLoveJarPayload,
  type LoveJarPayload
} from '../../helpers/apiAssertions';

import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / love jar', () => {
  test('creates draws and blocks duplicate daily draw', async ({ request }) => {
    await test.step('Flow: creates draws and blocks duplicate daily draw', async () => {
      const runId = testRunId();
      const { partnerA, partnerB } = await setupCoupleByApi(
        request,
        testUser('api-love-a', runId),
        testUser('api-love-b', runId),
      );

      const empty = await expectJson<LoveJarPayload>(await apiGetRaw(request, '/api/love-jar', partnerB.token));
      expectLoveJarPayload(empty);
      await test.step('Verify expected result', async () => {
        expect(empty.notes).toHaveLength(0);
      });

      const templatesDe = await expectJson<{
        categories: Array<{ value: string; label: string; }>;
        templates: Array<{ category: string; categoryLabel: string; }>;
      }>(
        await apiGetRaw(request, '/api/love-jar/templates', partnerB.token),
      );
      await test.step('Verify expected result', async () => {
        expect(templatesDe.categories.find((category) => category.value === 'compliment')?.label).toBe('Kompliment');
      });
      await test.step('Verify expected result', async () => {
        expect(templatesDe.templates.find((template) => template.category === 'compliment')?.categoryLabel).toBe('Kompliment');
      });
      const templatesEn = await expectJson<{
        categories: Array<{ value: string; label: string; }>;
        templates: Array<{ category: string; categoryLabel: string; }>;
      }>(
        await apiGetRaw(request, '/api/love-jar/templates', partnerB.token, { 'Accept-Language': 'en' }),
      );
      await test.step('Verify expected result', async () => {
        expect(templatesEn.categories.find((category) => category.value === 'compliment')?.label).toBe('Compliment');
      });
      await test.step('Verify expected result', async () => {
        expect(templatesEn.templates.find((template) => template.category === 'compliment')?.categoryLabel).toBe('Compliment');
      });

      const created = await expectJson<LoveJarPayload>(
        await apiPostRaw(request, '/api/love-jar', { text: 'API note', category: 'compliment' }, partnerA.token),
        201,
      );
      expectLoveJarPayload(created);
      await test.step('Verify expected result', async () => {
        expect(created.notes.some((note) => note.text === null && note.category === 'compliment')).toBeTruthy();
      });
      await test.step('Verify expected result', async () => {
        expect(created.notes.find((note) => note.category === 'compliment')?.categoryLabel).toBe('Kompliment');
      });

      const drawn = await expectJson<LoveJarPayload>(await apiPostRaw(request, '/api/love-jar/draw', {}, partnerB.token));
      expectLoveJarPayload(drawn);
      await test.step('Verify expected result', async () => {
        expect(drawn.drawStatus.drawnToday).toBeTruthy();
      });
      await test.step('Verify expected result', async () => {
        expect(drawn.notes.some((note) => note.text === 'API note' && note.isDrawn)).toBeTruthy();
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(await apiPostRaw(request, '/api/love-jar/draw', {}, partnerB.token), 409, 'loveJar.alreadyDrawnToday');
      });
    });
  });

  test('draw does not open own note when no partner note exists', async ({ request }) => {
    await test.step('Flow: draw does not open own note when no partner note exists', async () => {
      const runId = testRunId();
      const { partnerA } = await setupCoupleByApi(
        request,
        testUser('api-love-own-a', runId),
        testUser('api-love-own-b', runId),
      );

      const created = await expectJson<LoveJarPayload>(
        await apiPostRaw(request, '/api/love-jar', { text: 'Own fallback note', category: 'compliment' }, partnerA.token),
        201,
      );
      await test.step('Verify expected result', async () => {
        expect(created.drawStatus.ownUnreadCount).toBeGreaterThanOrEqual(1);
      });
      await test.step('Verify expected result', async () => {
        expect(created.drawStatus.partnerUnreadCount).toBe(0);
      });
      await test.step('Verify expected result', async () => {
        expect(created.drawStatus.canDrawToday).toBe(false);
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(await apiPostRaw(request, '/api/love-jar/draw', {}, partnerA.token), 404, 'loveJar.noUnreadNote');
      });

      const afterDrawAttempt = await expectJson<LoveJarPayload>(await apiGetRaw(request, '/api/love-jar', partnerA.token));
      await test.step('Verify expected result', async () => {
        expect(afterDrawAttempt.drawStatus.drawnToday).toBe(false);
      });
      await test.step('Verify expected result', async () => {
        expect(afterDrawAttempt.notes).toEqual(
          expect.arrayContaining([expect.objectContaining({ authorId: partnerA.user.id, text: null, isDrawn: false })]),
        );
      });
    });
  });

  test('rejects invalid love jar states', async ({ request }) => {
    await test.step('Flow: rejects invalid love jar states', async () => {
      const noCouple = await registerByApi(request, testUser('api-love-no-couple', testRunId()));
      const runId = testRunId();
      const { partnerA } = await setupCoupleByApi(
        request,
        testUser('api-love-invalid-a', runId),
        testUser('api-love-invalid-b', runId),
      );

      await test.step('Verify API error response', async () => {
        await expectApiError(await apiGetRaw(request, '/api/love-jar', noCouple.token), 409, 'couple.notConnected');
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/love-jar', { text: 'No couple' }, noCouple.token),
          409,
          'couple.notConnected',
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(await apiPostRaw(request, '/api/love-jar', {}, partnerA.token), 400, 'loveJar.noteRequired');
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(await apiPostRaw(request, '/api/love-jar', { text: '' }, partnerA.token), 400, 'loveJar.noteRequired');
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/love-jar', { text: 'Bad category', category: 'bad' }, partnerA.token),
          400,
          'loveJar.invalidCategory',
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(await apiPostRaw(request, '/api/love-jar/draw', {}, partnerA.token), 404, 'loveJar.noUnreadNote');
      });
    });
  });
});
