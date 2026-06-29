import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test';
import { adminLogin } from '../../helpers/adminApi';
import { apiGet, apiGetRaw, apiPatchRaw, apiPostRaw, setupCoupleByApi } from '../../helpers/api';
import { expectApiError, expectJson } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

type PreferenceKind = 'relationship-modes' | 'content-styles';

interface PreferenceItem {
  id: string;
  value: string;
  label: string;
  defaultLabel: string;
  active: boolean;
  sortOrder: number;
  translations: Record<string, { label: string }>;
}

interface PreferenceListPayload {
  items: PreferenceItem[];
}

interface PreferenceMutationPayload extends PreferenceListPayload {
  id: string;
}

const kinds: Array<{ kind: PreferenceKind; configKey: 'relationshipModes' | 'contentStyles'; label: string }> = [
  { kind: 'relationship-modes', configKey: 'relationshipModes', label: 'relationship mode' },
  { kind: 'content-styles', configKey: 'contentStyles', label: 'content style' },
];

function preferencePayload(value: string, overrides: Partial<{
  active: boolean;
  sortOrder: number;
  translations: Record<string, { label?: string }>;
}> = {}) {
  return {
    value,
    active: overrides.active ?? true,
    sortOrder: overrides.sortOrder ?? 10,
    translations: overrides.translations ?? {
      de: { label: `DE ${value}` },
      en: { label: `EN ${value}` },
    },
  };
}

async function createPreference(request: APIRequestContext, kind: PreferenceKind, token: string, value: string, overrides = {}) {
  return expectJson<PreferenceMutationPayload>(await apiPostRaw(request, `/api/admin/${kind}`, preferencePayload(value, overrides), token), 201);
}

async function expectDefaultTranslationMissing(response: APIResponse) {
  const payload = await expectApiError(response, 400, 'admin.defaultTranslationMissing');
  expect(payload.error).toBe('Default Translation "de" is missing');
  expect(payload.params).toEqual(expect.objectContaining({ locale: 'de' }));
}

function expectPreference(items: PreferenceItem[], value: string) {
  const item = items.find((candidate) => candidate.value === value);
  expect(item).toBeTruthy();
  return item!;
}

