import { expect, test } from '@playwright/test';

import { apiGetRaw, apiPostRaw, setupCoupleByApi } from '../../helpers/api';
import { expectJson, expectKnowMePayload, type KnowMePayload } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / know me lifecycle', () => {
  test('lists catalog creates free question and accepts partner guess', async ({ request }) => {
    const runId = testRunId();
    const { partnerA, partnerB } = await test.step('Setup: connected couple', async () => {
      return setupCoupleByApi(
        request,
        testUser('api-knowme-a', runId),
        testUser('api-knowme-b', runId),
      );
    });

    const listed = await test.step('Flow: list catalog in requested locale', async () => {
      const payload = await expectJson<KnowMePayload>(await apiGetRaw(request, '/api/know-me?lang=en', partnerA.token));
      expectKnowMePayload(payload);
      expect(payload.locale).toBe('en');
      expect(payload.catalogQuestions.length).toBeGreaterThan(0);
      return payload;
    });

    const createdRound = await test.step('Flow: create free question with three options', async () => {
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
      expect(created.catalogQuestions.length).toBe(listed.catalogQuestions.length);
      const round = created.rounds.find((item) => item.questionText === 'Which API option is correct?');
      expect(round).toBeTruthy();
      expect(round!.status).toBe('open');
      expect(round!.options[round!.correctOptionIndex]).toBe('Second');
      return round!;
    });

    await test.step('Flow: partner answers correctly and round is resolved', async () => {
      const guessed = await expectJson<KnowMePayload>(
        await apiPostRaw(request, `/api/know-me/${createdRound.id}/guess`, { selectedOptionIndex: createdRound.correctOptionIndex }, partnerB.token),
      );
      expectKnowMePayload(guessed);
      const answered = guessed.rounds.find((item) => item.id === createdRound.id);
      expect(answered?.status).toBe('answered');
      expect(answered?.guess).toEqual(expect.objectContaining({ selectedOptionIndex: createdRound.correctOptionIndex, isCorrect: true }));
    });
  });

  test('shuffles first correct answer before storing', async ({ request }) => {
    const runId = testRunId();
    const { partnerA } = await test.step('Setup: connected couple', async () => {
      return setupCoupleByApi(
        request,
        testUser('api-knowme-shuffle-a', runId),
        testUser('api-knowme-shuffle-b', runId),
      );
    });

    await test.step('Flow: create question whose first option is correct', async () => {
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
      expect(round).toBeTruthy();
      expect(round!.options[round!.correctOptionIndex]).toBe('Correct answer');
      expect(round!.correctOptionIndex).not.toBe(0);
    });
  });
});
