import { expect, test } from '@playwright/test';
import { adminLogin } from '../../helpers/adminApi';
import { apiGet, apiGetRaw, apiPatchRaw, apiPost, apiPostRaw, registerByApi, setupCoupleByApi } from '../../helpers/api';
import { expectApiError, expectJson } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

const missingCoupleId = '00000000-0000-4000-8000-000000000000';
const invalidCoupleId = 'not-a-couple-id';
const overlongSearch = 'x'.repeat(201);

test.describe('admin api / couples', () => {
  test('lists couples, protects private text and supports detail, csv and pagination', async ({ request }) => {
    await test.step('Flow: lists couples, protects private text and supports detail, csv and pagination', async () => {
      const runId = testRunId();
      const owner = await registerByApi(request, testUser('admin-one-member-couple', runId));
      const couple = await apiPost<{ couple: { id: string; inviteCode: string; memberCount: number; }; }>(
        request,
        '/api/couples',
        { relationshipType: 'mixed', contentPreference: 'balanced' },
        owner.token,
      );
      await apiPostRaw(request, '/api/today/answer', { answerText: 'private one-member answer' }, owner.token);
      await apiPostRaw(request, '/api/love-jar', { text: 'private one-member note one', category: 'compliment' }, owner.token);
      await apiPostRaw(request, '/api/love-jar', { text: 'private one-member note two', category: 'compliment' }, owner.token);
      await expectJson(
        await apiPostRaw(
          request,
          '/api/know-me',
          {
            questionText: 'Welche Farbe mag ich gerade?',
            options: ['Gruen', 'Blau'],
            correctOptionIndex: 0,
          },
          owner.token,
        ),
        201,
      );

      const setup = await setupCoupleByApi(
        request,
        testUser('admin-couple-list-a', runId),
        testUser('admin-couple-list-b', runId),
      );
      const token = await adminLogin(request);

      const byInvite = await expectJson<{
        items: Array<{
          id: string;
          inviteCode: string;
          members: Array<{ email: string; displayName: string; }>;
          dailyAnswerCount: number;
          completedQuestCount: number;
          loveJarNoteCount: number;
          memoryCount: number;
          knowMeRoundCount: number;
        }>;
        total: number;
        limit: number;
        offset: number;
      }>(await apiGetRaw(request, `/api/admin/couples?search=${couple.couple.inviteCode}`, token));

      await test.step('Verify one-member couple list payload', async () => {
        expect(byInvite.items).toHaveLength(1);
        expect(byInvite.items[0]).toEqual(
          expect.objectContaining({
            id: couple.couple.id,
            inviteCode: couple.couple.inviteCode,
            dailyAnswerCount: 1,
            loveJarNoteCount: 2,
            knowMeRoundCount: 0,
            completedQuestCount: expect.any(Number),
            memoryCount: expect.any(Number),
          }),
        );
        expect(byInvite.items[0].members).toHaveLength(1);
        expect(byInvite.items[0].members[0].email).toBe(owner.user.email);
        expect(byInvite.total).toBe(1);
        expect(byInvite.limit).toBe(25);
        expect(byInvite.offset).toBe(0);
        expect(JSON.stringify(byInvite)).not.toContain('private one-member answer');
        expect(JSON.stringify(byInvite)).not.toContain('private one-member note');
      });

      const byEmail = await expectJson<{ items: Array<{ inviteCode: string; }>; }>(
        await apiGetRaw(request, `/api/admin/couples?search=${encodeURIComponent(setup.partnerA.user.email)}`, token),
      );
      await test.step('Verify search by member email', async () => {
        expect(byEmail.items).toEqual(expect.arrayContaining([expect.objectContaining({ inviteCode: setup.inviteCode })]));
      });

      const byDisplayName = await expectJson<{ items: Array<{ inviteCode: string; }>; }>(
        await apiGetRaw(request, `/api/admin/couples?search=${encodeURIComponent(setup.partnerB.user.displayName)}`, token),
      );
      await test.step('Verify search by member display name', async () => {
        expect(byDisplayName.items).toEqual(expect.arrayContaining([expect.objectContaining({ inviteCode: setup.inviteCode })]));
      });

      const paged = await expectJson<{ items: unknown[]; total: number; limit: number; offset: number; }>(
        await apiGetRaw(request, '/api/admin/couples?limit=1&offset=0', token),
      );
      await test.step('Verify pagination metadata', async () => {
        expect(paged.items).toHaveLength(1);
        expect(paged.total).toBeGreaterThanOrEqual(2);
        expect(paged.limit).toBe(1);
        expect(paged.offset).toBe(0);
      });

      const emptyPage = await expectJson<{ items: unknown[]; total: number; limit: number; offset: number; }>(
        await apiGetRaw(request, '/api/admin/couples?limit=1&offset=100000', token),
      );
      await test.step('Verify empty pagination page', async () => {
        expect(emptyPage.items).toHaveLength(0);
        expect(emptyPage.total).toBeGreaterThanOrEqual(2);
        expect(emptyPage.limit).toBe(1);
        expect(emptyPage.offset).toBe(100000);
      });

      const detail = await apiGet<{
        couple: {
          id: string;
          inviteCode: string;
          members: Array<{ email: string; displayName: string; role: string; joinedAt: string; }>;
          answeredQuestionCount: number;
          dailyAnswerCount: number;
          completedQuestCount: number;
          loveJarNoteCount: number;
          drawnLoveJarNoteCount: number;
          memoryCount: number;
          knowMeRoundCount: number;
          knowMeHitCount: number;
          gardenObjectCount: number;
          lastGardenMomentAt: string;
        };
      }>(request, `/api/admin/couples/${couple.couple.id}`, token);
      await test.step('Verify couple detail payload', async () => {
        expect(detail.couple).toEqual(
          expect.objectContaining({
            id: couple.couple.id,
            inviteCode: couple.couple.inviteCode,
            answeredQuestionCount: expect.any(Number),
            dailyAnswerCount: 1,
            completedQuestCount: expect.any(Number),
            loveJarNoteCount: 2,
            drawnLoveJarNoteCount: expect.any(Number),
            memoryCount: expect.any(Number),
            knowMeRoundCount: expect.any(Number),
            knowMeHitCount: expect.any(Number),
            gardenObjectCount: expect.any(Number),
            lastGardenMomentAt: expect.any(String),
          }),
        );
        expect(detail.couple.members).toHaveLength(1);
        expect(JSON.stringify(detail)).not.toContain('private one-member answer');
        expect(JSON.stringify(detail)).not.toContain('private one-member note');
      });

      const csvResponse = await apiGetRaw(request, `/api/admin/couples?search=${couple.couple.inviteCode}&format=csv`, token);
      const csv = await csvResponse.text();
      await test.step('Verify couples csv export', async () => {
        expect(csvResponse.status()).toBe(200);
        expect(csvResponse.headers()['content-type']).toContain('text/csv');
        expect(csv).toContain('inviteCode');
        expect(csv).toContain(couple.couple.inviteCode);
        expect(csv).toContain(owner.user.email);
        expect(csv).not.toContain('private one-member answer');
        expect(csv).not.toContain('private one-member note');
      });
    });
  });

  test('rejects invalid auth, ids, queries and preference payloads', async ({ request }) => {
    await test.step('Flow: rejects invalid auth, ids, queries and preference payloads', async () => {
      const runId = testRunId().replaceAll('-', '_');
      const setup = await setupCoupleByApi(
        request,
        testUser('admin-couple-validation-a', runId),
        testUser('admin-couple-validation-b', runId),
      );
      const token = await adminLogin(request);
      const couples = await apiGet<{ items: Array<{ id: string; inviteCode: string; }>; }>(
        request,
        `/api/admin/couples?search=${setup.inviteCode}`,
        token,
      );
      const coupleId = couples.items[0].id;

      await test.step('Reject missing and invalid admin tokens', async () => {
        await expectApiError(await apiGetRaw(request, '/api/admin/couples'), 401, 'auth.missingToken');
        await expectApiError(await apiGetRaw(request, `/api/admin/couples/${coupleId}`), 401, 'auth.missingToken');
        await expectApiError(
          await apiPatchRaw(request, `/api/admin/couples/${coupleId}/preferences`, { relationshipType: 'mixed', contentPreference: 'balanced' }),
          401,
          'auth.missingToken',
        );
        await expectApiError(await apiGetRaw(request, '/api/admin/couples', 'invalid-token'), 401, 'auth.invalidToken');
        await expectApiError(await apiGetRaw(request, `/api/admin/couples/${coupleId}`, 'invalid-token'), 401, 'auth.invalidToken');
        await expectApiError(
          await apiPatchRaw(request, `/api/admin/couples/${coupleId}/preferences`, { relationshipType: 'mixed', contentPreference: 'balanced' }, 'invalid-token'),
          401,
          'auth.invalidToken',
        );
      });

      await test.step('Reject invalid list queries', async () => {
        await expectApiError(await apiGetRaw(request, '/api/admin/couples?limit=0', token), 400, 'common.validation');
        await expectApiError(await apiGetRaw(request, '/api/admin/couples?limit=101', token), 400, 'common.validation');
        await expectApiError(await apiGetRaw(request, '/api/admin/couples?limit=abc', token), 400, 'common.validation');
        await expectApiError(await apiGetRaw(request, '/api/admin/couples?offset=-1', token), 400, 'common.validation');
        await expectApiError(await apiGetRaw(request, '/api/admin/couples?format=xml', token), 400, 'common.validation');
        await expectApiError(await apiGetRaw(request, `/api/admin/couples?search=${overlongSearch}`, token), 400, 'common.validation');
        await expectApiError(await apiGetRaw(request, '/api/admin/couples?unexpected=true', token), 400, 'common.validation');
      });

      await test.step('Reject missing and invalid couple ids', async () => {
        await expectApiError(await apiGetRaw(request, `/api/admin/couples/${missingCoupleId}`, token), 404, 'couple.notFound');
        await expectApiError(await apiGetRaw(request, `/api/admin/couples/${invalidCoupleId}`, token), 404, 'couple.notFound');
        await expectApiError(
          await apiPatchRaw(request, `/api/admin/couples/${missingCoupleId}/preferences`, { relationshipType: 'mixed', contentPreference: 'balanced' }, token),
          404,
          'couple.notFound',
        );
        await expectApiError(
          await apiPatchRaw(request, `/api/admin/couples/${invalidCoupleId}/preferences`, { relationshipType: 'mixed', contentPreference: 'balanced' }, token),
          404,
          'couple.notFound',
        );
      });

      const inactiveRelationshipValue = `inactive_rel_${runId}`;
      const inactiveStyleValue = `inactive_style_${runId}`;
      await expectJson<{ id: string; }>(
        await apiPostRaw(
          request,
          '/api/admin/relationship-modes',
          {
            value: inactiveRelationshipValue,
            active: false,
            sortOrder: 1,
            translations: { de: { label: `Inactive relationship ${runId}` } },
          },
          token,
        ),
        201,
      );
      await expectJson<{ id: string; }>(
        await apiPostRaw(
          request,
          '/api/admin/content-styles',
          {
            value: inactiveStyleValue,
            active: false,
            sortOrder: 1,
            translations: { de: { label: `Inactive style ${runId}` } },
          },
          token,
        ),
        201,
      );

      await test.step('Reject invalid preference payloads', async () => {
        const invalidPayloads = [
          {},
          { relationshipType: 'mixed' },
          { contentPreference: 'balanced' },
          { relationshipType: '', contentPreference: 'balanced' },
          { relationshipType: 'mixed', contentPreference: '' },
          { relationshipType: null, contentPreference: 'balanced' },
          { relationshipType: 'mixed', contentPreference: null },
          { relationshipType: 1, contentPreference: 'balanced' },
          { relationshipType: 'mixed', contentPreference: false },
          { relationshipType: 'mixed', contentPreference: 'balanced', unexpected: true },
        ];
        for (const payload of invalidPayloads) {
          await expectApiError(await apiPatchRaw(request, `/api/admin/couples/${coupleId}/preferences`, payload, token), 400, 'common.validation');
        }
      });

      await test.step('Reject unknown and inactive preference values', async () => {
        await expectApiError(
          await apiPatchRaw(request, `/api/admin/couples/${coupleId}/preferences`, { relationshipType: 'missing_relationship', contentPreference: 'balanced' }, token),
          400,
          'admin.couplePreferencesInvalid',
        );
        await expectApiError(
          await apiPatchRaw(request, `/api/admin/couples/${coupleId}/preferences`, { relationshipType: 'mixed', contentPreference: 'missing_style' }, token),
          400,
          'admin.couplePreferencesInvalid',
        );
        await expectApiError(
          await apiPatchRaw(request, `/api/admin/couples/${coupleId}/preferences`, { relationshipType: inactiveRelationshipValue, contentPreference: 'balanced' }, token),
          400,
          'admin.couplePreferencesInvalid',
        );
        await expectApiError(
          await apiPatchRaw(request, `/api/admin/couples/${coupleId}/preferences`, { relationshipType: 'mixed', contentPreference: inactiveStyleValue }, token),
          400,
          'admin.couplePreferencesInvalid',
        );
      });

      const updated = await expectJson<{ couple: { id: string; relationshipType: string; contentPreference: string; }; }>(
        await apiPatchRaw(request, `/api/admin/couples/${coupleId}/preferences`, { relationshipType: 'long_distance', contentPreference: 'deep' }, token),
      );
      await test.step('Verify valid preference update', async () => {
        expect(updated.couple).toEqual(
          expect.objectContaining({
            id: coupleId,
            relationshipType: 'long_distance',
            contentPreference: 'deep',
          }),
        );
      });
    });
  });
});

