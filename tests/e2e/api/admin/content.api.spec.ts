import { expect, test } from '@playwright/test';
import { adminLogin, apiBaseURL } from '../../helpers/adminApi';
import { apiGet, apiGetRaw, apiPostRaw, registerByApi } from '../../helpers/api';
import { expectApiError, expectJson } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

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
      );

      await test.step('Verify expected result', async () => {
        expect(germanCategories.items.find((category) => category.value === 'romance')?.label).toBe('Romantik');
      });
    });

    await test.step('Check and verify english content categories', async () => {
      const englishCategories = await expectJson<{ items: Array<{ value: string; label: string; }>; }>(
        await apiGetRaw(request, '/api/admin/categories?type=quests', token, { 'Accept-Language': 'en' }),
      );

      await test.step('Verify expected result', async () => {
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
          label: `Admin API ${suffix}`,
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
      categoryId = categoryPayload.id;
      await test.step('Verify expected result', async () => {
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
      );
      await test.step('Verify expected result', async () => {
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
      dailyQuestionId = dailyPayload.id;
      await test.step('Verify expected result', async () => {
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
      const patchPayload = await expectJson<{ items: Array<{ id: string; active: boolean; }>; }>(patchResponse);
      await test.step('Verify expected result', async () => {
        expect(patchPayload.items.find((item) => item.id === dailyQuestionId)?.active).toBe(false);
      });
    });

    await test.step('Reject deleting used category and allow deleting unused category', async () => {
      const deleteUsedCategory = await request.delete(`${apiBaseURL}/api/admin/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await test.step('Verify expected result', async () => {
        expect(deleteUsedCategory.status()).toBe(409);
      });

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
      const unusedPayload = await expectJson<{ id: string; }>(unusedCategory, 201);
      const deleteUnused = await request.delete(`${apiBaseURL}/api/admin/categories/${unusedPayload.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await test.step('Verify expected result', async () => {
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
      );
      await test.step('Verify expected result', async () => {
        expect(audit.items.some((entry) => entry.action === 'create' && entry.resourceType === 'love-jar-templates')).toBe(true);
      });
    });

    await test.step('Verify love-jar templates are served to users with localization', async () => {
      const user = testUser('admin-template-user', suffix);
      const auth = await registerByApi(request, user);
      const englishTemplatesResponse = await apiGetRaw(request, '/api/love-jar/templates', auth.token, {
        'Accept-Language': 'en',
      });
      const englishTemplates = await expectJson<{ templates: Array<{ text: string; }>; }>(englishTemplatesResponse);
      await test.step('Verify expected result', async () => {
        expect(englishTemplates.templates.some((template) => template.text === 'What I love about you is ...')).toBe(true);
      });

      const templates = await apiGet<{ templates: Array<{ text: string; }>; }>(request, '/api/love-jar/templates', auth.token);
      await test.step('Verify expected result', async () => {
        expect(templates.templates.some((template) => template.text === `Admin jar ${suffix}`)).toBe(true);
      });
    });
  });
});