import { expect, test } from '@playwright/test';
import { apiGet, apiGetRaw, apiPost, apiPostRaw, setupCoupleByApi } from '../../helpers/api';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('api contracts / data isolation', () => {
  test('api data isolation blocks foreign garden objects know-me rounds and exports', async ({ request }) => {
    await test.step('Flow: api data isolation blocks foreign garden objects know-me rounds and exports', async () => {
      const runId = testRunId();
      const userA1 = testUser('isolation-a1', runId);
      const userA2 = testUser('isolation-a2', runId);
      const userB1 = testUser('isolation-b1', runId);
      const userB2 = testUser('isolation-b2', runId);
      const coupleA = await setupCoupleByApi(request, userA1, userA2);
      const coupleB = await setupCoupleByApi(request, userB1, userB2);

      await apiPost(request, '/api/memories', {
        title: 'Isolation Secret',
        description: 'Darf nur Paar A sehen.',
        date: '2026-06-09',
        category: 'everyday',
      }, coupleA.partnerA.token);
      const gardenA = await apiGet<{ objects: Array<{ id: string; }>; }>(request, '/api/garden', coupleA.partnerA.token);
      const foreignGardenObjectId = gardenA.objects[0].id;
      const foreignGardenResponse = await apiGetRaw(
        request,
        `/api/garden/objects/${foreignGardenObjectId}`,
        coupleB.partnerA.token,
      );
      await test.step('Verify expected result', async () => {
        expect(foreignGardenResponse.status()).toBe(404);
      });
      await test.step('Verify expected result', async () => {
        expect(await foreignGardenResponse.json()).toEqual(expect.objectContaining({ errorKey: 'garden.objectNotFound' }));
      });

      const knowMeA = await apiPost<{ rounds: Array<{ id: string; questionText: string; }>; }>(
        request,
        '/api/know-me',
        {
          questionText: 'Was darf Paar B nicht raten?',
          options: ['Antwort A', 'Antwort B'],
          correctOptionIndex: 0,
        },
        coupleA.partnerA.token,
      );
      const foreignGuessResponse = await apiPostRaw(
        request,
        `/api/know-me/${knowMeA.rounds[0].id}/guess`,
        { selectedOptionIndex: 0 },
        coupleB.partnerA.token,
      );
      await test.step('Verify expected result', async () => {
        expect(foreignGuessResponse.status()).toBe(404);
      });
      await test.step('Verify expected result', async () => {
        expect(await foreignGuessResponse.json()).toEqual(expect.objectContaining({ errorKey: 'knowMe.questionNotFound' }));
      });

      const exportB = await apiGet<Record<string, unknown>>(request, '/api/me/export?lang=en', coupleB.partnerA.token);
      await test.step('Verify expected result', async () => {
        expect(JSON.stringify(exportB)).not.toContain('Isolation Secret');
      });
    });
  });
});
