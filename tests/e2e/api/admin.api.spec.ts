import { expect, test, type APIRequestContext } from '@playwright/test';
import { apiGet, apiGetRaw, apiPatchRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../helpers/api';
import { expectApiError, expectJson } from '../helpers/apiAssertions';
import { testRunId, testUser } from '../helpers/testUsers';

const apiBaseURL = process.env.E2E_API_URL ?? 'http://localhost:3001';

async function adminLogin(request: APIRequestContext) {
  const response = await apiPostRaw(request, '/api/admin/auth/login', { password: 'admin' });
  const payload = await expectJson<{ token: string; usesDefaultAdminPassword: boolean }>(response);
  expect(payload.token).toBeTruthy();
  return payload.token;
}

test.describe('admin api', () => {
  test('authenticates admin and rejects invalid tokens', async ({ request }) => {
    const token = await adminLogin(request);
    const me = await apiGet<{ admin: boolean; usesDefaultAdminPassword: boolean }>(request, '/api/admin/auth/me', token);
    expect(me.admin).toBe(true);
    expect(me.usesDefaultAdminPassword).toBe(true);
    const meRaw = await apiGetRaw(request, '/api/admin/auth/me', token);
    expect(meRaw.headers()['cache-control']).toContain('no-store');

    const invalidLogin = await apiPostRaw(request, '/api/admin/auth/login', { password: 'wrong-password' });
    await expectApiError(invalidLogin, 401, 'auth.invalidCredentials');

    const missingToken = await apiGetRaw(request, '/api/admin/overview');
    await expectApiError(missingToken, 401, 'auth.missingToken');

    const user = testUser('admin-normal-user', testRunId());
    const auth = await registerByApi(request, user);
    const userTokenResponse = await apiGetRaw(request, '/api/admin/overview', auth.token);
    await expectApiError(userTokenResponse, 401, 'auth.invalidToken');
  });

  test('lists overview, users and couples without private text content and exports csv', async ({ request }) => {
    const runId = testRunId();
    const userA = testUser('admin-list-a', runId);
    const userB = testUser('admin-list-b', runId);
    const setup = await setupCoupleByApi(request, userA, userB);
    await apiPostRaw(request, '/api/today/answer', { answerText: 'private answer text' }, setup.partnerA.token);

    const token = await adminLogin(request);
    const overview = await apiGet<{ userCount: number; coupleCount: number; usesDefaultAdminPassword: boolean }>(
      request,
      '/api/admin/overview',
      token,
    );
    expect(overview.userCount).toBeGreaterThan(0);
    expect(overview.coupleCount).toBeGreaterThan(0);
    expect(overview.usesDefaultAdminPassword).toBe(true);

    const usersResponse = await apiGetRaw(request, `/api/admin/users?search=${encodeURIComponent(userA.email)}`, token);
    const usersPayload = await expectJson<{ items: unknown[] }>(usersResponse);
    expect(JSON.stringify(usersPayload)).toContain(userA.email);
    expect(JSON.stringify(usersPayload)).not.toContain('private answer text');

    const injectedUsersResponse = await apiGetRaw(
      request,
      `/api/admin/users?search=${encodeURIComponent(`%' OR '1'='1`)}`,
      token,
    );
    const injectedUsersPayload = await expectJson<{ items: unknown[]; total: number }>(injectedUsersResponse);
    expect(injectedUsersPayload.items).toHaveLength(0);
    expect(injectedUsersPayload.total).toBe(0);

    const couplesResponse = await apiGetRaw(request, `/api/admin/couples?search=${setup.inviteCode}`, token);
    const couplesPayload = await expectJson<{ items: Array<{ id: string; inviteCode: string }> }>(couplesResponse);
    expect(couplesPayload.items[0]?.inviteCode).toBe(setup.inviteCode);
    expect(JSON.stringify(couplesPayload)).not.toContain('private answer text');

    const injectedCouplesResponse = await apiGetRaw(
      request,
      `/api/admin/couples?search=${encodeURIComponent(`${setup.inviteCode}' OR true --`)}`,
      token,
    );
    const injectedCouplesPayload = await expectJson<{ items: unknown[]; total: number }>(injectedCouplesResponse);
    expect(injectedCouplesPayload.items).toHaveLength(0);
    expect(injectedCouplesPayload.total).toBe(0);

    const detail = await apiGet<{ couple: { dailyAnswerCount: number; members: unknown[] } }>(
      request,
      `/api/admin/couples/${couplesPayload.items[0].id}`,
      token,
    );
    expect(detail.couple.dailyAnswerCount).toBeGreaterThanOrEqual(1);
    expect(detail.couple.members).toHaveLength(2);

    const csvResponse = await apiGetRaw(request, '/api/admin/users?format=csv', token);
    expect(csvResponse.ok()).toBe(true);
    expect(csvResponse.headers()['content-type']).toContain('text/csv');
    expect(await csvResponse.text()).toContain('email');
  });

  test('manages content, writes audit log and serves love jar templates', async ({ request }) => {
    const token = await adminLogin(request);
    const suffix = testRunId();
    const germanCategories = await expectJson<{ items: Array<{ value: string; label: string }> }>(
      await apiGetRaw(request, '/api/admin/categories?type=quests', token, { 'Accept-Language': 'de' }),
    );
    expect(germanCategories.items.find((category) => category.value === 'romance')?.label).toBe('Romantik');
    const englishCategories = await expectJson<{ items: Array<{ value: string; label: string }> }>(
      await apiGetRaw(request, '/api/admin/categories?type=quests', token, { 'Accept-Language': 'en' }),
    );
    expect(englishCategories.items.find((category) => category.value === 'romance')?.label).toBe('Romance');

    const categoryResponse = await apiPostRaw(
      request,
      '/api/admin/categories',
      {
        contentType: 'daily-questions',
        value: `admin_api_${suffix}`.replaceAll('-', '_'),
        label: `Admin API ${suffix}`,
        active: true,
        sortOrder: 1,
        translations: { de: { label: `Admin API ${suffix}` }, en: { label: `Admin API EN ${suffix}` } },
      },
      token,
    );
    const categoryPayload = await expectJson<{ id: string; items: Array<{ id: string; usageCount: number }> }>(
      categoryResponse,
      201,
    );
    expect(categoryPayload.id).toBeTruthy();
    const categoryValue = `admin_api_${suffix}`.replaceAll('-', '_');

    const invalidCategory = await apiPostRaw(
      request,
      '/api/admin/content/daily-questions',
      {
        text: `Invalid category ${suffix}`,
        category: `missing_${suffix}`,
        depthLevel: 1,
        longDistanceSuitable: true,
        active: true,
      },
      token,
    );
    expect(invalidCategory.status()).toBe(400);

    await expectApiError(
      await apiPostRaw(
        request,
        '/api/admin/categories',
        {
          contentType: 'daily-questions',
          value: `admin_extra_${suffix}`.replaceAll('-', '_'),
          label: `Admin Extra ${suffix}`,
          active: true,
          sortOrder: 1,
          unexpected: true,
        },
        token,
      ),
      400,
      'common.validation',
    );

    const createDaily = await apiPostRaw(
      request,
      '/api/admin/content/daily-questions',
      {
        text: `Admin daily ${suffix}`,
        category: categoryValue,
        depthLevel: 1,
        longDistanceSuitable: true,
        active: true,
        translations: {
          de: { text: `Admin daily ${suffix}` },
          en: { text: `Admin daily EN ${suffix}` },
        },
      },
      token,
    );
    const dailyPayload = await expectJson<{ id: string; items: Array<{ id: string; active: boolean }> }>(createDaily, 201);
    expect(dailyPayload.id).toBeTruthy();

    const patchResponse = await request.patch(`${apiBaseURL}/api/admin/content/daily-questions/${dailyPayload.id}`, {
      data: {
        text: `Admin daily ${suffix}`,
        category: categoryValue,
        depthLevel: 1,
        longDistanceSuitable: true,
        active: false,
        translations: { de: { text: `Admin daily ${suffix}` } },
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    const patchPayload = await expectJson<{ items: Array<{ id: string; active: boolean }> }>(patchResponse);
    expect(patchPayload.items.find((item) => item.id === dailyPayload.id)?.active).toBe(false);

    const deleteUsedCategory = await request.delete(`${apiBaseURL}/api/admin/categories/${categoryPayload.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(deleteUsedCategory.status()).toBe(409);

    const unusedCategory = await apiPostRaw(
      request,
      '/api/admin/categories',
      {
        contentType: 'daily-questions',
        value: `unused_${suffix}`.replaceAll('-', '_'),
        label: `Unused ${suffix}`,
        active: true,
        sortOrder: 2,
      },
      token,
    );
    const unusedPayload = await expectJson<{ id: string }>(unusedCategory, 201);
    const deleteUnused = await request.delete(`${apiBaseURL}/api/admin/categories/${unusedPayload.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(deleteUnused.ok()).toBe(true);

    const loveJarResponse = await apiPostRaw(
      request,
      '/api/admin/content/love-jar-templates',
      {
        text: `Admin jar ${suffix}`,
        category: 'compliment',
        active: true,
        sortOrder: 1,
        translations: {
          de: { text: `Admin jar ${suffix}` },
          en: { text: `Admin jar EN ${suffix}` },
        },
      },
      token,
    );
    await expectJson<{ id: string }>(loveJarResponse, 201);

    const audit = await apiGet<{ items: Array<{ action: string; resourceType: string }> }>(
      request,
      '/api/admin/audit-log',
      token,
    );
    expect(audit.items.some((entry) => entry.action === 'create' && entry.resourceType === 'love-jar-templates')).toBe(true);

    const user = testUser('admin-template-user', suffix);
    const auth = await registerByApi(request, user);
    const englishTemplatesResponse = await apiGetRaw(request, '/api/love-jar/templates', auth.token, {
      'Accept-Language': 'en',
    });
    const englishTemplates = await expectJson<{ templates: Array<{ text: string }> }>(englishTemplatesResponse);
    expect(englishTemplates.templates.some((template) => template.text === 'What I love about you is ...')).toBe(true);
    const templates = await apiGet<{ templates: Array<{ text: string }> }>(request, '/api/love-jar/templates', auth.token);
    expect(templates.templates.some((template) => template.text === `Admin jar ${suffix}`)).toBe(true);
  });

  test('manages preference taxonomies category matches and couple preferences', async ({ request }) => {
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
    await expectJson<{ id: string }>(relationshipResponse, 201);

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
    await expectJson<{ id: string }>(styleResponse, 201);

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
    await expectJson<{ id: string }>(categoryResponse, 201);

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
    await expectApiError(invalidCategory, 400, 'admin.categoryInvalid');

    const questResponse = await apiPostRaw(
      request,
      '/api/admin/content/quests',
      {
        title: `Admin Matched Quest ${suffix}`,
        description: 'Diese Quest sollte nach oben sortiert werden.',
        category: categoryValue,
        estimatedMinutes: 5,
        effortLevel: 'low',
        rewardPoints: 3,
        requiresBothPartners: false,
        active: true,
      },
      token,
    );
    await expectJson<{ id: string }>(questResponse, 201);

    const setup = await setupCoupleByApi(
      request,
      testUser('admin-pref-a', suffix),
      testUser('admin-pref-b', suffix),
    );
    const couples = await apiGet<{ items: Array<{ id: string; inviteCode: string }> }>(
      request,
      `/api/admin/couples?search=${setup.inviteCode}`,
      token,
    );
    const coupleId = couples.items[0].id;

    const updatedCouple = await expectJson<{ couple: { relationshipType: string; contentPreference: string } }>(
      await apiPatchRaw(
        request,
        `/api/admin/couples/${coupleId}/preferences`,
        { relationshipType: relationshipValue, contentPreference: styleValue },
        token,
      ),
    );
    expect(updatedCouple.couple.relationshipType).toBe(relationshipValue);
    expect(updatedCouple.couple.contentPreference).toBe(styleValue);

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

    const quests = await apiGet<{ quests: Array<{ title: string; category: string }> }>(request, '/api/quests', setup.partnerA.token);
    expect(quests.quests[0]).toEqual(expect.objectContaining({ title: `Admin Matched Quest ${suffix}`, category: categoryValue }));

    const configResponse = await apiGetRaw(request, '/api/config/preferences', undefined, { 'Accept-Language': 'en' });
    const config = await expectJson<{ relationshipModes: Array<{ value: string; label: string }>; contentStyles: Array<{ value: string; label: string }> }>(
      configResponse,
    );
    expect(config.relationshipModes).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: relationshipValue, label: `Admin Relationship ${suffix}` })]),
    );
    expect(config.contentStyles).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: styleValue, label: `Admin Style ${suffix}` })]),
    );
  });

  test('manages notification message templates and validates placeholders', async ({ request }) => {
    const token = await adminLogin(request);
    const key = 'notifications.bodies.questWaitingConfirmation';

    const listed = await apiGet<{
      items: Array<{
        key: string;
        requiredParams: string[];
        translations: Record<string, { text: string }>;
      }>;
    }>(request, '/api/admin/message-templates?namespace=notifications', token);
    const template = listed.items.find((item) => item.key === key);
    expect(template).toBeTruthy();
    expect(template!.requiredParams.sort()).toEqual(['name', 'title']);
    const originalText = template!.translations.de.text;

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

    const customText = 'Admin-Test: {name} wartet bei "{title}".';
    try {
      const saved = await expectJson<{ items: Array<{ key: string; translations: Record<string, { text: string }> }> }>(
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
      const questPayload = await apiGet<{ quests: Array<{ id: string; title: string; requiresBothPartners: boolean }> }>(
        request,
        '/api/quests',
        setup.partnerA.token,
      );
      const quest = questPayload.quests.find((item) => item.requiresBothPartners);
      expect(quest).toBeTruthy();

      await expectJson(await apiPostRaw(request, `/api/quests/${quest!.id}/complete`, {}, setup.partnerA.token));
      const notifications = await apiGet<{ notifications: Array<{ body: string; bodyKey: string }> }>(
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
