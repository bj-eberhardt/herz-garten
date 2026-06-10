import { expect, test } from '@playwright/test';
import {
  apiDeleteRaw,
  apiGetRaw,
  apiPostRaw,
  createCoupleByApi,
  joinCoupleByApi,
  registerByApi,
  setupCoupleByApi,
} from '../helpers/api';
import {
  expectApiError,
  expectExportPayload,
  expectJson,
  expectMePayload,
  type AuthPayload,
  type ExportPayload,
  type MePayload,
} from '../helpers/apiAssertions';
import { testRunId, testUser } from '../helpers/testUsers';

test.describe('me and couples api', () => {
  test('returns current user creates exports and leaves a couple', async ({ request }) => {
    const runId = testRunId();
    const userA = testUser('api-couple-a', runId);
    const userB = testUser('api-couple-b', runId);
    const partnerA = await registerByApi(request, userA);
    const partnerB = await registerByApi(request, userB);

    const meBeforeCouple = await expectJson<MePayload>(await apiGetRaw(request, '/api/me', partnerA.token));
    expectMePayload(meBeforeCouple);
    expect(meBeforeCouple.couple).toBeNull();

    const created = await expectJson<{ couple: NonNullable<MePayload['couple']> }>(
      await apiPostRaw(request, '/api/couples', { relationshipType: 'mixed', contentPreference: 'balanced' }, partnerA.token),
      201,
    );
    expect(created.couple.memberCount).toBe(1);

    const joined = await expectJson<{ couple: NonNullable<MePayload['couple']> }>(
      await apiPostRaw(request, '/api/couples/join', { inviteCode: created.couple.inviteCode.toLowerCase() }, partnerB.token),
    );
    expect(joined.couple.memberCount).toBe(2);

    const meWithCouple = await expectJson<MePayload>(await apiGetRaw(request, '/api/me', partnerB.token));
    expectMePayload(meWithCouple);
    expect(meWithCouple.couple?.id).toBe(created.couple.id);

    const exported = await expectJson<ExportPayload>(await apiGetRaw(request, '/api/me/export?lang=en', partnerA.token));
    expectExportPayload(exported);
    expect(exported.locale).toBe('en');
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

    const leaveResponse = await apiPostRaw(request, '/api/couples/leave', {}, partnerB.token);
    const leavePayload = await expectJson<MePayload>(leaveResponse);
    expectMePayload(leavePayload);
    expect(leavePayload.couple).toBeNull();
  });

  test('rejects duplicate couple creation and already-connected joins', async ({ request }) => {
    const runId = testRunId();
    const userA = testUser('api-couple-conflict-a', runId);
    const userB = testUser('api-couple-conflict-b', runId);
    const { partnerA, partnerB } = await setupCoupleByApi(request, userA, userB);

    await expectApiError(await apiPostRaw(request, '/api/couples', {}, partnerA.token), 409, 'couple.alreadyConnected');
    await expectApiError(
      await apiPostRaw(request, '/api/couples/join', { inviteCode: 'HERZ-0000' }, partnerB.token),
      409,
      'couple.alreadyConnected',
    );
  });

  test('rejects missing unknown and full invite codes', async ({ request }) => {
    const runId = testRunId();
    const owner = await registerByApi(request, testUser('api-invite-owner', runId));
    const partner = await registerByApi(request, testUser('api-invite-partner', runId));
    const third = await registerByApi(request, testUser('api-invite-third', runId));
    const lonely = await registerByApi(request, testUser('api-invite-lonely', runId));
    const couple = await createCoupleByApi(request, owner.token);

    await expectApiError(await apiPostRaw(request, '/api/couples/join', {}, lonely.token), 400, 'couple.inviteCodeRequired');
    await expectApiError(
      await apiPostRaw(request, '/api/couples/join', { inviteCode: 'HERZ-0000' }, lonely.token),
      404,
      'couple.inviteCodeNotFound',
    );

    await joinCoupleByApi(request, partner.token, couple.couple.inviteCode);
    await expectApiError(
      await apiPostRaw(request, '/api/couples/join', { inviteCode: couple.couple.inviteCode }, third.token),
      409,
      'couple.full',
    );
  });

  test('rejects leave without a couple', async ({ request }) => {
    const user = await registerByApi(request, testUser('api-no-couple-leave', testRunId()));

    await expectApiError(await apiPostRaw(request, '/api/couples/leave', {}, user.token), 409, 'couple.notConnected');
  });

  test('deletes account and invalidates login access', async ({ request }) => {
    const runId = testRunId();
    const userA = testUser('api-delete-a', runId);
    const userB = testUser('api-delete-b', runId);
    const { partnerA, partnerB } = await setupCoupleByApi(request, userA, userB);

    const deleteResponse = await apiDeleteRaw(request, '/api/me', partnerA.token);
    expect(deleteResponse.status()).toBe(204);

    await expectApiError(
      await apiPostRaw(request, '/api/auth/login', { email: userA.email, password: userA.password }),
      401,
      'auth.invalidCredentials',
    );

    const partnerMe = await expectJson<MePayload>(await apiGetRaw(request, '/api/me', partnerB.token));
    expectMePayload(partnerMe);
    expect(partnerMe.couple).toBeNull();

    const partnerNotifications = await expectJson<{ notifications: Array<{ type: string }> }>(
      await apiGetRaw(request, '/api/notifications', partnerB.token),
    );
    expect(partnerNotifications.notifications.some((item) => item.type === 'couple_disconnected')).toBeTruthy();
  });

  test('exports user without couple with minimal data', async ({ request }) => {
    const user = (await registerByApi(request, testUser('api-export-no-couple', testRunId()))) as AuthPayload;

    const exported = await expectJson<ExportPayload>(await apiGetRaw(request, '/api/me/export', user.token));
    expectExportPayload(exported);
    expect(exported.couple).toBeNull();
    expect(exported.data).toBeUndefined();
  });
});
