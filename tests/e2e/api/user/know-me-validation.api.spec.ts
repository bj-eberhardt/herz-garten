import { expect, test } from '@playwright/test';

import { apiGetRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../../helpers/api';

import {
  expectApiError,

  expectJson,
  type KnowMePayload
} from '../../helpers/apiAssertions';

import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / know me validation', () => {
  test('rejects invalid create payloads and no-couple access', async ({ request }) => {
    await test.step('Flow: rejects invalid create payloads and no-couple access', async () => {
      const noCouple = await registerByApi(request, testUser('api-knowme-no-couple', testRunId()));
      const runId = testRunId();
      const { partnerA } = await setupCoupleByApi(
        request,
        testUser('api-knowme-invalid-a', runId),
        testUser('api-knowme-invalid-b', runId),
      );

      await test.step('Verify API error response', async () => {
        await expectApiError(await apiGetRaw(request, '/api/know-me', noCouple.token), 409, 'couple.notConnected');
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(
            request,
            '/api/know-me',
            { questionText: 'No couple?', options: ['A', 'B'], correctOptionIndex: 0 },
            noCouple.token,
          ),
          409,
          'couple.notConnected',
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/know-me', { catalogQuestionId: 'not-a-uuid', options: ['A', 'B'], correctOptionIndex: 0 }, partnerA.token),
          400,
          'knowMe.invalidCatalogQuestionId',
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/know-me', { questionText: '', options: ['A'], correctOptionIndex: 0 }, partnerA.token),
          400,
          'knowMe.questionInvalid',
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/know-me', { questionText: 'Invalid index?', options: ['A', 'B'], correctOptionIndex: 2 }, partnerA.token),
          400,
          'knowMe.correctOptionInvalid',
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(
            request,
            '/api/know-me',
            {
              catalogQuestionId: '00000000-0000-0000-0000-000000000000',
              options: ['A', 'B'],
              correctOptionIndex: 0,
            },
            partnerA.token,
          ),
          400,
          'knowMe.catalogQuestionNotFound',
        );
      });
    });
  });

  test('rejects invalid guesses own guesses repeated guesses and missing options', async ({ request }) => {
    await test.step('Flow: rejects invalid guesses own guesses repeated guesses and missing options', async () => {
      const runId = testRunId();
      const { partnerA, partnerB } = await setupCoupleByApi(
        request,
        testUser('api-knowme-guess-a', runId),
        testUser('api-knowme-guess-b', runId),
      );

      const created = await expectJson<KnowMePayload>(
        await apiPostRaw(
          request,
          '/api/know-me',
          { questionText: 'Guess API edge?', options: ['Only zero', 'Only one'], correctOptionIndex: 0 },
          partnerA.token,
        ),
        201,
      );
      const round = created.rounds.find((item) => item.questionText === 'Guess API edge?');
      await test.step('Verify expected result', async () => {
        expect(round).toBeTruthy();
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, `/api/know-me/${round!.id}/guess`, { selectedOptionIndex: 0 }, partnerA.token),
          403,
          'knowMe.authorCannotGuessOwnQuestion',
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, `/api/know-me/${round!.id}/guess`, { selectedOptionIndex: -1 }, partnerB.token),
          400,
          'knowMe.selectedOptionInvalid',
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, `/api/know-me/${round!.id}/guess`, { selectedOptionIndex: 2 }, partnerB.token),
          400,
          'knowMe.optionDoesNotExist',
        );
      });

      await test.step('Verify JSON response payload', async () => {
        await expectJson<KnowMePayload>(
          await apiPostRaw(request, `/api/know-me/${round!.id}/guess`, { selectedOptionIndex: 0 }, partnerB.token),
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, `/api/know-me/${round!.id}/guess`, { selectedOptionIndex: 0 }, partnerB.token),
          409,
          'knowMe.questionAlreadyAnswered',
        );
      });
    });
  });
});
