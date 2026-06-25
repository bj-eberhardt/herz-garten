import { expect, test } from '@playwright/test';
import { adminLogin } from '../../helpers/adminApi';
import { apiGet, apiGetRaw, apiPatchRaw, apiPostRaw, setupCoupleByApi } from '../../helpers/api';
import { expectApiError, expectJson } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('admin api / taxonomies', () => {
  test('manages preference taxonomies category matches and couple preferences', async ({ request }) => {
    await test.step('Flow: manages preference taxonomies category matches and couple preferences', async () => {
      const token = await adminLogin(request);
      const suffix = testRunId().replaceAll('-', '_');
      const relationshipValue = `admin_rel_${suffix}`;
      const styleValue = `admin_style_${suffix}`;
      const categoryValue = `admin_quest_match_${suffix}`;

      const relationshipResponse = await apiPostRaw(
        request,
        '/api/admin/relationship-modes',
        {
          value: relationshipValue,
          label: `Admin Beziehung ${suffix}`,
          active: true,
          sortOrder: 1,
          translations: { de: { label: `Admin Beziehung ${suffix}` }, en: { label: `Admin Relationship ${suffix}` } },
        },
        token,
      );
      await test.step('Verify JSON response payload', async () => {
        await expectJson<{ id: string; }>(relationshipResponse, 201);
      });

      const styleResponse = await apiPostRaw(
        request,
        '/api/admin/content-styles',
        {
          value: styleValue,
          label: `Admin Stil ${suffix}`,
          active: true,
          sortOrder: 1,
          translations: { de: { label: `Admin Stil ${suffix}` }, en: { label: `Admin Style ${suffix}` } },
        },
        token,
      );
      await test.step('Verify JSON response payload', async () => {
        await expectJson<{ id: string; }>(styleResponse, 201);
      });

      const categoryResponse = await apiPostRaw(
        request,
        '/api/admin/categories',
        {
          contentType: 'quests',
          value: categoryValue,
          label: `Admin Quest Match ${suffix}`,
          active: true,
          sortOrder: 1,
          relationshipModes: [relationshipValue],
          contentStyles: [styleValue],
          translations: { de: { label: `Admin Quest Match ${suffix}` }, en: { label: `Admin Quest Match EN ${suffix}` } },
        },
        token,
      );
      await test.step('Verify JSON response payload', async () => {
        await expectJson<{ id: string; }>(categoryResponse, 201);
      });

      const invalidCategory = await apiPostRaw(
        request,
        '/api/admin/categories',
        {
          contentType: 'quests',
          value: `invalid_match_${suffix}`,
          label: 'Invalid Match',
          active: true,
          relationshipModes: ['missing_relationship'],
          contentStyles: [],
        },
        token,
      );
      await test.step('Verify API error response', async () => {
        await expectApiError(invalidCategory, 400, 'admin.categoryInvalid');
      });

      const questResponse = await apiPostRaw(
        request,
        '/api/admin/content/quests',
        {
          title: `Admin Matched Quest ${suffix}`,
          description: 'Diese Aufgabe sollte nach oben sortiert werden.',
          category: categoryValue,
          estimatedMinutes: 5,
          effortLevel: 'low',
          rewardPoints: 3,
          requiresBothPartners: false,
          active: true,
        },
        token,
      );
      await test.step('Verify JSON response payload', async () => {
        await expectJson<{ id: string; }>(questResponse, 201);
      });

      const setup = await setupCoupleByApi(
        request,
        testUser('admin-pref-a', suffix),
        testUser('admin-pref-b', suffix),
      );
      const couples = await apiGet<{ items: Array<{ id: string; inviteCode: string; }>; }>(
        request,
        `/api/admin/couples?search=${setup.inviteCode}`,
        token,
      );
      const coupleId = couples.items[0].id;

      const updatedCouple = await expectJson<{ couple: { relationshipType: string; contentPreference: string; }; }>(
        await apiPatchRaw(
          request,
          `/api/admin/couples/${coupleId}/preferences`,
          { relationshipType: relationshipValue, contentPreference: styleValue },
          token,
        ),
      );
      await test.step('Verify expected result', async () => {
        expect(updatedCouple.couple.relationshipType).toBe(relationshipValue);
      });
      await test.step('Verify expected result', async () => {
        expect(updatedCouple.couple.contentPreference).toBe(styleValue);
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPatchRaw(
            request,
            `/api/admin/couples/${coupleId}/preferences`,
            { relationshipType: 'missing_relationship', contentPreference: styleValue },
            token,
          ),
          400,
          'admin.couplePreferencesInvalid',
        );
      });

      const quests = await apiGet<{ quests: Array<{ title: string; category: string; }>; }>(request, '/api/quests', setup.partnerA.token);
      await test.step('Verify expected result', async () => {
        expect(quests.quests[0]).toEqual(expect.objectContaining({ title: `Admin Matched Quest ${suffix}`, category: categoryValue }));
      });

      const configResponse = await apiGetRaw(request, '/api/config/preferences', undefined, { 'Accept-Language': 'en' });
      const config = await expectJson<{ relationshipModes: Array<{ value: string; label: string; }>; contentStyles: Array<{ value: string; label: string; }>; }>(
        configResponse,
      );
      await test.step('Verify expected result', async () => {
        expect(config.relationshipModes).toEqual(
          expect.arrayContaining([expect.objectContaining({ value: relationshipValue, label: `Admin Relationship ${suffix}` })]),
        );
      });
      await test.step('Verify expected result', async () => {
        expect(config.contentStyles).toEqual(
          expect.arrayContaining([expect.objectContaining({ value: styleValue, label: `Admin Style ${suffix}` })]),
        );
      });
    });
  });
});
