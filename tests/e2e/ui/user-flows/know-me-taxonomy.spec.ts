import { expect, test } from '@playwright/test';
import { apiGet, apiPatchRaw, apiPostRaw, authenticatePage, setupCoupleByApi } from '../../helpers/api';
import { expectJson } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';
import { adminLogin } from '../../helpers/userFlows';

test.describe('user flow / know me taxonomy', () => {
  test('know me catalog suggestions use backend taxonomy order and filter in the UI', async ({ browser, request }) => {
    await test.step('Flow: know me catalog suggestions use backend taxonomy order and filter in the UI', async () => {
      const runId = testRunId().replaceAll('-', '_');
      const adminToken = await adminLogin(request);
      const relationshipValue = `km_rel_${runId}`;
      const styleValue = `km_style_${runId}`;
      const preferredCategory = `km_preferred_${runId}`;
      const neutralCategory = `km_neutral_${runId}`;
      const preferredQuestion = `Taxonomy Preferred Alpha ${runId}`;
      const neutralQuestion = `Taxonomy Neutral Beta ${runId}`;

      await expectJson(
        await apiPostRaw(
          request,
          '/api/admin/relationship-modes',
          {
            value: relationshipValue,
            label: `KM Relationship ${runId}`,
            active: true,
            sortOrder: 1,
          },
          adminToken,
        ),
        201,
      );
      await expectJson(
        await apiPostRaw(
          request,
          '/api/admin/content-styles',
          {
            value: styleValue,
            label: `KM Style ${runId}`,
            active: true,
            sortOrder: 1,
          },
          adminToken,
        ),
        201,
      );
      await expectJson(
        await apiPostRaw(
          request,
          '/api/admin/categories',
          {
            contentType: 'know-me-catalog',
            value: preferredCategory,
            label: `KM Preferred ${runId}`,
            active: true,
            sortOrder: 99,
            relationshipModes: [relationshipValue],
            contentStyles: [styleValue],
          },
          adminToken,
        ),
        201,
      );
      await expectJson(
        await apiPostRaw(
          request,
          '/api/admin/categories',
          {
            contentType: 'know-me-catalog',
            value: neutralCategory,
            label: `KM Neutral ${runId}`,
            active: true,
            sortOrder: 1,
          },
          adminToken,
        ),
        201,
      );
      await expectJson(
        await apiPostRaw(
          request,
          '/api/admin/content/know-me-catalog',
          {
            questionText: preferredQuestion,
            category: preferredCategory,
            active: true,
            sortOrder: 99,
          },
          adminToken,
        ),
        201,
      );
      await expectJson(
        await apiPostRaw(
          request,
          '/api/admin/content/know-me-catalog',
          {
            questionText: neutralQuestion,
            category: neutralCategory,
            active: true,
            sortOrder: 1,
          },
          adminToken,
        ),
        201,
      );

      const setup = await setupCoupleByApi(
        request,
        testUser('knowme-taxonomy-a', runId),
        testUser('knowme-taxonomy-b', runId),
      );
      const couples = await apiGet<{ items: Array<{ id: string; inviteCode: string; }>; }>(
        request,
        `/api/admin/couples?search=${setup.inviteCode}`,
        adminToken,
      );
      const coupleId = couples.items[0].id;
      await expectJson(
        await apiPatchRaw(
          request,
          `/api/admin/couples/${coupleId}/preferences`,
          { relationshipType: relationshipValue, contentPreference: styleValue },
          adminToken,
        ),
      );

      const apiPayload = await apiGet<{
        catalogQuestions: Array<{ questionText: string; }>;
      }>(request, '/api/know-me', setup.partnerA.token);
      await test.step('Verify expected result', async () => {
        expect(apiPayload.catalogQuestions.findIndex((question) => question.questionText === preferredQuestion)).toBeLessThan(
          apiPayload.catalogQuestions.findIndex((question) => question.questionText === neutralQuestion),
        );
      });

      const context = await browser.newContext();
      const page = await context.newPage();
      await authenticatePage(context, page, setup.partnerA.token);
      await test.step('Open /know-me', async () => {
        await page.goto('/know-me');
      });
      await test.step('Click know me question input', async () => {
        await page.getByTestId('know-me-question-input').click();
      });
      await test.step('Verify know me catalog suggestions', async () => {
        await expect(page.getByTestId('know-me-catalog-suggestions')).toBeVisible();
      });
      await test.step('Verify know me catalog suggestion', async () => {
        await expect(page.getByTestId('know-me-catalog-suggestion').first()).toContainText(preferredQuestion);
      });

      await test.step('Fill know me question input', async () => {
        await page.getByTestId('know-me-question-input').fill(`Neutral Beta ${runId}`);
      });
      await test.step('Verify know me catalog suggestion', async () => {
        await expect(page.getByTestId('know-me-catalog-suggestion')).toHaveCount(1);
      });
      await test.step('Verify know me catalog suggestion', async () => {
        await expect(page.getByTestId('know-me-catalog-suggestion').first()).toContainText(neutralQuestion);
      });
      await test.step('Verify know me catalog suggestion', async () => {
        await expect(page.getByTestId('know-me-catalog-suggestion').filter({ hasText: preferredQuestion })).toHaveCount(0);
      });

      await context.close();
    });
  });
});
