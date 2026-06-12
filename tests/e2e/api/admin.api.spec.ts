import { expect, test, type APIRequestContext } from '@playwright/test';
import { apiGet, apiGetRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../helpers/api';
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
});
