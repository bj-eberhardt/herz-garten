import { expect, test } from '@playwright/test';
import { adminLogin } from '../../helpers/adminApi';
import { apiGet, apiPatchRaw, apiPostRaw, setupCoupleByApi } from '../../helpers/api';
import { expectApiError, expectJson } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('admin api / notification templates', () => {
  test('manages notification message templates and validates placeholders', async ({ request }) => {
    await test.step('Flow: manages notification message templates and validates placeholders', async () => {
      const token = await adminLogin(request);
      const key = 'notifications.bodies.questWaitingConfirmation';

      const listed = await apiGet<{
        items: Array<{
          key: string;
          requiredParams: string[];
          translations: Record<string, { text: string; }>;
        }>;
      }>(request, '/api/admin/message-templates?namespace=notifications', token);
      const template = listed.items.find((item) => item.key === key);
      await test.step('Verify expected result', async () => {
        expect(template).toBeTruthy();
      });
      await test.step('Verify expected result', async () => {
        expect(template!.requiredParams.sort()).toEqual(['name', 'title']);
      });
      const originalText = template!.translations.de.text;
      const coupleJoinedTitle = listed.items.find((item) => item.key === 'notifications.titles.coupleJoined');
      const coupleJoinedBody = listed.items.find((item) => item.key === 'notifications.bodies.coupleJoined');
      await test.step('Verify expected result', async () => {
        expect(coupleJoinedTitle).toBeTruthy();
      });
      await test.step('Verify expected result', async () => {
        expect(coupleJoinedTitle!.requiredParams).toEqual(['name']);
      });
      await test.step('Verify expected result', async () => {
        expect(coupleJoinedTitle!.translations.de.text).toBe('Dein Partner ist da');
      });
      await test.step('Verify expected result', async () => {
        expect(coupleJoinedBody).toBeTruthy();
      });
      await test.step('Verify expected result', async () => {
        expect(coupleJoinedBody!.requiredParams).toEqual(['name']);
      });
      await test.step('Verify expected result', async () => {
        expect(coupleJoinedBody!.translations.de.text).toBe(
          'Toll, {name} hat deinen Paarraum betreten. Ihr könnt nun gemeinsam an eurem Garten arbeiten.',
        );
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPatchRaw(
            request,
            `/api/admin/message-templates/${key}`,
            { translations: { de: { text: '{name} hat bestätigt.' } } },
            token,
          ),
          400,
          'admin.messageTemplateInvalid',
        );
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPatchRaw(
            request,
            `/api/admin/message-templates/${key}`,
            { translations: { de: { text: '{name} hat "{title}" mit {extra} bestätigt.' } } },
            token,
          ),
          400,
          'admin.messageTemplateInvalid',
        );
      });

      const customText = 'Admin-Test: {name} wartet bei "{title}".';
      try {
        const saved = await expectJson<{ items: Array<{ key: string; translations: Record<string, { text: string; }>; }>; }>(
          await apiPatchRaw(
            request,
            `/api/admin/message-templates/${key}`,
            { translations: { de: { text: customText } } },
            token,
          ),
        );
        expect(saved.items.find((item) => item.key === key)?.translations.de.text).toBe(customText);

        const runId = testRunId();
        const setup = await setupCoupleByApi(request, testUser('admin-message-a', runId), testUser('admin-message-b', runId));
        const questPayload = await apiGet<{ quests: Array<{ id: string; title: string; requiresBothPartners: boolean; }>; }>(
          request,
          '/api/quests',
          setup.partnerA.token,
        );
        const quest = questPayload.quests.find((item) => item.requiresBothPartners);
        expect(quest).toBeTruthy();

        await expectJson(await apiPostRaw(request, `/api/quests/${quest!.id}/complete`, {}, setup.partnerA.token));
        const notifications = await apiGet<{ notifications: Array<{ body: string; bodyKey: string; }>; }>(
          request,
          '/api/notifications',
          setup.partnerB.token,
        );
        expect(notifications.notifications.find((item) => item.bodyKey === key)?.body).toBe(
          `Admin-Test: ${setup.partnerA.user.displayName} wartet bei "${quest!.title}".`,
        );
      } finally {
        await apiPatchRaw(
          request,
          `/api/admin/message-templates/${key}`,
          { translations: { de: { text: originalText } } },
          token,
        );
      }
    });
  });
});
