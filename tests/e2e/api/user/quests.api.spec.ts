import { expect, test, type APIResponse } from '@playwright/test';

import { apiGetRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../../helpers/api';
import { expectApiError, expectJson, expectQuestsPayload, type QuestsPayload } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

const missingQuestId = '00000000-0000-0000-0000-000000000000';

async function expectRejected(response: APIResponse) {
  await expectApiError(response, 400, 'rejected');
}

test.describe('user api / quests', () => {
  test('rejects unauthenticated quest access', async ({ request }) => {
    await test.step('Reject: list quests without auth token', async () => {
      await expectApiError(await apiGetRaw(request, '/api/quests'), 401, 'auth.missingToken');
    });

    await test.step('Reject: accept quest without auth token', async () => {
      await expectApiError(await apiPostRaw(request, `/api/quests/${missingQuestId}/accept`, {}), 401, 'auth.missingToken');
    });

    await test.step('Reject: complete quest without auth token', async () => {
      await expectApiError(await apiPostRaw(request, `/api/quests/${missingQuestId}/complete`, {}), 401, 'auth.missingToken');
    });
  });

  test('rejects invalid quest tokens', async ({ request }) => {
    await test.step('Reject: list quests with invalid auth token', async () => {
      await expectApiError(await apiGetRaw(request, '/api/quests', 'invalid-token'), 401, 'auth.invalidToken');
    });

    await test.step('Reject: accept quest with invalid auth token', async () => {
      await expectApiError(await apiPostRaw(request, `/api/quests/${missingQuestId}/accept`, {}, 'invalid-token'), 401, 'auth.invalidToken');
    });

    await test.step('Reject: complete quest with invalid auth token', async () => {
      await expectApiError(await apiPostRaw(request, `/api/quests/${missingQuestId}/complete`, {}, 'invalid-token'), 401, 'auth.invalidToken');
    });
  });

  test('rejects invalid quest query parameters and mutation bodies', async ({ request }) => {
    const runId = testRunId();
    const { partnerA } = await setupCoupleByApi(
      request,
      testUser('api-quest-query-a', runId),
      testUser('api-quest-query-b', runId),
    );

    const invalidListQueries = [
      'unexpected=true',
      'lang=de-DE-extra',
      'lang=en&lang=de',
      'lang=',
      'effortLevel=invalid',
      'maxMinutes=soon',
      'maxMinutes=0',
      'mode=remote',
      'category=one&category=two',
    ];

    for (const query of invalidListQueries) {
      await test.step(`Reject: list quests with invalid query ${query}`, async () => {
        await expectRejected(await apiGetRaw(request, `/api/quests?${query}`, partnerA.token));
      });
    }

    const invalidMutationQueries = ['unexpected=true', 'lang=de-DE-extra', 'lang=en&lang=de', 'lang='];
    for (const query of invalidMutationQueries) {
      await test.step(`Reject: accept quest with invalid query ${query}`, async () => {
        await expectRejected(await apiPostRaw(request, `/api/quests/${missingQuestId}/accept?${query}`, {}, partnerA.token));
      });

      await test.step(`Reject: complete quest with invalid query ${query}`, async () => {
        await expectRejected(await apiPostRaw(request, `/api/quests/${missingQuestId}/complete?${query}`, {}, partnerA.token));
      });
    }

    await test.step('Reject: accept quest with non-empty body', async () => {
      await expectRejected(await apiPostRaw(request, `/api/quests/${missingQuestId}/accept`, { unexpected: true }, partnerA.token));
    });

    await test.step('Reject: complete quest with non-empty body', async () => {
      await expectRejected(await apiPostRaw(request, `/api/quests/${missingQuestId}/complete`, { unexpected: true }, partnerA.token));
    });

    await test.step('Reject: accept quest with malformed quest id', async () => {
      await expectRejected(await apiPostRaw(request, '/api/quests/not-a-uuid/accept', {}, partnerA.token));
    });

    await test.step('Reject: complete quest with malformed quest id', async () => {
      await expectRejected(await apiPostRaw(request, '/api/quests/not-a-uuid/complete', {}, partnerA.token));
    });
  });

  test('lists filters accepts and completes quests with partner confirmation', async ({ request }) => {
    const runId = testRunId();
    const { partnerA, partnerB } = await setupCoupleByApi(
      request,
      testUser('api-quest-a', runId),
      testUser('api-quest-b', runId),
    );

    await test.step('Assert: list endpoint applies filters and locale', async () => {

      const listed = await expectJson<QuestsPayload>(

      await apiGetRaw(request, '/api/quests?lang=de&category=long_distance&maxMinutes=15&mode=long_distance', partnerA.token),

      );

      expectQuestsPayload(listed);

      expect(listed.locale).toBe('de');

      expect(listed.filters).toEqual(expect.objectContaining({ category: 'long_distance', maxMinutes: 15, mode: 'long_distance' }));

      expect(listed.quests.length).toBeGreaterThan(0);

    });

    const quest = await test.step('Setup: choose a quest that can be accepted and completed', async () => {
      const allQuests = await expectJson<QuestsPayload>(await apiGetRaw(request, '/api/quests', partnerA.token));
      const selectedQuest = allQuests.quests.find((item) => item.requiresBothPartners) ?? allQuests.quests[0];
      expect(selectedQuest).toBeTruthy();
      return selectedQuest;
    });

    await test.step('Act: first partner accepts the quest', async () => {
      const accepted = await expectJson<QuestsPayload>(
        await apiPostRaw(request, `/api/quests/${quest.id}/accept`, {}, partnerA.token),
      );
      expectQuestsPayload(accepted);
      expect(accepted.quests.find((item) => item.id === quest.id)?.coupleQuest?.status).toBe('accepted');
    });

    await test.step('Act: first partner completes and waits for confirmation if required', async () => {
      const firstComplete = await expectJson<QuestsPayload>(
        await apiPostRaw(request, `/api/quests/${quest.id}/complete`, {}, partnerA.token),
      );
      expectQuestsPayload(firstComplete);
      const afterFirst = firstComplete.quests.find((item) => item.id === quest.id);
      expect(afterFirst?.coupleQuest?.completedByUserIds).toContain(partnerA.user.id);
    });

    await test.step('Act: second partner completes and finalizes the quest', async () => {
      const secondComplete = await expectJson<QuestsPayload>(
        await apiPostRaw(request, `/api/quests/${quest.id}/complete`, {}, partnerB.token),
      );
      expectQuestsPayload(secondComplete);
      const afterSecond = secondComplete.quests.find((item) => item.id === quest.id);
      expect(afterSecond?.coupleQuest?.status).toBe('completed');
      expect(afterSecond?.coupleQuest?.completedByUserIds).toEqual(
        expect.arrayContaining([partnerA.user.id, partnerB.user.id]),
      );
    });
  });

  test('rejects no-couple access and missing quests with domain errors', async ({ request }) => {
    const user = await registerByApi(request, testUser('api-quest-no-couple', testRunId()));
    const runId = testRunId();
    const { partnerA } = await setupCoupleByApi(
      request,
      testUser('api-quest-notfound-a', runId),
      testUser('api-quest-notfound-b', runId),
    );

    await test.step('Reject: list quests without couple keeps domain error', async () => {
      await expectApiError(await apiGetRaw(request, '/api/quests', user.token), 409, 'couple.notConnected');
    });

    await test.step('Reject: accept missing quest keeps not-found domain error', async () => {
      await expectApiError(
        await apiPostRaw(request, `/api/quests/${missingQuestId}/accept`, {}, partnerA.token),
        404,
        'quest.notFound',
      );
    });

    await test.step('Reject: complete missing quest keeps not-found domain error', async () => {
      await expectApiError(
        await apiPostRaw(request, `/api/quests/${missingQuestId}/complete`, {}, partnerA.token),
        404,
        'quest.notFound',
      );
    });
  });
});