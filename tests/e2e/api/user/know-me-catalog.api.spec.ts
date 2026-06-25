import { expect, test } from '@playwright/test';

import { apiGetRaw, apiPostRaw, setupCoupleByApi } from '../../helpers/api';

import {
  expectApiError,

  expectJson,
  type KnowMePayload
} from '../../helpers/apiAssertions';

import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / know me catalog', () => {
  test('creates catalog question once per author and rejects duplicate use', async ({ request }) => {
    await test.step('Flow: creates catalog question once per author and rejects duplicate use', async () => {
      const runId = testRunId();
      const { partnerA } = await setupCoupleByApi(
        request,
        testUser('api-knowme-catalog-a', runId),
        testUser('api-knowme-catalog-b', runId),
      );
      const listed = await expectJson<KnowMePayload>(await apiGetRaw(request, '/api/know-me', partnerA.token));
      const catalogQuestion = listed.catalogQuestions[0];
      await test.step('Verify expected result', async () => {
        expect(catalogQuestion).toBeTruthy();
      });

      await test.step('Verify JSON response payload', async () => {
        await expectJson<KnowMePayload>(
          await apiPostRaw(
            request,
            '/api/know-me',
            {
              catalogQuestionId: catalogQuestion.id,
              options: ['A', 'B'],
              correctOptionIndex: 0,
            },
            partnerA.token,
          ),
          201,
        );
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(
            request,
            '/api/know-me',
            {
              catalogQuestionId: catalogQuestion.id,
              options: ['A', 'B'],
              correctOptionIndex: 0,
            },
            partnerA.token,
          ),
          409,
          'knowMe.catalogQuestionAlreadyUsed',
        );
      });
    });
  });
});
