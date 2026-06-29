import { expect, test, type APIResponse } from '@playwright/test';
import { adminLogin, apiBaseURL } from '../../helpers/adminApi';
import { apiDeleteRaw, apiGet, apiGetRaw, apiPatchRaw, apiPostRaw, registerByApi } from '../../helpers/api';
import { expectApiError, expectJson } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

async function expectDefaultTranslationMissing(response: APIResponse) {
  const payload = await expectApiError(response, 400, 'admin.defaultTranslationMissing');
  expect(payload.error).toBe('Default Translation "de" is missing');
  expect(payload.params).toEqual(expect.objectContaining({ locale: 'de' }));
}

test.describe('admin api / content', () => {
  test('manages content, writes audit log and serves love jar templates', async ({ request }) => {
    let token = '';
    let suffix = '';
    let categoryValue = '';
    let categoryId = '';
    let dailyQuestionId = '';

    await test.step('Authenticate admin and prepare unique content identifiers', async () => {
      token = await adminLogin(request);
      suffix = testRunId();
      categoryValue = `admin_api_${suffix}`.replaceAll('-', '_');
    });

    await test.step('Check and verify german content categories', async () => {
      const germanCategories = await expectJson<{ items: Array<{ value: string; label: string; }>; }>(
        await apiGetRaw(request, '/api/admin/categories?type=quests', token, { 'Accept-Language': 'de' }),
      );      await test.step('Assert: German category label is localized', async () => {
        expect(germanCategories.items.find((category) => category.value === 'romance')?.label).toBe('Romantik');
      });
    });

    await test.step('Check and verify english content categories', async () => {
      const englishCategories = await expectJson<{ items: Array<{ value: string; label: string; }>; }>(
        await apiGetRaw(request, '/api/admin/categories?type=quests', token, { 'Accept-Language': 'en' }),
      );      await test.step('Assert: English category label is localized', async () => {
        expect(englishCategories.items.find((category) => category.value === 'romance')?.label).toBe('Romance');
      });
    });

    await test.step('Create a daily-question category and verify validation errors', async () => {
      const categoryResponse = await apiPostRaw(
        request,
        '/api/admin/categories',
        {
          contentType: 'daily-questions',
          value: categoryValue,
          active: true,
          sortOrder: 1,
          translations: { de: { label: `Admin API ${suffix}` }, en: { label: `Admin API EN ${suffix}` } },
        },
        token,
      );
      const categoryPayload = await expectJson<{ id: string; items: Array<{ id: string; usageCount: number; }>; }>(
        categoryResponse,
        201,
      );
      categoryId = categoryPayload.id;      await test.step('Assert: category creation returns an id', async () => {
        expect(categoryId).toBeTruthy();
      });

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
      );      await test.step('Assert: response status is 400', async () => {
        expect(invalidCategory.status()).toBe(400);
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(
            request,
            '/api/admin/categories',
            {
              contentType: 'daily-questions',
              value: `admin_extra_${suffix}`.replaceAll('-', '_'),
              active: true,
              sortOrder: 1,
              unexpected: true,
            },
            token,
          ),
          400,
          'common.validation',
        );
      });
    });

    await test.step('Create and deactivate daily-question content', async () => {
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
      const dailyPayload = await expectJson<{ id: string; items: Array<{ id: string; active: boolean; }>; }>(createDaily, 201);
      dailyQuestionId = dailyPayload.id;      await test.step('Assert: daily question creation returns an id', async () => {
        expect(dailyQuestionId).toBeTruthy();
      });

      const patchResponse = await request.patch(`${apiBaseURL}/api/admin/content/daily-questions/${dailyQuestionId}`, {
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
      const patchPayload = await expectJson<{ items: Array<{ id: string; active: boolean; }>; }>(patchResponse);      await test.step('Assert: daily question creation returns an id', async () => {
        expect(patchPayload.items.find((item) => item.id === dailyQuestionId)?.active).toBe(false);
      });
    });

    await test.step('Reject deleting used category and allow deleting unused category', async () => {
      const deleteUsedCategory = await request.delete(`${apiBaseURL}/api/admin/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });      await test.step('Assert: used category deletion is blocked', async () => {
        expect(deleteUsedCategory.status()).toBe(409);
      });

      const unusedCategory = await apiPostRaw(
        request,
        '/api/admin/categories',
        {
          contentType: 'daily-questions',
          value: `unused_${suffix}`.replaceAll('-', '_'),
          translations: { de: { label: `Unused ${suffix}` } },
          active: true,
          sortOrder: 2,
        },
        token,
      );
      const unusedPayload = await expectJson<{ id: string; }>(unusedCategory, 201);
      const deleteUnused = await request.delete(`${apiBaseURL}/api/admin/categories/${unusedPayload.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });      await test.step('Assert: unused category deletion succeeds', async () => {
        expect(deleteUnused.ok()).toBe(true);
      });
    });

    await test.step('Create love-jar template and verify audit log entry', async () => {
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
      await test.step('Verify JSON response payload', async () => {
        await expectJson<{ id: string; }>(loveJarResponse, 201);
      });

      const audit = await apiGet<{ items: Array<{ action: string; resourceType: string; }>; }>(
        request,
        '/api/admin/audit-log',
        token,
      );      await test.step('Assert: audit log contains love jar template creation', async () => {
        expect(audit.items.some((entry) => entry.action === 'create' && entry.resourceType === 'love-jar-templates')).toBe(true);
      });
    });

    await test.step('Verify love-jar templates are served to users with localization', async () => {
      const user = testUser('admin-template-user', suffix);
      const auth = await registerByApi(request, user);
      const englishTemplatesResponse = await apiGetRaw(request, '/api/love-jar/templates', auth.token, {
        'Accept-Language': 'en',
      });
      const englishTemplates = await expectJson<{ templates: Array<{ text: string; }>; }>(englishTemplatesResponse);      await test.step('Assert: default English love jar template is localized', async () => {
        expect(englishTemplates.templates.some((template) => template.text === 'What I love about you is ...')).toBe(true);
      });

      const templates = await apiGet<{ templates: Array<{ text: string; }>; }>(request, '/api/love-jar/templates', auth.token);      await test.step('Assert: custom love jar template is served to users', async () => {
        expect(templates.templates.some((template) => template.text === `Admin jar ${suffix}`)).toBe(true);
      });
    });
  });
  test('rejects invalid content and category input', async ({ request }) => {
    const token = await adminLogin(request);
    const suffix = testRunId().replaceAll('-', '_');
    const dailyCategory = `admin_daily_invalid_${suffix}`;
    const questCategory = `admin_quest_invalid_${suffix}`;
    const knowMeCategory = `admin_know_me_invalid_${suffix}`;
    const loveJarCategory = `admin_love_jar_invalid_${suffix}`;

    async function createCategory(contentType: string, value: string) {
      await expectJson<{ id: string; }>(
        await apiPostRaw(
          request,
          '/api/admin/categories',
          {
            contentType,
            value,
            active: true,
            sortOrder: 1,
            translations: {
              de: { label: `Admin ${value}` },
              en: { label: `Admin EN ${value}` },
            },
          },
          token,
        ),
        201,
      );
    }

    const validDailyQuestion = {
      text: `Admin daily invalid ${suffix}`,
      category: dailyCategory,
      depthLevel: 1,
      longDistanceSuitable: true,
      active: true,
      translations: { de: { text: `Admin daily invalid ${suffix}` } },
    };
    const validQuest = {
      title: `Admin quest invalid ${suffix}`,
      description: `Admin quest description ${suffix}`,
      category: questCategory,
      estimatedMinutes: 5,
      effortLevel: 'low',
      rewardPoints: 1,
      requiresBothPartners: false,
      active: true,
      translations: {
        de: {
          title: `Admin quest invalid ${suffix}`,
          description: `Admin quest description ${suffix}`,
        },
      },
    };
    const validKnowMeQuestion = {
      questionText: `Admin know me invalid ${suffix}`,
      category: knowMeCategory,
      sortOrder: 1,
      active: true,
      translations: { de: { questionText: `Admin know me invalid ${suffix}` } },
    };
    const validLoveJarTemplate = {
      text: `Admin love jar invalid ${suffix}`,
      category: loveJarCategory,
      sortOrder: 1,
      active: true,
      translations: { de: { text: `Admin love jar invalid ${suffix}` } },
    };

    await test.step('Prepare valid categories for isolated content validation failures', async () => {
      await createCategory('daily-questions', dailyCategory);
      await createCategory('quests', questCategory);
      await createCategory('know-me-catalog', knowMeCategory);
      await createCategory('love-jar-templates', loveJarCategory);
    });

    await test.step('Reject unknown content types', async () => {
      await expectApiError(await apiGetRaw(request, '/api/admin/content/not-a-type', token), 404, 'content.notFound');
      await expectApiError(await apiPostRaw(request, '/api/admin/content/not-a-type', {}, token), 404, 'content.notFound');
      await expectApiError(
        await apiPatchRaw(request, '/api/admin/content/not-a-type/not-an-id', {}, token),
        404,
        'content.notFound',
      );
    });

    await test.step('Reject malformed content payloads before domain validation', async () => {
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/daily-questions', { ...validDailyQuestion, unexpected: true }, token),
        400,
        'common.validation',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/daily-questions', { ...validDailyQuestion, active: 'true' }, token),
        400,
        'common.validation',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/daily-questions', { ...validDailyQuestion, depthLevel: '1' }, token),
        400,
        'common.validation',
      );
    });

    await test.step('Reject invalid daily question content', async () => {
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/daily-questions', { ...validDailyQuestion, text: '   ', translations: { de: { text: '   ' } } }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/daily-questions', { ...validDailyQuestion, category: '' }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/daily-questions', { ...validDailyQuestion, category: `missing_${suffix}` }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/daily-questions', { ...validDailyQuestion, depthLevel: 0 }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/daily-questions', { ...validDailyQuestion, depthLevel: 5 }, token),
        400,
        'admin.contentInvalid',
      );
    });

    await test.step('Reject invalid quest content', async () => {
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/quests', { ...validQuest, title: '   ', translations: { de: { title: '   ', description: validQuest.description } } }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/quests', { ...validQuest, description: '   ', translations: { de: { title: validQuest.title, description: '   ' } } }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/quests', { ...validQuest, category: '' }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/quests', { ...validQuest, category: `missing_${suffix}` }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/quests', { ...validQuest, effortLevel: 'extreme' }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/quests', { ...validQuest, estimatedMinutes: undefined }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/quests', { ...validQuest, estimatedMinutes: 0 }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/quests', { ...validQuest, estimatedMinutes: -1 }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/quests', { ...validQuest, rewardPoints: undefined }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/quests', { ...validQuest, rewardPoints: 0 }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/quests', { ...validQuest, rewardPoints: -1 }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/quests', { ...validQuest, estimatedMinutes: null }, token),
        400,
        'common.validation',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/quests', { ...validQuest, rewardPoints: null }, token),
        400,
        'common.validation',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/quests', { ...validQuest, estimatedMinutes: '5' }, token),
        400,
        'common.validation',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/quests', { ...validQuest, rewardPoints: '1' }, token),
        400,
        'common.validation',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/quests', { ...validQuest, requiresBothPartners: 'false' }, token),
        400,
        'common.validation',
      );
    });

    await test.step('Reject invalid know-me catalog content', async () => {
      await expectApiError(
        await apiPostRaw(
          request,
          '/api/admin/content/know-me-catalog',
          { ...validKnowMeQuestion, questionText: '   ', translations: { de: { questionText: '   ' } } },
          token,
        ),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/know-me-catalog', { ...validKnowMeQuestion, category: '' }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/know-me-catalog', { ...validKnowMeQuestion, category: `missing_${suffix}` }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/know-me-catalog', { ...validKnowMeQuestion, sortOrder: '1' }, token),
        400,
        'common.validation',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/know-me-catalog', { ...validKnowMeQuestion, active: 'true' }, token),
        400,
        'common.validation',
      );
    });

    await test.step('Reject invalid love-jar template content', async () => {
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/love-jar-templates', { ...validLoveJarTemplate, text: '   ', translations: { de: { text: '   ' } } }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/love-jar-templates', { ...validLoveJarTemplate, category: '' }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/love-jar-templates', { ...validLoveJarTemplate, category: `missing_${suffix}` }, token),
        400,
        'admin.contentInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/love-jar-templates', { ...validLoveJarTemplate, category: null }, token),
        400,
        'common.validation',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/love-jar-templates', { ...validLoveJarTemplate, sortOrder: '1' }, token),
        400,
        'common.validation',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/content/love-jar-templates', { ...validLoveJarTemplate, active: 'true' }, token),
        400,
        'common.validation',
      );
    });

    await test.step('Reject invalid category input', async () => {
      await expectApiError(await apiGetRaw(request, '/api/admin/categories?type=not-a-type', token), 404, 'content.notFound');
      await expectApiError(
        await apiPostRaw(request, '/api/admin/categories', { value: `missing_type_${suffix}`, translations: { de: { label: 'Missing type' } } }, token),
        400,
        'admin.categoryInvalid',
      );
      await expectApiError(
        await apiPostRaw(request, '/api/admin/categories', { contentType: 'daily-questions', translations: { de: { label: 'Missing value' } } }, token),
        400,
        'admin.categoryInvalid',
      );
      await expectDefaultTranslationMissing(
        await apiPostRaw(request, '/api/admin/categories', { contentType: 'daily-questions', value: `missing_label_${suffix}` }, token),
      );
      await expectDefaultTranslationMissing(
        await apiPostRaw(request, '/api/admin/categories', { contentType: 'daily-questions', value: `legacy_label_${suffix}`, label: 'Legacy label' }, token),
      );
      await expectApiError(
        await apiPostRaw(
          request,
          '/api/admin/categories',
          { contentType: 'daily-questions', value: 'invalid value!', translations: { de: { label: 'Invalid value' } } },
          token,
        ),
        400,
        'admin.categoryInvalid',
      );
      await expectApiError(
        await apiPostRaw(
          request,
          '/api/admin/categories',
          {
            contentType: 'daily-questions',
            value: `invalid_style_${suffix}`,
            contentStyles: [`missing_style_${suffix}`],
            translations: { de: { label: 'Invalid style' } },
          },
          token,
        ),
        400,
        'admin.categoryInvalid',
      );
      await expectApiError(
        await apiPatchRaw(request, `/api/admin/categories/${dailyCategory}`, { contentType: 'not-a-type', value: dailyCategory, translations: { de: { label: 'Invalid' } } }, token),
        400,
        'admin.categoryInvalid',
      );
      await expectApiError(await apiDeleteRaw(request, '/api/admin/categories/not-a-category', token), 404, 'admin.categoryNotFound');
    });
  });

  test('rejects invalid admin content and category query parameters', async ({ request }) => {
    const token = await adminLogin(request);
    const overlongSearch = 'x'.repeat(201);

    await test.step('Reject invalid content list queries', async () => {
      await expectApiError(await apiGetRaw(request, '/api/admin/content/daily-questions?active=yes', token), 400, 'common.validation');
      await expectApiError(await apiGetRaw(request, `/api/admin/content/daily-questions?search=${overlongSearch}`, token), 400, 'common.validation');
      await expectApiError(await apiGetRaw(request, `/api/admin/content/daily-questions?category=${overlongSearch}`, token), 400, 'common.validation');
      await expectApiError(await apiGetRaw(request, '/api/admin/content/daily-questions?unexpected=true', token), 400, 'common.validation');
    });

    await test.step('Reject invalid categories queries', async () => {
      await expectApiError(await apiGetRaw(request, '/api/admin/categories?unexpected=true', token), 400, 'common.validation');
      await expectApiError(await apiGetRaw(request, '/api/admin/categories?lang=de-DE-extra', token), 400, 'common.validation');
      await expectApiError(await apiGetRaw(request, '/api/admin/categories?type=not-a-type', token), 404, 'content.notFound');
    });
  });
  test('requires admin authentication for content and category endpoints', async ({ request }) => {
    await test.step('Reject missing admin tokens', async () => {
      await expectApiError(await apiGetRaw(request, '/api/admin/content/daily-questions'), 401, 'auth.missingToken');
      await expectApiError(await apiGetRaw(request, '/api/admin/categories'), 401, 'auth.missingToken');
    });

    await test.step('Reject invalid admin tokens', async () => {
      await expectApiError(await apiGetRaw(request, '/api/admin/content/daily-questions', 'invalid-token'), 401, 'auth.invalidToken');
      await expectApiError(await apiGetRaw(request, '/api/admin/categories', 'invalid-token'), 401, 'auth.invalidToken');
    });
  });
});
