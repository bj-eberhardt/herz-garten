import { expect, test } from '@playwright/test';
import { apiGetRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../helpers/api';
import {
  expectApiError,
  expectJson,
  expectKnowMePayload,
  type KnowMePayload,
} from '../helpers/apiAssertions';
import { testRunId, testUser } from '../helpers/testUsers';

test.describe('know me api', () => {
  test('lists catalog creates free question and accepts partner guess', async ({ request }) => {
    const runId = testRunId();
    const { partnerA, partnerB } = await setupCoupleByApi(
      request,
      testUser('api-knowme-a', runId),
      testUser('api-knowme-b', runId),
    );

    const listed = await expectJson<KnowMePayload>(await apiGetRaw(request, '/api/know-me?lang=en', partnerA.token));
    expectKnowMePayload(listed);
    expect(listed.locale).toBe('en');
    expect(listed.catalogQuestions.length).toBeGreaterThan(0);

    const created = await expectJson<KnowMePayload>(
      await apiPostRaw(
        request,
        '/api/know-me',
        {
          questionText: 'Which API option is correct?',
          options: ['First', 'Second', 'Third'],
          correctOptionIndex: 1,
        },
        partnerA.token,
      ),
      201,
    );
    expectKnowMePayload(created);
    const round = created.rounds.find((item) => item.questionText === 'Which API option is correct?');
    expect(round).toBeTruthy();
    expect(round?.status).toBe('open');

    const guessed = await expectJson<KnowMePayload>(
      await apiPostRaw(request, `/api/know-me/${round!.id}/guess`, { selectedOptionIndex: 1 }, partnerB.token),
    );
    expectKnowMePayload(guessed);
    const answered = guessed.rounds.find((item) => item.id === round!.id);
    expect(answered?.status).toBe('answered');
    expect(answered?.guess).toEqual(expect.objectContaining({ selectedOptionIndex: 1, isCorrect: true }));
  });

  test('creates catalog question once per author and rejects duplicate use', async ({ request }) => {
    const runId = testRunId();
    const { partnerA } = await setupCoupleByApi(
      request,
      testUser('api-knowme-catalog-a', runId),
      testUser('api-knowme-catalog-b', runId),
    );
    const listed = await expectJson<KnowMePayload>(await apiGetRaw(request, '/api/know-me', partnerA.token));
    const catalogQuestion = listed.catalogQuestions[0];
    expect(catalogQuestion).toBeTruthy();

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

  test('rejects invalid create payloads and no-couple access', async ({ request }) => {
    const noCouple = await registerByApi(request, testUser('api-knowme-no-couple', testRunId()));
    const runId = testRunId();
    const { partnerA } = await setupCoupleByApi(
      request,
      testUser('api-knowme-invalid-a', runId),
      testUser('api-knowme-invalid-b', runId),
    );

    await expectApiError(await apiGetRaw(request, '/api/know-me', noCouple.token), 409, 'couple.notConnected');
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
    await expectApiError(
      await apiPostRaw(request, '/api/know-me', { catalogQuestionId: 'not-a-uuid', options: ['A', 'B'], correctOptionIndex: 0 }, partnerA.token),
      400,
      'knowMe.invalidCatalogQuestionId',
    );
    await expectApiError(
      await apiPostRaw(request, '/api/know-me', { questionText: '', options: ['A'], correctOptionIndex: 0 }, partnerA.token),
      400,
      'knowMe.questionInvalid',
    );
    await expectApiError(
      await apiPostRaw(request, '/api/know-me', { questionText: 'Invalid index?', options: ['A', 'B'], correctOptionIndex: 2 }, partnerA.token),
      400,
      'knowMe.correctOptionInvalid',
    );
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

  test('rejects invalid guesses own guesses repeated guesses and missing options', async ({ request }) => {
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
    expect(round).toBeTruthy();

    await expectApiError(
      await apiPostRaw(request, `/api/know-me/${round!.id}/guess`, { selectedOptionIndex: 0 }, partnerA.token),
      403,
      'knowMe.authorCannotGuessOwnQuestion',
    );
    await expectApiError(
      await apiPostRaw(request, `/api/know-me/${round!.id}/guess`, { selectedOptionIndex: -1 }, partnerB.token),
      400,
      'knowMe.selectedOptionInvalid',
    );
    await expectApiError(
      await apiPostRaw(request, `/api/know-me/${round!.id}/guess`, { selectedOptionIndex: 2 }, partnerB.token),
      400,
      'knowMe.optionDoesNotExist',
    );

    await expectJson<KnowMePayload>(
      await apiPostRaw(request, `/api/know-me/${round!.id}/guess`, { selectedOptionIndex: 0 }, partnerB.token),
    );
    await expectApiError(
      await apiPostRaw(request, `/api/know-me/${round!.id}/guess`, { selectedOptionIndex: 0 }, partnerB.token),
      409,
      'knowMe.questionAlreadyAnswered',
    );
  });

  test('hides foreign questions as not found', async ({ request }) => {
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

    await expectApiError(
      await apiPostRaw(request, `/api/know-me/${created.rounds[0].id}/guess`, { selectedOptionIndex: 0 }, coupleB.partnerA.token),
      404,
      'knowMe.questionNotFound',
    );
  });
});
