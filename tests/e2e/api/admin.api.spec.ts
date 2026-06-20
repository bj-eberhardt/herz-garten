import { expect, test, type APIRequestContext } from '@playwright/test';
import { apiDeleteRaw, apiGet, apiGetRaw, apiPatchRaw, apiPost, apiPostRaw, registerByApi, setupCoupleByApi } from '../helpers/api';
import { expectApiError, expectJson } from '../helpers/apiAssertions';
import { runDbSql } from '../helpers/db';
import { testRunId, testUser } from '../helpers/testUsers';

const apiBaseURL = process.env.E2E_API_URL ?? 'http://localhost:3001';

async function adminLogin(request: APIRequestContext) {
  const response = await apiPostRaw(request, '/api/admin/auth/login', { password: 'admin' });
  const payload = await expectJson<{ token: string; usesDefaultAdminPassword: boolean }>(response);
  expect(payload.token).toBeTruthy();
  return payload.token;
}

function jwtPayload(token: string) {
  const payload = token.split('.')[1];
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { iat: number; exp: number };
}

function emailSettingsInput<T extends { smtpPasswordConfigured?: boolean }>(settings: T) {
  const { smtpPasswordConfigured: _smtpPasswordConfigured, ...input } = settings;
  return input;
}

function pngHeader(width: number, height: number) {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52,
    (width >> 24) & 0xff, (width >> 16) & 0xff, (width >> 8) & 0xff, width & 0xff,
    (height >> 24) & 0xff, (height >> 16) & 0xff, (height >> 8) & 0xff, height & 0xff,
    0x08, 0x06, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4e, 0x44,
    0xae, 0x42, 0x60, 0x82,
  ]);
}

