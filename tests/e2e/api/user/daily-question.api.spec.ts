import { expect, test } from '@playwright/test';

import { apiGetRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../../helpers/api';

import {
  expectApiError,

  expectJson,
  expectTodayPayload,
  type TodayPayload
} from '../../helpers/apiAssertions';

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

      const today = await expectJson<TodayPayload>(await apiGetRaw(request, '/api/today?lang=en', partnerA.token));
      expectTodayPayload(today);
      await test.step('Verify expected result', async () => {
        expect(today.locale).toBe('en');
      });
      await test.step('Verify expected result', async () => {
        expect(today.answers).toHaveLength(0);
      });

      const afterFirstAnswer = await expectJson<TodayPayload>(
        await apiPostRaw(request, '/api/today/answer', { answerText: 'First API answer' }, partnerA.token),
      );
      expectTodayPayload(afterFirstAnswer);
      await test.step('Verify expected result', async () => {
        expect(afterFirstAnswer.answeredByCurrentUser).toBeTruthy();
      });
      await test.step('Verify expected result', async () => {
        expect(afterFirstAnswer.revealed).toBeFalsy();
      });
      await test.step('Verify expected result', async () => {
        expect(afterFirstAnswer.answers).toHaveLength(1);
      });
      await test.step('Verify expected result', async () => {
        expect(afterFirstAnswer.answers[0].answerText).toBeNull();
      });

      const afterSecondAnswer = await expectJson<TodayPayload>(
        await apiPostRaw(request, '/api/today/answer', { answerText: 'Second API answer' }, partnerB.token),
      );
      expectTodayPayload(afterSecondAnswer);
      await test.step('Verify expected result', async () => {
        expect(afterSecondAnswer.revealed).toBeTruthy();
      });
      await test.step('Verify expected result', async () => {
        expect(afterSecondAnswer.answers).toHaveLength(2);
      });
      await test.step('Verify expected result', async () => {
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

      const firstDay = await expectJson<TodayPayload>(await apiGetRaw(request, '/api/today', partnerA.token));
      expectTodayPayload(firstDay);

      moveDailyQuestionInstanceToYesterday(firstDay.instance.id);

      const secondDay = await expectJson<TodayPayload>(await apiGetRaw(request, '/api/today', partnerB.token));
      expectTodayPayload(secondDay);
      await test.step('Verify expected result', async () => {
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

      const firstDay = await expectJson<TodayPayload>(
        await apiPostRaw(request, '/api/today/answer', { answerText: 'One answer is enough to consume it' }, partnerA.token),
      );
      expectTodayPayload(firstDay);

      moveDailyQuestionInstanceToYesterday(firstDay.instance.id);

      const secondDay = await expectJson<TodayPayload>(await apiGetRaw(request, '/api/today', partnerB.token));
      expectTodayPayload(secondDay);
      await test.step('Verify expected result', async () => {
        expect(secondDay.question.id).not.toBe(firstDay.question.id);
      });
    });
  });

  test('rejects missing answer and no-couple access', async ({ request }) => {
    await test.step('Flow: rejects missing answer and no-couple access', async () => {
      const user = await registerByApi(request, testUser('api-today-no-couple', testRunId()));

      await test.step('Verify API error response', async () => {
        await expectApiError(await apiGetRaw(request, '/api/today', user.token), 409, 'couple.notConnected');
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/today/answer', { answerText: 'Answer without couple' }, user.token),
          409,
          'couple.notConnected',
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(await apiPostRaw(request, '/api/today/answer', {}, user.token), 400, 'today.answerRequired');
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(await apiPostRaw(request, '/api/today/answer', { answerText: '' }, user.token), 400, 'today.answerRequired');
      });
    });
  });
});
