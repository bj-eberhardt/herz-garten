import { expect, test } from '@playwright/test';

import { apiGetRaw, apiPostRaw, setupCoupleByApi } from '../../helpers/api';

import {
  expectJson,

  expectKnowMePayload,

  type KnowMePayload
} from '../../helpers/apiAssertions';

import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / know me lifecycle', () => {
  test('lists catalog creates free question and accepts partner guess', async ({ request }) => {
    await test.step('Flow: lists catalog creates free question and accepts partner guess', async () => {
      const runId = testRunId();
      const { partnerA, partnerB } = await setupCoupleByApi(
        request,
        testUser('api-knowme-a', runId),
        testUser('api-knowme-b', runId),
      );

      const listed = await expectJson<KnowMePayload>(await apiGetRaw(request, '/api/know-me?lang=en', partnerA.token));
      expectKnowMePayload(listed);
      await test.step('Verify expected result', async () => {
        expect(listed.locale).toBe('en');
      });
      await test.step('Verify expected result', async () => {
        expect(listed.catalogQuestions.length).toBeGreaterThan(0);
      });

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
      await test.step('Verify expected result', async () => {
        expect(round).toBeTruthy();
      });
      const createdRound = round!;
      await test.step('Verify expected result', async () => {
        expect(createdRound.status).toBe('open');
      });
      await test.step('Verify expected result', async () => {
        expect(createdRound.options[createdRound.correctOptionIndex]).toBe('Second');
      });

      const guessed = await expectJson<KnowMePayload>(
        await apiPostRaw(request, `/api/know-me/${createdRound.id}/guess`, { selectedOptionIndex: createdRound.correctOptionIndex }, partnerB.token),
      );
      expectKnowMePayload(guessed);
      const answered = guessed.rounds.find((item) => item.id === createdRound.id);
      await test.step('Verify expected result', async () => {
        expect(answered?.status).toBe('answered');
      });
      await test.step('Verify expected result', async () => {
        expect(answered?.guess).toEqual(expect.objectContaining({ selectedOptionIndex: createdRound.correctOptionIndex, isCorrect: true }));
      });
    });
  });

  test('shuffles first correct answer before storing', async ({ request }) => {
    await test.step('Flow: shuffles first correct answer before storing', async () => {
      const runId = testRunId();
      const { partnerA } = await setupCoupleByApi(
        request,
        testUser('api-knowme-shuffle-a', runId),
        testUser('api-knowme-shuffle-b', runId),
      );

      const created = await expectJson<KnowMePayload>(
        await apiPostRaw(
          request,
          '/api/know-me',
          {
            questionText: 'Which answer should move?',
            options: ['Correct answer', 'Wrong answer', 'Another wrong answer'],
            correctOptionIndex: 0,
          },
          partnerA.token,
        ),
        201,
      );
      const round = created.rounds.find((item) => item.questionText === 'Which answer should move?');
      await test.step('Verify expected result', async () => {
        expect(round).toBeTruthy();
      });
      const createdRound = round!;
      await test.step('Verify expected result', async () => {
        expect(createdRound.options[createdRound.correctOptionIndex]).toBe('Correct answer');
      });
      await test.step('Verify expected result', async () => {
        expect(createdRound.correctOptionIndex).not.toBe(0);
      });
    });
  });
});
