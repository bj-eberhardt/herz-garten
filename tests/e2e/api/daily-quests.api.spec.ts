import { expect, test } from '@playwright/test';
import { apiGetRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../helpers/api';
import {
  expectApiError,
  expectJson,
  expectQuestsPayload,
  expectTodayPayload,
  type QuestsPayload,
  type TodayPayload,
} from '../helpers/apiAssertions';
import { moveDailyQuestionInstanceToYesterday } from '../helpers/db';
import { testRunId, testUser } from '../helpers/testUsers';

test.describe('daily question api', () => {
  test('returns today payload and reveals answers after both partners answer', async ({ request }) => {
    const runId = testRunId();
    const { partnerA, partnerB } = await setupCoupleByApi(
      request,
      testUser('api-today-a', runId),
      testUser('api-today-b', runId),
    );

    const today = await expectJson<TodayPayload>(await apiGetRaw(request, '/api/today?lang=en', partnerA.token));
    expectTodayPayload(today);
    expect(today.locale).toBe('en');
    expect(today.answers).toHaveLength(0);

    const afterFirstAnswer = await expectJson<TodayPayload>(
      await apiPostRaw(request, '/api/today/answer', { answerText: 'First API answer' }, partnerA.token),
    );
    expectTodayPayload(afterFirstAnswer);
    expect(afterFirstAnswer.answeredByCurrentUser).toBeTruthy();
    expect(afterFirstAnswer.revealed).toBeFalsy();
    expect(afterFirstAnswer.answers).toHaveLength(1);
    expect(afterFirstAnswer.answers[0].answerText).toBeNull();

    const afterSecondAnswer = await expectJson<TodayPayload>(
      await apiPostRaw(request, '/api/today/answer', { answerText: 'Second API answer' }, partnerB.token),
    );
    expectTodayPayload(afterSecondAnswer);
    expect(afterSecondAnswer.revealed).toBeTruthy();
    expect(afterSecondAnswer.answers).toHaveLength(2);
    expect(afterSecondAnswer.answers.map((answer) => answer.answerText)).toEqual(
      expect.arrayContaining(['First API answer', 'Second API answer']),
    );
  });

  test('replays an unanswered daily question on a later day', async ({ request }) => {
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
    expect(secondDay.question.id).toBe(firstDay.question.id);
  });

  test('does not repeat a daily question after one partner answered it', async ({ request }) => {
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
    expect(secondDay.question.id).not.toBe(firstDay.question.id);
  });

  test('rejects missing answer and no-couple access', async ({ request }) => {
    const user = await registerByApi(request, testUser('api-today-no-couple', testRunId()));

    await expectApiError(await apiGetRaw(request, '/api/today', user.token), 409, 'couple.notConnected');
    await expectApiError(
      await apiPostRaw(request, '/api/today/answer', { answerText: 'Answer without couple' }, user.token),
      409,
      'couple.notConnected',
    );
    await expectApiError(await apiPostRaw(request, '/api/today/answer', {}, user.token), 400, 'today.answerRequired');
    await expectApiError(await apiPostRaw(request, '/api/today/answer', { answerText: '' }, user.token), 400, 'today.answerRequired');
  });
});

test.describe('quests api', () => {
  test('lists filters accepts and completes quests with partner confirmation', async ({ request }) => {
    const runId = testRunId();
    const { partnerA, partnerB } = await setupCoupleByApi(
      request,
      testUser('api-quest-a', runId),
      testUser('api-quest-b', runId),
    );

    const listed = await expectJson<QuestsPayload>(
      await apiGetRaw(request, '/api/quests?lang=de&category=long_distance&maxMinutes=15&mode=long_distance', partnerA.token),
    );
    expectQuestsPayload(listed);
    expect(listed.locale).toBe('de');
    expect(listed.filters).toEqual(expect.objectContaining({ category: 'long_distance', maxMinutes: 15, mode: 'long_distance' }));
    expect(listed.quests.length).toBeGreaterThan(0);

    const allQuests = await expectJson<QuestsPayload>(await apiGetRaw(request, '/api/quests', partnerA.token));
    const quest = allQuests.quests.find((item) => item.requiresBothPartners) ?? allQuests.quests[0];
    expect(quest).toBeTruthy();

    const accepted = await expectJson<QuestsPayload>(
      await apiPostRaw(request, `/api/quests/${quest.id}/accept`, {}, partnerA.token),
    );
    expectQuestsPayload(accepted);
    expect(accepted.quests.find((item) => item.id === quest.id)?.coupleQuest?.status).toBe('accepted');

    const firstComplete = await expectJson<QuestsPayload>(
      await apiPostRaw(request, `/api/quests/${quest.id}/complete`, {}, partnerA.token),
    );
    expectQuestsPayload(firstComplete);
    const afterFirst = firstComplete.quests.find((item) => item.id === quest.id);
    expect(afterFirst?.coupleQuest?.completedByUserIds).toContain(partnerA.user.id);

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

  test('rejects no-couple access and missing quests', async ({ request }) => {
    const user = await registerByApi(request, testUser('api-quest-no-couple', testRunId()));
    const runId = testRunId();
    const { partnerA } = await setupCoupleByApi(
      request,
      testUser('api-quest-notfound-a', runId),
      testUser('api-quest-notfound-b', runId),
    );
    const missingQuestId = '00000000-0000-0000-0000-000000000000';

    await expectApiError(await apiGetRaw(request, '/api/quests', user.token), 409, 'couple.notConnected');
    await expectApiError(
      await apiGetRaw(request, '/api/quests?effortLevel=invalid&maxMinutes=soon', partnerA.token),
      400,
      'common.validation',
    );
    await expectApiError(
      await apiPostRaw(request, `/api/quests/${missingQuestId}/accept`, {}, partnerA.token),
      404,
      'quest.notFound',
    );
    await expectApiError(
      await apiPostRaw(request, `/api/quests/${missingQuestId}/complete`, {}, partnerA.token),
      404,
      'quest.notFound',
    );
  });
});
