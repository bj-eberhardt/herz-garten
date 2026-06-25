import { test } from '@playwright/test';

import { apiPostRaw, setupCoupleByApi } from '../../helpers/api';

import {
  expectApiError,

  expectJson,
  type KnowMePayload
} from '../../helpers/apiAssertions';

import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / know me isolation', () => {
  test('hides foreign questions as not found', async ({ request }) => {
    await test.step('Flow: hides foreign questions as not found', async () => {
      const runId = testRunId();
      const coupleA = await setupCoupleByApi(
        request,
        testUser('api-knowme-foreign-a1', runId),
        testUser('api-knowme-foreign-a2', runId),
      );
      const coupleB = await setupCoupleByApi(
        request,
        testUser('api-knowme-foreign-b1', runId),
        testUser('api-knowme-foreign-b2', runId),
      );
      const created = await expectJson<KnowMePayload>(
        await apiPostRaw(
          request,
          '/api/know-me',
          { questionText: 'Foreign question?', options: ['A', 'B'], correctOptionIndex: 0 },
          coupleA.partnerA.token,
        ),
        201,
      );

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, `/api/know-me/${created.rounds[0].id}/guess`, { selectedOptionIndex: 0 }, coupleB.partnerA.token),
          404,
          'knowMe.questionNotFound',
        );
      });
    });
  });
});
