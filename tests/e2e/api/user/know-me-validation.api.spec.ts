import { expect, test, type APIResponse } from '@playwright/test';

import { apiGetRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../../helpers/api';
import { expectApiError, expectJson, type KnowMePayload } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

const missingQuestionId = '00000000-0000-0000-0000-000000000001';
const missingCatalogId = '00000000-0000-0000-0000-000000000000';

async function expectRejected(response: APIResponse) {
  await expectApiError(response, 400, 'rejected');
}

test.describe('user api / know me validation', () => {
  test('rejects unauthenticated access', async ({ request }) => {
    await test.step('Reject: list without auth token', async () => {
      await expectApiError(await apiGetRaw(request, '/api/know-me'), 401, 'auth.missingToken');
    });

    await test.step('Reject: create without auth token', async () => {
      await expectApiError(
        await apiPostRaw(request, '/api/know-me', { questionText: 'No token?', options: ['A', 'B'], correctOptionIndex: 0 }),
        401,
        'auth.missingToken',
      );
    });

    await test.step('Reject: guess without auth token', async () => {
      await expectApiError(
        await apiPostRaw(request, `/api/know-me/${missingQuestionId}/guess`, { selectedOptionIndex: 0 }),
        401,
        'auth.missingToken',
      );
    });
  });

  test('rejects invalid locale query parameters on all know-me routes', async ({ request }) => {
    const runId = testRunId();
    const { partnerA } = await setupCoupleByApi(
      request,
      testUser('api-knowme-query-a', runId),
      testUser('api-knowme-query-b', runId),
    );

    const invalidQueries = ['unexpected=true', 'lang=de-DE-extra', 'lang=en&lang=de', 'lang='];

    for (const query of invalidQueries) {
      await test.step(`Reject: list with invalid query ${query}`, async () => {
        await expectRejected(await apiGetRaw(request, `/api/know-me?${query}`, partnerA.token));
      });

      await test.step(`Reject: create with invalid query ${query}`, async () => {
        await expectRejected(
          await apiPostRaw(
            request,
            `/api/know-me?${query}`,
            { questionText: 'Invalid query?', options: ['A', 'B'], correctOptionIndex: 0 },
            partnerA.token,
          ),
        );
      });

      await test.step(`Reject: guess with invalid query ${query}`, async () => {
        await expectRejected(
          await apiPostRaw(request, `/api/know-me/${missingQuestionId}/guess?${query}`, { selectedOptionIndex: 0 }, partnerA.token),
        );
      });
    }
  });

  test('rejects no-couple access while keeping domain error keys', async ({ request }) => {
    const noCouple = await registerByApi(request, testUser('api-knowme-no-couple', testRunId()));

    await test.step('Reject: list without couple', async () => {
      await expectApiError(await apiGetRaw(request, '/api/know-me', noCouple.token), 409, 'couple.notConnected');
    });

    await test.step('Reject: create without couple', async () => {
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
  });

  test('rejects invalid create payload shapes', async ({ request }) => {
    const runId = testRunId();
    const { partnerA } = await setupCoupleByApi(
      request,
      testUser('api-knowme-shape-a', runId),
      testUser('api-knowme-shape-b', runId),
    );

    const validPayload = { questionText: 'Valid base?', options: ['A', 'B'], correctOptionIndex: 0 };
    const invalidPayloads: Array<{ name: string; body: unknown }> = [
      { name: 'unknown field', body: { ...validPayload, extra: true } },
      { name: 'numeric question text', body: { ...validPayload, questionText: 123 } },
      { name: 'non-array options', body: { ...validPayload, options: 'A,B' } },
      { name: 'numeric option value', body: { ...validPayload, options: ['A', 2] } },
      { name: 'string correct index', body: { ...validPayload, correctOptionIndex: '0' } },
      { name: 'non-integer correct index', body: { ...validPayload, correctOptionIndex: 0.5 } },
      { name: 'numeric catalog question id', body: { catalogQuestionId: 123, options: ['A', 'B'], correctOptionIndex: 0 } },
    ];

    for (const { name, body } of invalidPayloads) {
      await test.step(`Reject: create payload shape ${name}`, async () => {
        await expectRejected(await apiPostRaw(request, '/api/know-me', body, partnerA.token));
      });
    }
  });

  test('rejects invalid create payload values', async ({ request }) => {
    const runId = testRunId();
    const { partnerA } = await setupCoupleByApi(
      request,
      testUser('api-knowme-values-a', runId),
      testUser('api-knowme-values-b', runId),
    );

    const invalidPayloads: Array<{ name: string; body: unknown }> = [
      { name: 'invalid catalog UUID', body: { catalogQuestionId: 'not-a-uuid', options: ['A', 'B'], correctOptionIndex: 0 } },
      { name: 'null catalog without free question', body: { catalogQuestionId: null, options: ['A', 'B'], correctOptionIndex: 0 } },
      { name: 'missing question source', body: { options: ['A', 'B'], correctOptionIndex: 0 } },
      { name: 'blank free question', body: { questionText: '   ', options: ['A', 'B'], correctOptionIndex: 0 } },
      { name: 'too few options', body: { questionText: 'Too few?', options: ['A'], correctOptionIndex: 0 } },
      { name: 'blank option after trimming', body: { questionText: 'Blank option?', options: ['A', '   '], correctOptionIndex: 0 } },
      { name: 'too many options', body: { questionText: 'Too many?', options: ['A', 'B', 'C', 'D', 'E'], correctOptionIndex: 0 } },
      { name: 'negative correct index', body: { questionText: 'Negative index?', options: ['A', 'B'], correctOptionIndex: -1 } },
      { name: 'out-of-range correct index', body: { questionText: 'Invalid index?', options: ['A', 'B'], correctOptionIndex: 2 } },
      { name: 'missing catalog question', body: { catalogQuestionId: missingCatalogId, options: ['A', 'B'], correctOptionIndex: 0 } },
    ];

    for (const { name, body } of invalidPayloads) {
      await test.step(`Reject: create payload value ${name}`, async () => {
        await expectRejected(await apiPostRaw(request, '/api/know-me', body, partnerA.token));
      });
    }
  });

  test('rejects invalid guesses own guesses repeated guesses and missing options', async ({ request }) => {
    const runId = testRunId();
    const { partnerA, partnerB } = await setupCoupleByApi(
      request,
      testUser('api-knowme-guess-a', runId),
      testUser('api-knowme-guess-b', runId),
    );

    const created = await test.step('Setup: create round for guess validation', async () => {
      return expectJson<KnowMePayload>(
        await apiPostRaw(
          request,
          '/api/know-me',
          { questionText: 'Guess API edge?', options: ['Only zero', 'Only one'], correctOptionIndex: 0 },
          partnerA.token,
        ),
        201,
      );
    });
    const round = created.rounds.find((item) => item.questionText === 'Guess API edge?');
    expect(round).toBeTruthy();

    const invalidPayloads: Array<{ name: string; body: unknown }> = [
      { name: 'unknown field', body: { selectedOptionIndex: 0, extra: true } },
      { name: 'missing selected index', body: {} },
      { name: 'string selected index', body: { selectedOptionIndex: '0' } },
      { name: 'null selected index', body: { selectedOptionIndex: null } },
      { name: 'non-integer selected index', body: { selectedOptionIndex: 0.5 } },
      { name: 'negative selected index', body: { selectedOptionIndex: -1 } },
      { name: 'index greater than maximum boundary', body: { selectedOptionIndex: 4 } },
      { name: 'valid index without matching option', body: { selectedOptionIndex: 2 } },
    ];

    for (const { name, body } of invalidPayloads) {
      await test.step(`Reject: guess payload ${name}`, async () => {
        await expectRejected(await apiPostRaw(request, `/api/know-me/${round!.id}/guess`, body, partnerB.token));
      });
    }

    await test.step('Reject: author cannot guess own question', async () => {
      await expectApiError(
        await apiPostRaw(request, `/api/know-me/${round!.id}/guess`, { selectedOptionIndex: 0 }, partnerA.token),
        403,
        'knowMe.authorCannotGuessOwnQuestion',
      );
    });

    await test.step('Flow: partner submits first valid guess', async () => {
      await expectJson<KnowMePayload>(
        await apiPostRaw(request, `/api/know-me/${round!.id}/guess`, { selectedOptionIndex: 0 }, partnerB.token),
      );
    });

    await test.step('Reject: partner cannot answer the same question twice', async () => {
      await expectApiError(
        await apiPostRaw(request, `/api/know-me/${round!.id}/guess`, { selectedOptionIndex: 0 }, partnerB.token),
        409,
        'knowMe.questionAlreadyAnswered',
      );
    });
  });
});