test.describe('admin api / taxonomies', () => {
  test('manages relationship modes and content styles with localized labels', async ({ request }) => {
    const token = await adminLogin(request);
    const suffix = testRunId().replaceAll('-', '_');

    for (const { kind } of kinds) {
      const value = `${kind.replace('-', '_')}_${suffix}`;
      const created = await createPreference(request, kind, token, value, {
        sortOrder: 17,
        translations: { de: { label: `Deutsch ${suffix}` }, en: { label: `English ${suffix}` } },
      });
      const createdItem = expectPreference(created.items, value);
      expect(createdItem).toEqual(expect.objectContaining({ value, label: `Deutsch ${suffix}`, active: true, sortOrder: 17 }));
      expect(createdItem.translations).toEqual(
        expect.objectContaining({ de: { label: `Deutsch ${suffix}` }, en: { label: `English ${suffix}` } }),
      );

      const englishList = await apiGet<PreferenceListPayload>(request, `/api/admin/${kind}?lang=en`, token);
      expect(expectPreference(englishList.items, value).label).toBe(`English ${suffix}`);

      const patched = await expectJson<PreferenceMutationPayload>(
        await apiPatchRaw(
          request,
          `/api/admin/${kind}/${created.id}`,
          preferencePayload(value, {
            active: false,
            sortOrder: 27,
            translations: { de: { label: `Deutsch bearbeitet ${suffix}` }, en: { label: `English edited ${suffix}` } },
          }),
          token,
        ),
      );
      const patchedItem = expectPreference(patched.items, value);
      expect(patchedItem).toEqual(expect.objectContaining({ value, label: `Deutsch bearbeitet ${suffix}`, active: false, sortOrder: 27 }));

      const config = await expectJson<Record<string, PreferenceItem[]>>(await apiGetRaw(request, '/api/config/preferences', undefined, { 'Accept-Language': 'en' }));
      expect(config[kinds.find((candidate) => candidate.kind === kind)!.configKey].some((item) => item.value === value)).toBe(false);
    }
  });

  test('rejects invalid auth and query parameters', async ({ request }) => {
    const token = await adminLogin(request);
    const validBody = preferencePayload(`auth_query_${testRunId().replaceAll('-', '_')}`);

    for (const { kind } of kinds) {
      await expectApiError(await apiGetRaw(request, `/api/admin/${kind}`), 401, 'auth.missingToken');
      await expectApiError(await apiGetRaw(request, `/api/admin/${kind}`, 'not-a-token'), 401, 'auth.invalidToken');
      await expectApiError(await apiPostRaw(request, `/api/admin/${kind}`, validBody), 401, 'auth.missingToken');
      await expectApiError(await apiPostRaw(request, `/api/admin/${kind}`, validBody, 'not-a-token'), 401, 'auth.invalidToken');
      await expectApiError(await apiPatchRaw(request, `/api/admin/${kind}/not-a-uuid`, validBody), 401, 'auth.missingToken');
      await expectApiError(await apiPatchRaw(request, `/api/admin/${kind}/not-a-uuid`, validBody, 'not-a-token'), 401, 'auth.invalidToken');

      await expectApiError(await apiGetRaw(request, `/api/admin/${kind}?lang=de-DE-extra`, token), 400, 'common.validation');
      await expectApiError(await apiGetRaw(request, `/api/admin/${kind}?unexpected=true`, token), 400, 'common.validation');
      await expectApiError(await apiPostRaw(request, `/api/admin/${kind}?unexpected=true`, validBody, token), 400, 'common.validation');
      await expectApiError(await apiPatchRaw(request, `/api/admin/${kind}/not-a-uuid?unexpected=true`, validBody, token), 400, 'common.validation');
    }
  });

  test('rejects invalid preference payload shapes', async ({ request }) => {
    const token = await adminLogin(request);
    const value = `shape_${testRunId().replaceAll('-', '_')}`;
    const invalidBodies = [
      {},
      { ...preferencePayload(value), extra: true },
      { ...preferencePayload(value), value: 123 },
      { ...preferencePayload(value), label: 123 },
      { ...preferencePayload(value), active: 'true' },
      { ...preferencePayload(value), sortOrder: '1' },
      { ...preferencePayload(value), sortOrder: 1.5 },
      { ...preferencePayload(value), translations: null },
      { ...preferencePayload(value), translations: [] },
      { ...preferencePayload(value), translations: { de: null } },
      { ...preferencePayload(value), translations: { de: { label: 123 } } },
      { ...preferencePayload(value), translations: { de: { label: 'Label', extra: true } } },
      { ...preferencePayload(value), translations: { 'de-extra': { label: 'Label' } } },
    ];

    for (const body of invalidBodies) {
      await expectApiError(await apiPostRaw(request, '/api/admin/relationship-modes', body, token), 400, 'common.validation');
    }
  });

  test('rejects invalid preference content and unknown patch targets', async ({ request }) => {
    const token = await adminLogin(request);
    const suffix = testRunId().replaceAll('-', '_');
    const value = `semantic_${suffix}`;
    await createPreference(request, 'relationship-modes', token, value);

    await test.step('Reject missing default translation with stable error key', async () => {
      await expectDefaultTranslationMissing(
        await apiPostRaw(request, '/api/admin/relationship-modes', preferencePayload(`missing_default_${suffix}`, { translations: { en: { label: 'English only' } } }), token),
      );
    });

    await test.step('Reject legacy label without default translation', async () => {
      await expectDefaultTranslationMissing(
        await apiPostRaw(request, '/api/admin/relationship-modes', { ...preferencePayload(`legacy_label_${suffix}`, { translations: { en: { label: 'English only' } } }), label: 'Legacy label' }, token),
      );
    });

    await test.step('Reject blank default translation with stable error key', async () => {
      await expectDefaultTranslationMissing(
        await apiPostRaw(request, '/api/admin/relationship-modes', preferencePayload(`empty_default_${suffix}`, { translations: { de: { label: ' ' } } }), token),
      );
    });

    for (const { name, body } of [
      { name: 'empty value', body: { ...preferencePayload(''), value: '' } },
      { name: 'missing value', body: { ...preferencePayload('missing_value'), value: undefined } },
      { name: 'hyphen value', body: preferencePayload(`invalid-hyphen-${suffix}`) },
      { name: 'overlong value', body: preferencePayload(`toolong_${'x'.repeat(101)}`) },
      { name: 'unsupported locale', body: preferencePayload(`unsupported_locale_${suffix}`, { translations: { de: { label: 'Deutsch' }, xx: { label: 'Unsupported' } } }) },
    ]) {
      await test.step(`Reject ${name}`, async () => {
        await expectApiError(await apiPostRaw(request, '/api/admin/relationship-modes', body, token), 400, 'admin.preferenceInvalid');
      });
    }

    await expectApiError(await apiPostRaw(request, '/api/admin/relationship-modes', preferencePayload(value), token), 409, 'admin.preferenceExists');
    await expectApiError(
      await apiPatchRaw(request, '/api/admin/relationship-modes/not-a-uuid', preferencePayload(value), token),
      404,
      'admin.preferenceNotFound',
    );
    await expectApiError(
      await apiPatchRaw(request, '/api/admin/relationship-modes/00000000-0000-4000-8000-000000000000', preferencePayload(value), token),
      404,
      'admin.preferenceNotFound',
    );

    const created = await apiGet<PreferenceListPayload>(request, '/api/admin/relationship-modes', token);
    const existing = expectPreference(created.items, value);
    await expectApiError(
      await apiPatchRaw(request, `/api/admin/relationship-modes/${existing.id}`, preferencePayload(`changed_${suffix}`), token),
      400,
      'admin.preferenceInvalid',
    );
  });

  test('uses active taxonomies for categories, couple preferences and quest ordering', async ({ request }) => {
    const token = await adminLogin(request);
    const suffix = testRunId().replaceAll('-', '_');
    const relationshipValue = `admin_rel_${suffix}`;
    const inactiveRelationshipValue = `admin_rel_inactive_${suffix}`;
    const styleValue = `admin_style_${suffix}`;
    const categoryValue = `admin_quest_match_${suffix}`;

    await createPreference(request, 'relationship-modes', token, relationshipValue, {
      translations: { de: { label: `Admin Beziehung ${suffix}` }, en: { label: `Admin Relationship ${suffix}` } },
    });
    await createPreference(request, 'relationship-modes', token, inactiveRelationshipValue, {
      active: false,
      translations: { de: { label: `Inaktiv ${suffix}` }, en: { label: `Inactive ${suffix}` } },
    });
    await createPreference(request, 'content-styles', token, styleValue, {
      translations: { de: { label: `Admin Stil ${suffix}` }, en: { label: `Admin Style ${suffix}` } },
    });

    await expectApiError(
      await apiPostRaw(
        request,
        '/api/admin/categories',
        {
          contentType: 'quests',
          value: `invalid_match_${suffix}`,
          active: true,
          sortOrder: 1,
          relationshipModes: ['missing_relationship'],
          contentStyles: [],
          translations: { de: { label: 'Invalid Match' } },
        },
        token,
      ),
      400,
      'admin.categoryInvalid',
    );

    await expectJson<{ id: string }>(
      await apiPostRaw(
        request,
        '/api/admin/categories',
        {
          contentType: 'quests',
          value: categoryValue,
          active: true,
          sortOrder: 1,
          relationshipModes: [relationshipValue],
          contentStyles: [styleValue],
          translations: { de: { label: `Admin Quest Match ${suffix}` }, en: { label: `Admin Quest Match EN ${suffix}` } },
        },
        token,
      ),
      201,
    );

    await expectJson<{ id: string }>(
      await apiPostRaw(
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
      ),
      201,
    );

    const setup = await setupCoupleByApi(request, testUser('admin-pref-a', suffix), testUser('admin-pref-b', suffix));
    const couples = await apiGet<{ items: Array<{ id: string; inviteCode: string }> }>(request, `/api/admin/couples?search=${setup.inviteCode}`, token);
    const coupleId = couples.items[0].id;

    const updatedCouple = await expectJson<{ couple: { relationshipType: string; contentPreference: string } }>(
      await apiPatchRaw(request, `/api/admin/couples/${coupleId}/preferences`, { relationshipType: relationshipValue, contentPreference: styleValue }, token),
    );
    expect(updatedCouple.couple.relationshipType).toBe(relationshipValue);
    expect(updatedCouple.couple.contentPreference).toBe(styleValue);

    await expectApiError(
      await apiPatchRaw(request, `/api/admin/couples/${coupleId}/preferences`, { relationshipType: inactiveRelationshipValue, contentPreference: styleValue }, token),
      400,
      'admin.couplePreferencesInvalid',
    );

    const quests = await apiGet<{ quests: Array<{ title: string; category: string }> }>(request, '/api/quests', setup.partnerA.token);
    expect(quests.quests[0]).toEqual(expect.objectContaining({ title: `Admin Matched Quest ${suffix}`, category: categoryValue }));

    const config = await expectJson<{ relationshipModes: PreferenceItem[]; contentStyles: PreferenceItem[] }>(
      await apiGetRaw(request, '/api/config/preferences', undefined, { 'Accept-Language': 'en' }),
    );
    expect(config.relationshipModes).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: relationshipValue, label: `Admin Relationship ${suffix}` })]),
    );
    expect(config.relationshipModes.some((item) => item.value === inactiveRelationshipValue)).toBe(false);
    expect(config.contentStyles).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: styleValue, label: `Admin Style ${suffix}` })]),
    );
  });
});