function gardenLevelMultipart(input: { name: string; pointsToNext?: number | null; accent?: string; translations?: unknown; image?: Buffer }) {
  return {
    name: input.name,
    pointsToNext: input.pointsToNext === null || input.pointsToNext === undefined ? '' : String(input.pointsToNext),
    accent: input.accent ?? '#8fb66b',
    translations: JSON.stringify(input.translations ?? {}),
    ...(input.image
      ? {
          backgroundImage: {
            name: 'background.png',
            mimeType: 'image/png',
            buffer: input.image,
          },
        }
      : {}),
  };
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

  test('manages auth settings and applies jwt ttl to new tokens', async ({ request }) => {
    const token = await adminLogin(request);
    const original = await apiGet<{
      auth: { adminJwtTtlMinutes: number; userJwtTtlMinutes: number };
      server: { publicBaseUrl: string };
      passwordReset: { ttlMinutes: number; limitPer24h: number };
      email: {
        enabled: boolean;
        smtpHost: string;
        smtpPort: number;
        smtpSecure: boolean;
        smtpUser: string;
        smtpPasswordConfigured: boolean;
        fromAddress: string;
        fromName: string;
        replyTo: string;
      };
    }>(request, '/api/admin/settings', token);

    expect(original.auth.adminJwtTtlMinutes).toBeGreaterThanOrEqual(1);
    expect(original.auth.adminJwtTtlMinutes).toBeLessThanOrEqual(1440);
    expect(original.auth.userJwtTtlMinutes).toBeGreaterThanOrEqual(1);
    expect(original.auth.userJwtTtlMinutes).toBeLessThanOrEqual(43200);
    const originalEmailInput = emailSettingsInput(original.email);

    const invalidSettingsPayloads = [
      {},
      { auth: {} },
      { auth: { userJwtTtlMinutes: original.auth.userJwtTtlMinutes } },
      { auth: { adminJwtTtlMinutes: original.auth.adminJwtTtlMinutes } },
      { auth: { adminJwtTtlMinutes: 0, userJwtTtlMinutes: original.auth.userJwtTtlMinutes }, server: original.server, passwordReset: original.passwordReset, email: originalEmailInput },
      { auth: { adminJwtTtlMinutes: -1, userJwtTtlMinutes: original.auth.userJwtTtlMinutes }, server: original.server, passwordReset: original.passwordReset, email: originalEmailInput },
      { auth: { adminJwtTtlMinutes: 60.5, userJwtTtlMinutes: original.auth.userJwtTtlMinutes }, server: original.server, passwordReset: original.passwordReset, email: originalEmailInput },
      { auth: { adminJwtTtlMinutes: 1441, userJwtTtlMinutes: original.auth.userJwtTtlMinutes }, server: original.server, passwordReset: original.passwordReset, email: originalEmailInput },
      { auth: { adminJwtTtlMinutes: original.auth.adminJwtTtlMinutes, userJwtTtlMinutes: 0 }, server: original.server, passwordReset: original.passwordReset, email: originalEmailInput },
      { auth: { adminJwtTtlMinutes: original.auth.adminJwtTtlMinutes, userJwtTtlMinutes: -1 }, server: original.server, passwordReset: original.passwordReset, email: originalEmailInput },
      { auth: { adminJwtTtlMinutes: original.auth.adminJwtTtlMinutes, userJwtTtlMinutes: 60.5 }, server: original.server, passwordReset: original.passwordReset, email: originalEmailInput },
      { auth: { adminJwtTtlMinutes: original.auth.adminJwtTtlMinutes, userJwtTtlMinutes: 43201 }, server: original.server, passwordReset: original.passwordReset, email: originalEmailInput },
      { auth: original.auth, server: { publicBaseUrl: 'not-a-url' }, passwordReset: original.passwordReset, email: originalEmailInput },
      { auth: original.auth, server: original.server, passwordReset: { ...original.passwordReset, ttlMinutes: 1441 }, email: originalEmailInput },
      { auth: original.auth, server: original.server, passwordReset: { ...original.passwordReset, limitPer24h: 0 }, email: originalEmailInput },
      { auth: original.auth, server: original.server, passwordReset: original.passwordReset, email: { ...originalEmailInput, enabled: true, smtpHost: '' } },
      { auth: original.auth, server: original.server, passwordReset: original.passwordReset, email: { ...originalEmailInput, smtpPort: 0 } },
      { auth: original.auth, server: original.server, passwordReset: original.passwordReset, email: { ...originalEmailInput, enabled: true, fromAddress: '' } },
      { auth: original.auth, server: original.server, passwordReset: original.passwordReset, email: { ...originalEmailInput, replyTo: 'not-an-email' } },
    ];

    for (const payload of invalidSettingsPayloads) {
      await expectApiError(await apiPatchRaw(request, '/api/admin/settings', payload, token), 400, 'common.validation');
    }

    const next = {
      auth: {
        adminJwtTtlMinutes: 61,
        userJwtTtlMinutes: 10081,
      },
      server: {
        publicBaseUrl: 'http://localhost:5174',
      },
      passwordReset: {
        ttlMinutes: 1440,
        limitPer24h: 5,
      },
      email: {
        ...originalEmailInput,
        enabled: true,
        smtpHost: 'mailpit',
        smtpPort: 1025,
        smtpSecure: false,
        fromAddress: 'noreply@herzgarten.test',
        fromName: 'Herzgarten',
        replyTo: '',
      },
    };

    try {
      const saved = await expectJson<typeof next>(await apiPatchRaw(request, '/api/admin/settings', next, token));
      expect(saved).toEqual({ ...next, email: { ...next.email, smtpPasswordConfigured: expect.any(Boolean) } });
      expect('smtpPassword' in saved.email).toBe(false);

      const adminToken = await adminLogin(request);
      const adminPayload = jwtPayload(adminToken);
      expect(adminPayload.exp - adminPayload.iat).toBe(61 * 60);

      const auth = await registerByApi(request, testUser('settings-ttl-user', testRunId()));
      const userPayload = jwtPayload(auth.token);
      expect(userPayload.exp - userPayload.iat).toBe(10081 * 60);

      const audit = await apiGet<{ items: Array<{ action: string; resourceType: string }> }>(
        request,
        '/api/admin/audit-log',
        token,
      );
      expect(audit.items.some((entry) => entry.action === 'update' && entry.resourceType === 'app-settings')).toBe(true);
    } finally {
      await apiPatchRaw(request, '/api/admin/settings', { auth: original.auth, server: original.server, passwordReset: original.passwordReset, email: originalEmailInput }, token);
    }
  });

  test('lists overview, users and couples without private text content and exports csv', async ({ request }) => {
    const runId = testRunId();
    const userA = testUser('admin-list-a', runId);
    const userB = testUser('admin-list-b', runId);
    const setup = await setupCoupleByApi(request, userA, userB);
    await apiPostRaw(request, '/api/today/answer', { answerText: 'private answer text' }, setup.partnerA.token);
    await apiPostRaw(request, '/api/love-jar', { text: 'private jar note one', category: 'compliment' }, setup.partnerA.token);
    await apiPostRaw(request, '/api/love-jar', { text: 'private jar note two', category: 'compliment' }, setup.partnerB.token);

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
    const couplesPayload = await expectJson<{ items: Array<{ id: string; inviteCode: string; members: unknown[] }> }>(couplesResponse);
    expect(couplesPayload.items[0]?.inviteCode).toBe(setup.inviteCode);
    expect(couplesPayload.items[0]?.members).toHaveLength(2);
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

  test('lists a one-member couple once even when joined content creates many rows', async ({ request }) => {
    const runId = testRunId();
    const owner = await registerByApi(request, testUser('admin-one-member-couple', runId));
    const couple = await apiPost<{ couple: { id: string; inviteCode: string; memberCount: number } }>(
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

    const token = await adminLogin(request);
    const couplesResponse = await apiGetRaw(request, `/api/admin/couples?search=${couple.couple.inviteCode}`, token);
    const payload = await expectJson<{
      items: Array<{
        id: string;
        inviteCode: string;
        members: Array<{ email: string }>;
        dailyAnswerCount: number;
        loveJarNoteCount: number;
        knowMeRoundCount: number;
      }>;
    }>(couplesResponse);

    expect(payload.items).toHaveLength(1);
    expect(payload.items[0]).toEqual(
      expect.objectContaining({
        id: couple.couple.id,
        inviteCode: couple.couple.inviteCode,
        dailyAnswerCount: 1,
        loveJarNoteCount: 2,
        knowMeRoundCount: 0,
      }),
    );
    expect(payload.items[0].members).toHaveLength(1);
    expect(payload.items[0].members[0].email).toBe(owner.user.email);
    expect(JSON.stringify(payload)).not.toContain('private one-member answer');
    expect(JSON.stringify(payload)).not.toContain('private one-member note');
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
    const coupleJoinedTitle = listed.items.find((item) => item.key === 'notifications.titles.coupleJoined');
    const coupleJoinedBody = listed.items.find((item) => item.key === 'notifications.bodies.coupleJoined');
    expect(coupleJoinedTitle).toBeTruthy();
    expect(coupleJoinedTitle!.requiredParams).toEqual(['name']);
    expect(coupleJoinedTitle!.translations.de.text).toBe('Dein Partner ist da');
    expect(coupleJoinedBody).toBeTruthy();
    expect(coupleJoinedBody!.requiredParams).toEqual(['name']);
    expect(coupleJoinedBody!.translations.de.text).toBe(
      'Toll, {name} hat deinen Paarraum betreten. Ihr könnt nun gemeinsam an eurem Garten arbeiten.',
    );

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

  test('manages email message templates and validates placeholders', async ({ request }) => {
    const token = await adminLogin(request);
    const key = 'emails.passwordReset.body';
    const listed = await apiGet<{
      items: Array<{ key: string; namespace: string; requiredParams: string[]; translations: Record<string, { text: string }> }>;
    }>(request, '/api/admin/message-templates?namespace=email', token);
    const template = listed.items.find((item) => item.key === key);
    expect(template).toBeTruthy();
    expect(template!.namespace).toBe('email');
    expect(template!.requiredParams.sort()).toEqual(['displayName', 'expiresInMinutes', 'resetUrl']);
    const originalText = template!.translations.de.text;

    await expectApiError(
      await apiPatchRaw(
        request,
        `/api/admin/message-templates/${key}`,
        { translations: { de: { text: 'Hallo {displayName}, dein Link ist {resetUrl}.' } } },
        token,
      ),
      400,
      'admin.messageTemplateInvalid',
    );

    const customText = 'Hallo {displayName}, dein Link ist {resetUrl} und gilt {expiresInMinutes} Minuten.';
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
    } finally {
      await apiPatchRaw(
        request,
        `/api/admin/message-templates/${key}`,
        { translations: { de: { text: originalText } } },
        token,
      );
    }
  });

  test('lists push message templates', async ({ request }) => {
    const token = await adminLogin(request);
    const listed = await apiGet<{
      items: Array<{ key: string; namespace: string; requiredParams: string[]; translations: Record<string, { text: string }> }>;
    }>(request, '/api/admin/message-templates?namespace=push', token);
    const questPush = listed.items.find((item) => item.key === 'push.bodies.questWaitingConfirmation');
    const testPush = listed.items.find((item) => item.key === 'push.bodies.test');
    expect(questPush).toBeTruthy();
    expect(questPush!.namespace).toBe('push');
    expect(questPush!.requiredParams.sort()).toEqual(['name', 'title']);
    expect(questPush!.translations.de.text).toContain('{name}');
    expect(testPush?.translations.de.text).toBe('Push-Benachrichtigungen sind aktiv.');
  });

  test('manages garden levels and recalculates existing gardens', async ({ request }) => {
    const token = await adminLogin(request);
    const sqlLiteral = (value: string) => `'${value.replace(/'/g, "''")}'`;
    const listed = await apiGet<{
      items: Array<{ id: string; stage: number; name: string; pointsToNext: number | null; minimumPoints: number; accent: string }>;
    }>(request, '/api/admin/garden/levels', token);
    expect(listed.items.length).toBeGreaterThanOrEqual(10);
    expect(listed.items[0]).toMatchObject({ stage: 1, minimumPoints: 0 });
    expect(listed.items[0]).toEqual(expect.objectContaining({ areaKey: expect.any(String), backgroundImage: expect.any(String), accent: expect.any(String) }));
    const stageOne = listed.items.find((item) => item.stage === 1)!;
    const originalStageOnePoints = stageOne.pointsToNext;

    const invalid = await request.post(`${apiBaseURL}/api/admin/garden/levels`, {
      multipart: gardenLevelMultipart({ name: '', pointsToNext: -1, image: pngHeader(700, 520) }),
      headers: { Authorization: `Bearer ${token}` },
    });
    await expectApiError(invalid, 400, 'admin.gardenLevel.nameRequired');

    const invalidSize = await request.post(`${apiBaseURL}/api/admin/garden/levels`, {
      multipart: gardenLevelMultipart({ name: 'Wrong size', pointsToNext: 150, image: pngHeader(10, 10) }),
      headers: { Authorization: `Bearer ${token}` },
    });
    await expectApiError(invalidSize, 400, 'admin.upload.invalidDimensions');

    const created = await expectJson<{
      id: string;
      items: Array<{ id: string; stage: number; pointsToNext: number | null; backgroundImage: string }>;
    }>(
      await request.post(`${apiBaseURL}/api/admin/garden/levels`, {
        multipart: gardenLevelMultipart({
          name: `Admin Garden ${testRunId()}`,
          pointsToNext: 150,
          accent: '#123456',
          translations: { de: { name: 'Admin Garten' }, en: { name: 'Admin Garden' } },
          image: pngHeader(700, 520),
        }),
        headers: { Authorization: `Bearer ${token}` },
      }),
      201,
    );
    expect(created.id).toBeTruthy();
    expect(created.items.at(-1)?.pointsToNext).toBeNull();
    expect(created.items.at(-1)).toEqual(expect.objectContaining({ backgroundImage: expect.stringMatching(/^\/uploads\/garden-backgrounds\//) }));

    await expectJson(await apiDeleteRaw(request, `/api/admin/garden/levels/${created.id}`, token));

    const runId = testRunId();
    const setup = await setupCoupleByApi(request, testUser('admin-garden-a', runId), testUser('admin-garden-b', runId));
    const couples = await apiGet<{ items: Array<{ id: string; inviteCode: string }> }>(
      request,
      `/api/admin/couples?search=${setup.inviteCode}`,
      token,
    );
    const coupleId = couples.items[0].id;
    runDbSql(`
      update couples set heart_points = 300, garden_stage = 10 where id = ${sqlLiteral(coupleId)};
      insert into garden_objects (
        id, couple_id, type, source_type, label, area_key, asset_key, position_x, position_y, z_index, placed_by_user, reward_points, level, created_at
      )
      values (
        '00000000-0000-0000-0000-000000000101', ${sqlLiteral(coupleId)}, 'decoration', 'milestone', 'First reward',
        'garden_fest', 'garden_decor', 21, 61, 7, false, 40, 1, '2026-01-01T00:00:01Z'
      ),
      (
        '00000000-0000-0000-0000-000000000102', ${sqlLiteral(coupleId)}, 'decoration', 'milestone', 'Boundary reward',
        'garden_fest', 'garden_decor', 42, 62, 8, true, 40, 1, '2026-01-01T00:00:02Z'
      ),
      (
        '00000000-0000-0000-0000-000000000103', ${sqlLiteral(coupleId)}, 'decoration', 'milestone', 'Zero reward',
        'garden_fest', 'garden_decor', 63, 63, 9, true, 0, 1, '2026-01-01T00:00:03Z'
      ),
      (
        '00000000-0000-0000-0000-000000000104', ${sqlLiteral(coupleId)}, 'decoration', 'milestone', 'Later reward',
        'garden_fest', 'garden_decor', 84, 64, 10, false, 220, 1, '2026-01-01T00:00:04Z'
      );
    `);

    try {
      await expectJson(
        await request.patch(`${apiBaseURL}/api/admin/garden/levels/${stageOne.id}`, {
          multipart: gardenLevelMultipart({
            name: stageOne.name,
            pointsToNext: 80,
            accent: stageOne.accent,
            translations: { de: { name: stageOne.name } },
          }),
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      const garden = await apiGet<{
        couple: { gardenStage: number; heartPoints: number };
        areas: Array<{ key: string; startX: number; width: number; backgroundImage: string; accent: string }>;
        assetCatalog: Array<{ key: string; image: string; active: boolean }>;
        objects: Array<{ label: string; areaKey: string; positionX: number; positionY: number; zIndex: number; placedByUser: boolean }>;
      }>(request, '/api/garden', setup.partnerA.token);
      expect(garden.couple.heartPoints).toBe(300);
      expect(garden.couple.gardenStage).toBe(3);
      expect(garden.areas[0]).toMatchObject({ startX: 0, width: 700, backgroundImage: expect.any(String), accent: expect.any(String) });
      expect(garden.areas[1]).toMatchObject({ startX: 700, width: 700 });
      expect(garden.assetCatalog.some((asset) => asset.key === 'garden_decor')).toBeTruthy();
      expect(garden.objects.find((object) => object.label === 'First reward')).toMatchObject({
        areaKey: 'heart_bed',
        positionX: 21,
        positionY: 61,
        zIndex: 7,
        placedByUser: false,
      });
      expect(garden.objects.find((object) => object.label === 'Boundary reward')).toMatchObject({
        areaKey: 'flower_meadow',
        positionX: 42,
        positionY: 62,
        zIndex: 8,
        placedByUser: false,
      });
      expect(garden.objects.find((object) => object.label === 'Zero reward')).toMatchObject({
        areaKey: 'flower_meadow',
        positionX: 63,
        positionY: 63,
        zIndex: 9,
        placedByUser: false,
      });
      expect(garden.objects.find((object) => object.label === 'Later reward')).toMatchObject({
        areaKey: 'bench_grove',
        positionX: 84,
        positionY: 64,
        zIndex: 10,
        placedByUser: false,
      });
    } finally {
      await request.patch(`${apiBaseURL}/api/admin/garden/levels/${stageOne.id}`, {
        multipart: gardenLevelMultipart({
          name: stageOne.name,
          pointsToNext: originalStageOnePoints,
          accent: stageOne.accent,
          translations: { de: { name: stageOne.name } },
        }),
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  });

  test('manages garden assets with uploaded images', async ({ request }) => {
    const token = await adminLogin(request);
    const key = `asset_${testRunId().replaceAll('-', '_')}`;

    const listed = await apiGet<{ items: Array<{ key: string; image: string; active: boolean }> }>(request, '/api/admin/garden/assets', token);
    expect(listed.items.some((item) => item.key === 'conversation_flower')).toBeTruthy();

    const missingImage = await request.post(`${apiBaseURL}/api/admin/garden/assets`, {
      multipart: {
        key,
        label: 'Missing image',
        sourceTypes: JSON.stringify(['quest']),
        stageUnlock: '1',
        anchorX: '0.5',
        anchorY: '0.9',
        active: 'true',
        sortOrder: '999',
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    await expectApiError(missingImage, 400, 'admin.gardenAsset.imageRequired');

    const created = await expectJson<{ item: { key: string; image: string; width: number; height: number; active: boolean } }>(
      await request.post(`${apiBaseURL}/api/admin/garden/assets`, {
        multipart: {
          key,
          label: 'Uploaded asset',
          sourceTypes: JSON.stringify(['quest']),
          stageUnlock: '1',
          anchorX: '0.5',
          anchorY: '0.9',
          active: 'true',
          sortOrder: '999',
          image: {
            name: 'asset.png',
            mimeType: 'image/png',
            buffer: pngHeader(64, 80),
          },
        },
        headers: { Authorization: `Bearer ${token}` },
      }),
      201,
    );
    expect(created.item).toMatchObject({ key, image: expect.stringMatching(/^\/uploads\/garden-assets\//), width: 64, height: 80 });

    const updated = await expectJson<{ item: { key: string; active: boolean; label: string } }>(
      await request.patch(`${apiBaseURL}/api/admin/garden/assets/${key}`, {
        multipart: {
          label: 'Inactive uploaded asset',
          sourceTypes: JSON.stringify(['quest']),
          stageUnlock: '1',
          anchorX: '0.5',
          anchorY: '0.9',
          active: 'false',
          sortOrder: '999',
        },
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(updated.item).toMatchObject({ key, active: false, label: 'Inactive uploaded asset' });
  });
});
