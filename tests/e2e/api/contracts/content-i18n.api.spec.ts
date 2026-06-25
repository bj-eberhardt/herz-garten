import { expect, test } from '@playwright/test';
import { apiGet, apiGetRaw, setupCoupleByApi } from '../../helpers/api';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('api contracts / content i18n', () => {
  test('api content i18n resolves query parameter and accept-language with fallbacks', async ({ request }) => {
    await test.step('Flow: api content i18n resolves query parameter and accept-language with fallbacks', async () => {
      const runId = testRunId();
      const userA = testUser('api-i18n-a', runId);
      const userB = testUser('api-i18n-b', runId);
      const { partnerA } = await setupCoupleByApi(request, userA, userB);

      const englishQuests = await apiGet<{ quests: Array<{ title: string; description: string; }>; locale: string; }>(
        request,
        '/api/quests?lang=en',
        partnerA.token,
      );
      await test.step('Verify expected result', async () => {
        expect(englishQuests.locale).toBe('en');
      });
      await test.step('Verify expected result', async () => {
        expect(englishQuests.quests.some((quest) => quest.title === 'Three Compliments')).toBeTruthy();
      });

      const germanQuests = await apiGet<{ quests: Array<{ title: string; }>; locale: string; }>(
        request,
        '/api/quests?lang=de',
        partnerA.token,
      );
      await test.step('Verify expected result', async () => {
        expect(germanQuests.locale).toBe('de');
      });
      await test.step('Verify expected result', async () => {
        expect(germanQuests.quests.some((quest) => quest.title === 'Drei Komplimente')).toBeTruthy();
      });

      const headerResponse = await apiGetRaw(request, '/api/quests', partnerA.token, { 'Accept-Language': 'en-US,en;q=0.8' });
      await test.step('Verify expected result', async () => {
        expect(headerResponse.ok()).toBeTruthy();
      });
      const headerPayload = await headerResponse.json();
      await test.step('Verify expected result', async () => {
        expect(headerPayload.locale).toBe('en');
      });
      await test.step('Verify expected result', async () => {
        expect(headerPayload.quests.some((quest: { title: string; }) => quest.title === 'Three Compliments')).toBeTruthy();
      });

      const overrideResponse = await apiGetRaw(request, '/api/quests?lang=de', partnerA.token, {
        'Accept-Language': 'en',
      });
      await test.step('Verify expected result', async () => {
        expect(overrideResponse.ok()).toBeTruthy();
      });
      const overridePayload = await overrideResponse.json();
      await test.step('Verify expected result', async () => {
        expect(overridePayload.locale).toBe('de');
      });
      await test.step('Verify expected result', async () => {
        expect(overridePayload.quests.some((quest: { title: string; }) => quest.title === 'Drei Komplimente')).toBeTruthy();
      });

      const invalidResponse = await apiGetRaw(request, '/api/quests?lang=fr', partnerA.token);
      await test.step('Verify expected result', async () => {
        expect(invalidResponse.ok()).toBeTruthy();
      });
      const invalidPayload = await invalidResponse.json();
      await test.step('Verify expected result', async () => {
        expect(invalidPayload.locale).toBe('de');
      });
      await test.step('Verify expected result', async () => {
        expect(invalidPayload.quests.some((quest: { title: string; }) => quest.title === 'Drei Komplimente')).toBeTruthy();
      });

      const knowMe = await apiGet<{ catalogQuestions: Array<{ questionText: string; category: string; categoryLabel: string; }>; locale: string; }>(
        request,
        '/api/know-me?lang=en',
        partnerA.token,
      );
      await test.step('Verify expected result', async () => {
        expect(knowMe.locale).toBe('en');
      });
      await test.step('Verify expected result', async () => {
        expect(knowMe.catalogQuestions).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ questionText: 'What would my perfect Sunday look like?', category: 'everyday', categoryLabel: 'Everyday life' }),
          ]),
        );
      });
    });
  });
});
