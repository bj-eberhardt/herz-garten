import { expect, test } from '@playwright/test';

import { apiGetRaw, apiPostRaw, setupCoupleByApi } from '../../helpers/api';
import { expectApiError, expectJson, type KnowMePayload } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / know me catalog', () => {
  test('creates catalog question once per author and rejects duplicate use', async ({ request }) => {
    const runId = testRunId();
    const { partnerA } = await test.step('Setup: connected couple', async () => {
      return setupCoupleByApi(
        request,
        testUser('api-knowme-catalog-a', runId),
        testUser('api-knowme-catalog-b', runId),
      );
    });

    const catalogQuestion = await test.step('Flow: choose first available catalog question', async () => {
      const listed = await expectJson<KnowMePayload>(await apiGetRaw(request, '/api/know-me', partnerA.token));
      expect(listed.catalogQuestions.length).toBeGreaterThan(0);
      return listed.catalogQuestions[0];
    });

    await test.step('Flow: create round from catalog question', async () => {
      const created = await expectJson<KnowMePayload>(
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
      expect(created.rounds.some((round) => round.catalogQuestionId === catalogQuestion.id)).toBeTruthy();
    });

    await test.step('Reject: author cannot reuse the same catalog question', async () => {
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
