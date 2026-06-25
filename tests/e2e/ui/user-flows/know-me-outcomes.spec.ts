import { expect, test } from '@playwright/test';
import { apiPost, apiPostRaw } from '../../helpers/api';
import { setupPages } from '../../helpers/userFlows';

test.describe('user flow / know me outcomes', () => {
  test('know me wrong guess is resolved without garden reward', async ({ browser, request }) => {
    await test.step('Flow: know me wrong guess is resolved without garden reward', async () => {
      const { contextA, contextB, pageA, pageB } = await setupPages(browser, request, 'knowme-wrong');

      await test.step('Open /know-me', async () => {
        await pageA.goto('/know-me');
      });
      await test.step('Fill know me question input', async () => {
        await pageA.getByTestId('know-me-question-input').fill('Welcher Ort gibt mir Ruhe?');
      });
      await test.step('Fill know me option 0', async () => {
        await pageA.getByTestId('know-me-option-0').fill('Wald');
      });
      await test.step('Fill know me option 1', async () => {
        await pageA.getByTestId('know-me-option-1').fill('Bahnhof');
      });
      await test.step('Click know me create submit', async () => {
        await pageA.getByTestId('know-me-create-submit').click();
      });

      await test.step('Open /know-me', async () => {
        await pageB.goto('/know-me');
      });
      await test.step('Click know me open card', async () => {
        await pageB
          .getByTestId('know-me-open-card')
          .first()
          .getByTestId('know-me-answer-option')
          .filter({ hasText: 'Bahnhof' })
          .click();
      });
      await test.step('Click know me guess submit', async () => {
        await pageB.getByTestId('know-me-guess-submit').click();
      });
      await test.step('Verify know me history card', async () => {
        await expect(pageB.getByTestId('know-me-history-card').first()).toContainText('Nicht getroffen');
      });

      await test.step('Click nav garden', async () => {
        await pageB.getByTestId('nav-garden').click();
      });
      await test.step('Verify garden object', async () => {
        await expect(pageB.getByTestId('garden-object')).toHaveCount(0);
      });

      await contextA.close();
      await contextB.close();
    });
  });

  test('know me author cannot guess own question returns localized error key', async ({ browser, request }) => {
    await test.step('Flow: know me author cannot guess own question returns localized error key', async () => {
      const { contextA, contextB, partnerA } = await setupPages(browser, request, 'knowme-own-guess');
      const payload = await apiPost<{ rounds: Array<{ id: string; questionText: string; }>; }>(
        request,
        '/api/know-me',
        {
          questionText: 'Was waere mein freier Abend?',
          options: ['Lesen', 'Tanzen'],
          correctOptionIndex: 0,
        },
        partnerA.token,
      );
      const ownQuestion = payload.rounds.find((round) => round.questionText === 'Was waere mein freier Abend?');
      await test.step('Verify expected result', async () => {
        expect(ownQuestion).toBeTruthy();
      });

      const response = await apiPostRaw(request, `/api/know-me/${ownQuestion!.id}/guess`, { selectedOptionIndex: 0 }, partnerA.token);
      await test.step('Verify expected result', async () => {
        expect(response.status()).toBe(403);
      });
      const responsePayload = await response.json();
      await test.step('Verify expected result', async () => {
        expect(responsePayload).toEqual(
          expect.objectContaining({
            errorKey: 'knowMe.authorCannotGuessOwnQuestion',
          }),
        );
      });

      await contextA.close();
      await contextB.close();
    });
  });
});
