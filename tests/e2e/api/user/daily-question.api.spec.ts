import { expect, test } from '@playwright/test';

import { apiGetRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../../helpers/api';
import { expectApiError, expectJson, expectTodayPayload, type TodayPayload } from '../../helpers/apiAssertions';
import { moveDailyQuestionInstanceToYesterday } from '../../helpers/db';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / daily question', () => {
  test('returns today payload and reveals answers after both partners answer', async ({ request }) => {
    await test.step('Flow: returns today payload and reveals answers after both partners answer', async () => {
      const runId = testRunId();
      const { partnerA, partnerB } = await setupCoupleByApi(
        request,
        testUser('api-today-a', runId),
        testUser('api-today-b', runId),
      );

      let today!: TodayPayload;
      await test.step('Act: load today payload in English', async () => {
        today = await expectJson<TodayPayload>(await apiGetRaw(request, '/api/today?lang=en', partnerA.token));
      });

      await test.step('Assert: today payload starts unrevealed with no answers', async () => {

        expectTodayPayload(today);

        expect(today.locale).toBe('en');

        expect(today.answers).toHaveLength(0);

      });

      let afterFirstAnswer!: TodayPayload;
      await test.step('Act: first partner answers today question', async () => {
        afterFirstAnswer = await expectJson<TodayPayload>(
          await apiPostRaw(request, '/api/today/answer', { answerText: 'First API answer' }, partnerA.token),
        );
      });

      await test.step('Assert: first answer is stored but hidden until reveal', async () => {

        expectTodayPayload(afterFirstAnswer);

        expect(afterFirstAnswer.answeredByCurrentUser).toBeTruthy();

        expect(afterFirstAnswer.revealed).toBeFalsy();

        expect(afterFirstAnswer.answers).toHaveLength(1);

        expect(afterFirstAnswer.answers[0].answerText).toBeNull();

      });

      let afterSecondAnswer!: TodayPayload;
      await test.step('Act: second partner answers today question', async () => {
        afterSecondAnswer = await expectJson<TodayPayload>(
          await apiPostRaw(request, '/api/today/answer', { answerText: 'Second API answer' }, partnerB.token),
        );
      });

      await test.step('Assert: both answers are revealed', async () => {

        expectTodayPayload(afterSecondAnswer);

        expect(afterSecondAnswer.revealed).toBeTruthy();

        expect(afterSecondAnswer.answers).toHaveLength(2);

        expect(afterSecondAnswer.answers.map((answer) => answer.answerText)).toEqual(

        expect.arrayContaining(['First API answer', 'Second API answer']),

        );

      });
    });
  });

  test('replays an unanswered daily question on a later day', async ({ request }) => {
    await test.step('Flow: replays an unanswered daily question on a later day', async () => {
      const runId = testRunId();
      const { partnerA, partnerB } = await setupCoupleByApi(
        request,
        testUser('api-today-replay-a', runId),
        testUser('api-today-replay-b', runId),
      );
      let firstDay!: TodayPayload;

      await test.step('Arrange: create an unanswered daily question instance', async () => {
        firstDay = await expectJson<TodayPayload>(await apiGetRaw(request, '/api/today', partnerA.token));
        expectTodayPayload(firstDay);
        moveDailyQuestionInstanceToYesterday(firstDay.instance.id);
      });

      await test.step('Assert: next day reuses the unanswered question', async () => {

        const secondDay = await expectJson<TodayPayload>(await apiGetRaw(request, '/api/today', partnerB.token));

        expectTodayPayload(secondDay);

        expect(secondDay.question.id).toBe(firstDay.question.id);

      });
    });
  });

  test('does not repeat a daily question after one partner answered it', async ({ request }) => {
    await test.step('Flow: does not repeat a daily question after one partner answered it', async () => {
      const runId = testRunId();
      const { partnerA, partnerB } = await setupCoupleByApi(
        request,
        testUser('api-today-no-repeat-a', runId),
        testUser('api-today-no-repeat-b', runId),
      );
      let firstDay!: TodayPayload;

      await test.step('Arrange: answer and age the first daily question instance', async () => {
        firstDay = await expectJson<TodayPayload>(
          await apiPostRaw(request, '/api/today/answer', { answerText: 'One answer is enough to consume it' }, partnerA.token),
        );
        expectTodayPayload(firstDay);
        moveDailyQuestionInstanceToYesterday(firstDay.instance.id);
      });

      await test.step('Assert: next day selects a different question', async () => {

        const secondDay = await expectJson<TodayPayload>(await apiGetRaw(request, '/api/today', partnerB.token));

        expectTodayPayload(secondDay);

        expect(secondDay.question.id).not.toBe(firstDay.question.id);

      });
    });
  });

  test('rejects unauthenticated daily question access', async ({ request }) => {
    await test.step('Flow: rejects unauthenticated daily question access', async () => {
      await test.step('Assert: GET /today requires an auth token', async () => {
        await expectApiError(await apiGetRaw(request, '/api/today'), 401, 'auth.missingToken');
      });

      await test.step('Assert: GET /today rejects an invalid auth token', async () => {

        await expectApiError(await apiGetRaw(request, '/api/today', 'invalid-token'), 401, 'auth.invalidToken');

      });

      await test.step('Assert: POST /today/answer requires an auth token', async () => {

        await expectApiError(await apiPostRaw(request, '/api/today/answer', { answerText: 'No token' }), 401, 'auth.missingToken');

      });

      await test.step('Assert: POST /today/answer rejects an invalid auth token', async () => {

        await expectApiError(

        await apiPostRaw(request, '/api/today/answer', { answerText: 'Bad token' }, 'invalid-token'),

        401,

        'auth.invalidToken',

        );

      });
    });
  });

  test('rejects invalid daily question query parameters', async ({ request }) => {
    await test.step('Flow: rejects invalid daily question query parameters', async () => {
      const user = await registerByApi(request, testUser('api-today-query', testRunId()));

      await test.step('Assert: rejects unexpected query parameters', async () => {
        await expectApiError(await apiGetRaw(request, '/api/today?unexpected=true', user.token), 400, 'common.validation');
      });

      await test.step('Assert: rejects malformed locale parameter', async () => {

        await expectApiError(await apiGetRaw(request, '/api/today?lang=de-DE-extra', user.token), 400, 'common.validation');

      });

      await test.step('Assert: rejects duplicate locale parameters', async () => {

        await expectApiError(await apiGetRaw(request, '/api/today?lang=en&lang=de', user.token), 400, 'common.validation');

      });

      await test.step('Assert: rejects empty locale parameter on answer endpoint', async () => {

        await expectApiError(

        await apiPostRaw(request, '/api/today/answer?lang=', { answerText: 'Invalid query' }, user.token),

        400,

        'common.validation',

        );

      });
    });
  });

  test('rejects invalid answer payloads and no-couple access', async ({ request }) => {
    await test.step('Flow: rejects invalid answer payloads and no-couple access', async () => {
      const user = await registerByApi(request, testUser('api-today-no-couple', testRunId()));

      await test.step('Assert: rejects no-couple access for today payload', async () => {
        await expectApiError(await apiGetRaw(request, '/api/today', user.token), 409, 'couple.notConnected');
      });

      await test.step('Assert: rejects no-couple access for valid answer payload', async () => {

        await expectApiError(

        await apiPostRaw(request, '/api/today/answer', { answerText: 'Answer without couple' }, user.token),

        409,

        'couple.notConnected',

        );

      });

      await test.step('Assert: rejects missing answer text', async () => {

        await expectApiError(await apiPostRaw(request, '/api/today/answer', {}, user.token), 400, 'today.answerRequired');

      });

      await test.step('Assert: rejects blank answer text', async () => {

        await expectApiError(await apiPostRaw(request, '/api/today/answer', { answerText: '   ' }, user.token), 400, 'today.answerRequired');

      });

      await test.step('Assert: rejects unexpected answer fields', async () => {

        await expectApiError(

        await apiPostRaw(request, '/api/today/answer', { answerText: 'Valid text', unexpected: true }, user.token),

        400,

        'common.validation',

        );

      });

      await test.step('Assert: rejects wrong answer field type', async () => {

        await expectApiError(await apiPostRaw(request, '/api/today/answer', { answerText: 123 }, user.token), 400, 'common.validation');

      });
    });
  });
});
