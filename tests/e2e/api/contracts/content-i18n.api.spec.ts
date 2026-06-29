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

      await test.step('Assert: lang=en resolves English quests', async () => {
        const englishQuests = await apiGet<{ quests: Array<{ title: string; description: string }>; locale: string }>(
          request,
          '/api/quests?lang=en',
          partnerA.token,
        );
        expect(englishQuests.locale).toBe('en');
        expect(englishQuests.quests.some((quest) => quest.title === 'Three Compliments')).toBeTruthy();
      });

      await test.step('Assert: lang=de resolves German quests', async () => {
        const germanQuests = await apiGet<{ quests: Array<{ title: string }>; locale: string }>(
          request,
          '/api/quests?lang=de',
          partnerA.token,
        );
        expect(germanQuests.locale).toBe('de');
        expect(germanQuests.quests.some((quest) => quest.title === 'Drei Komplimente')).toBeTruthy();
      });

      await test.step('Assert: Accept-Language header resolves English quests', async () => {
        const headerResponse = await apiGetRaw(request, '/api/quests', partnerA.token, { 'Accept-Language': 'en-US,en;q=0.8' });
        const headerPayload = await headerResponse.json();
        expect(headerResponse.ok()).toBeTruthy();
        expect(headerPayload.locale).toBe('en');
        expect(headerPayload.quests.some((quest: { title: string }) => quest.title === 'Three Compliments')).toBeTruthy();
      });

      await test.step('Assert: lang query overrides Accept-Language header', async () => {
        const overrideResponse = await apiGetRaw(request, '/api/quests?lang=de', partnerA.token, {
          'Accept-Language': 'en',
        });
        const overridePayload = await overrideResponse.json();
        expect(overrideResponse.ok()).toBeTruthy();
        expect(overridePayload.locale).toBe('de');
        expect(overridePayload.quests.some((quest: { title: string }) => quest.title === 'Drei Komplimente')).toBeTruthy();
      });

      await test.step('Assert: unsupported lang falls back to German', async () => {
        const invalidResponse = await apiGetRaw(request, '/api/quests?lang=fr', partnerA.token);
        const invalidPayload = await invalidResponse.json();
        expect(invalidResponse.ok()).toBeTruthy();
        expect(invalidPayload.locale).toBe('de');
        expect(invalidPayload.quests.some((quest: { title: string }) => quest.title === 'Drei Komplimente')).toBeTruthy();
      });

      await test.step('Assert: know-me catalog resolves English translations', async () => {
        const knowMe = await apiGet<{
          catalogQuestions: Array<{ questionText: string; category: string; categoryLabel: string }>;
          locale: string;
        }>(request, '/api/know-me?lang=en', partnerA.token);
        expect(knowMe.locale).toBe('en');
        expect(knowMe.catalogQuestions).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              questionText: 'What would my perfect Sunday look like?',
              category: 'everyday',
              categoryLabel: 'Everyday life',
            }),
          ]),
        );
      });
    });
  });
});
