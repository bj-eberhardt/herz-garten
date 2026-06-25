import { expect, test } from '@playwright/test';

import {
  apiGetRaw,
  apiPostRaw,
  registerByApi
} from '../../helpers/api';

import {
  expectApiError,

  expectExportPayload,

  expectJson,

  expectMePayload,

  expectNotificationsPayload,

  type AuthPayload,

  type ExportPayload,

  type MePayload,

  type NotificationsPayload,
} from '../../helpers/apiAssertions';

import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / account overview export', () => {
  test('returns current user creates exports and leaves a couple', async ({ request }) => {
    await test.step('Flow: returns current user creates exports and leaves a couple', async () => {
      const runId = testRunId();
      const userA = testUser('api-couple-a', runId);
      const userB = testUser('api-couple-b', runId);
      const partnerA = await registerByApi(request, userA);
      const partnerB = await registerByApi(request, userB);

      const meBeforeCouple = await expectJson<MePayload>(await apiGetRaw(request, '/api/me', partnerA.token));
      expectMePayload(meBeforeCouple);
      await test.step('Verify expected result', async () => {
        expect(meBeforeCouple.couple).toBeNull();
      });

      const created = await expectJson<{ couple: NonNullable<MePayload['couple']>; }>(
        await apiPostRaw(request, '/api/couples', { relationshipType: 'mixed', contentPreference: 'balanced' }, partnerA.token),
        201,
      );
      await test.step('Verify expected result', async () => {
        expect(created.couple.memberCount).toBe(1);
      });

      const joined = await expectJson<{ couple: NonNullable<MePayload['couple']>; }>(
        await apiPostRaw(request, '/api/couples/join', { inviteCode: created.couple.inviteCode.toLowerCase() }, partnerB.token),
      );
      await test.step('Verify expected result', async () => {
        expect(joined.couple.memberCount).toBe(2);
      });

      const ownerNotifications = await expectJson<NotificationsPayload>(await apiGetRaw(request, '/api/notifications', partnerA.token));
      expectNotificationsPayload(ownerNotifications);
      const joinedNotifications = ownerNotifications.notifications.filter((item) => item.type === 'couple_joined');
      await test.step('Verify expected result', async () => {
        expect(joinedNotifications).toHaveLength(1);
      });
      await test.step('Verify expected result', async () => {
        expect(joinedNotifications[0]).toEqual(
          expect.objectContaining({
            titleKey: 'notifications.titles.coupleJoined',
            bodyKey: 'notifications.bodies.coupleJoined',
            title: 'Dein Partner ist da',
            body: `Toll, ${partnerB.user.displayName} hat deinen Paarraum betreten. Ihr könnt nun gemeinsam an eurem Garten arbeiten.`,
            sourceType: 'couple',
            sourceId: created.couple.id,
            params: { name: partnerB.user.displayName },
          }),
        );
      });

      const joiningUserNotifications = await expectJson<NotificationsPayload>(await apiGetRaw(request, '/api/notifications', partnerB.token));
      await test.step('Verify expected result', async () => {
        expect(joiningUserNotifications.notifications.filter((item) => item.type === 'couple_joined')).toHaveLength(0);
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/couples/join', { inviteCode: created.couple.inviteCode }, partnerB.token),
          409,
          'couple.alreadyConnected',
        );
      });
      const thirdUser = await registerByApi(request, testUser('api-couple-third', runId));
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/couples/join', { inviteCode: created.couple.inviteCode }, thirdUser.token),
          409,
          'couple.full',
        );
      });
      const ownerNotificationsAfterInvalidJoins = await expectJson<NotificationsPayload>(
        await apiGetRaw(request, '/api/notifications', partnerA.token),
      );
      await test.step('Verify expected result', async () => {
        expect(ownerNotificationsAfterInvalidJoins.notifications.filter((item) => item.type === 'couple_joined')).toHaveLength(1);
      });

      const meWithCouple = await expectJson<MePayload>(await apiGetRaw(request, '/api/me', partnerB.token));
      expectMePayload(meWithCouple);
      await test.step('Verify expected result', async () => {
        expect(meWithCouple.couple?.id).toBe(created.couple.id);
      });

      const exported = await expectJson<ExportPayload>(await apiGetRaw(request, '/api/me/export?lang=en', partnerA.token));
      expectExportPayload(exported);
      await test.step('Verify expected result', async () => {
        expect(exported.locale).toBe('en');
      });
      await test.step('Verify expected result', async () => {
        expect(exported.data).toEqual(
          expect.objectContaining({
            members: expect.any(Array),
            dailyQuestionAnswers: expect.any(Array),
            coupleQuests: expect.any(Array),
            gardenObjects: expect.any(Array),
            loveJarNotes: expect.any(Array),
            memories: expect.any(Array),
            knowMeQuestions: expect.any(Array),
            knowMeGuesses: expect.any(Array),
            notifications: expect.any(Array),
          }),
        );
      });

      const leaveResponse = await apiPostRaw(request, '/api/couples/leave', {}, partnerB.token);
      const leavePayload = await expectJson<MePayload>(leaveResponse);
      expectMePayload(leavePayload);
      await test.step('Verify expected result', async () => {
        expect(leavePayload.couple).toBeNull();
      });
    });
  });

  test('exports user without couple with minimal data', async ({ request }) => {
    await test.step('Flow: exports user without couple with minimal data', async () => {
      const user = (await registerByApi(request, testUser('api-export-no-couple', testRunId()))) as AuthPayload;

      const exported = await expectJson<ExportPayload>(await apiGetRaw(request, '/api/me/export', user.token));
      expectExportPayload(exported);
      await test.step('Verify expected result', async () => {
        expect(exported.couple).toBeNull();
      });
      await test.step('Verify expected result', async () => {
        expect(exported.data).toBeUndefined();
      });
    });
  });
});
