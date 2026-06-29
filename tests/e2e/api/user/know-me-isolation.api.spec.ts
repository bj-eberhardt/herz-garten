import { test } from '@playwright/test';

import { apiPostRaw, setupCoupleByApi } from '../../helpers/api';
import { expectApiError, expectJson, type KnowMePayload } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / know me isolation', () => {
  test('hides foreign questions as not found', async ({ request }) => {
    const runId = testRunId();
    const { coupleA, coupleB } = await test.step('Setup: two independent couples', async () => {
      const firstCouple = await setupCoupleByApi(
        request,
        testUser('api-knowme-foreign-a1', runId),
        testUser('api-knowme-foreign-a2', runId),
      );
      const secondCouple = await setupCoupleByApi(
        request,
        testUser('api-knowme-foreign-b1', runId),
        testUser('api-knowme-foreign-b2', runId),
      );
      return { coupleA: firstCouple, coupleB: secondCouple };
    });

    const created = await test.step('Flow: couple A creates a private round', async () => {
      return expectJson<KnowMePayload>(
        await apiPostRaw(
          request,
          '/api/know-me',
          { questionText: 'Foreign question?', options: ['A', 'B'], correctOptionIndex: 0 },
          coupleA.partnerA.token,
        ),
        201,
      );
    });

    await test.step('Reject: couple B cannot guess couple A question', async () => {
      await expectApiError(
        await apiPostRaw(request, `/api/know-me/${created.rounds[0].id}/guess`, { selectedOptionIndex: 0 }, coupleB.partnerA.token),
        404,
        'knowMe.questionNotFound',
      );
    });
  });
});
