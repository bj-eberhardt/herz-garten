import { expect, test } from '@playwright/test';

import { apiGetRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../../helpers/api';

import {
  expectApiError,

  expectJson,

  expectQuestsPayload,
  type QuestsPayload
} from '../../helpers/apiAssertions';

import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / quests', () => {
  test('lists filters accepts and completes quests with partner confirmation', async ({ request }) => {
    await test.step('Flow: lists filters accepts and completes quests with partner confirmation', async () => {
      const runId = testRunId();
      const { partnerA, partnerB } = await setupCoupleByApi(
        request,
        testUser('api-quest-a', runId),
        testUser('api-quest-b', runId),
      );

      const listed = await expectJson<QuestsPayload>(
        await apiGetRaw(request, '/api/quests?lang=de&category=long_distance&maxMinutes=15&mode=long_distance', partnerA.token),
      );
      expectQuestsPayload(listed);
      await test.step('Verify expected result', async () => {
        expect(listed.locale).toBe('de');
      });
      await test.step('Verify expected result', async () => {
        expect(listed.filters).toEqual(expect.objectContaining({ category: 'long_distance', maxMinutes: 15, mode: 'long_distance' }));
      });
      await test.step('Verify expected result', async () => {
        expect(listed.quests.length).toBeGreaterThan(0);
      });

      const allQuests = await expectJson<QuestsPayload>(await apiGetRaw(request, '/api/quests', partnerA.token));
      const quest = allQuests.quests.find((item) => item.requiresBothPartners) ?? allQuests.quests[0];
      await test.step('Verify expected result', async () => {
        expect(quest).toBeTruthy();
      });

      const accepted = await expectJson<QuestsPayload>(
        await apiPostRaw(request, `/api/quests/${quest.id}/accept`, {}, partnerA.token),
      );
      expectQuestsPayload(accepted);
      await test.step('Verify expected result', async () => {
        expect(accepted.quests.find((item) => item.id === quest.id)?.coupleQuest?.status).toBe('accepted');
      });

      const firstComplete = await expectJson<QuestsPayload>(
        await apiPostRaw(request, `/api/quests/${quest.id}/complete`, {}, partnerA.token),
      );
      expectQuestsPayload(firstComplete);
      const afterFirst = firstComplete.quests.find((item) => item.id === quest.id);
      await test.step('Verify expected result', async () => {
        expect(afterFirst?.coupleQuest?.completedByUserIds).toContain(partnerA.user.id);
      });

      const secondComplete = await expectJson<QuestsPayload>(
        await apiPostRaw(request, `/api/quests/${quest.id}/complete`, {}, partnerB.token),
      );
      expectQuestsPayload(secondComplete);
      const afterSecond = secondComplete.quests.find((item) => item.id === quest.id);
      await test.step('Verify expected result', async () => {
        expect(afterSecond?.coupleQuest?.status).toBe('completed');
      });
      await test.step('Verify expected result', async () => {
        expect(afterSecond?.coupleQuest?.completedByUserIds).toEqual(
          expect.arrayContaining([partnerA.user.id, partnerB.user.id]),
        );
      });
    });
  });

  test('rejects no-couple access and missing quests', async ({ request }) => {
    await test.step('Flow: rejects no-couple access and missing quests', async () => {
      const user = await registerByApi(request, testUser('api-quest-no-couple', testRunId()));
      const runId = testRunId();
      const { partnerA } = await setupCoupleByApi(
        request,
        testUser('api-quest-notfound-a', runId),
        testUser('api-quest-notfound-b', runId),
      );
      const missingQuestId = '00000000-0000-0000-0000-000000000000';

      await test.step('Verify API error response', async () => {
        await expectApiError(await apiGetRaw(request, '/api/quests', user.token), 409, 'couple.notConnected');
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiGetRaw(request, '/api/quests?effortLevel=invalid&maxMinutes=soon', partnerA.token),
          400,
          'common.validation',
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, `/api/quests/${missingQuestId}/accept`, {}, partnerA.token),
          404,
          'quest.notFound',
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, `/api/quests/${missingQuestId}/complete`, {}, partnerA.token),
          404,
          'quest.notFound',
        );
      });
    });
  });
});
