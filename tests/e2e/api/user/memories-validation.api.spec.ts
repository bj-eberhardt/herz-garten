import { test } from '@playwright/test';

import { apiGetRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../../helpers/api';

import {
  expectApiError
} from '../../helpers/apiAssertions';

import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / memories validation', () => {
  test('rejects invalid memories and no-couple garden access', async ({ request }) => {
    await test.step('Flow: rejects invalid memories and no-couple garden access', async () => {
      const noCouple = await registerByApi(request, testUser('api-memory-no-couple', testRunId()));
      const runId = testRunId();
      const { partnerA } = await setupCoupleByApi(
        request,
        testUser('api-memory-invalid-a', runId),
        testUser('api-memory-invalid-b', runId),
      );

      await test.step('Verify API error response', async () => {
        await expectApiError(await apiGetRaw(request, '/api/memories', noCouple.token), 409, 'couple.notConnected');
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(await apiGetRaw(request, '/api/garden', noCouple.token), 409, 'couple.notConnected');
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiGetRaw(request, '/api/garden/objects/00000000-0000-0000-0000-000000000000', noCouple.token),
          409,
          'couple.notConnected',
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(await apiPostRaw(request, '/api/memories', {}, partnerA.token), 400, 'memory.titleRequired');
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(await apiPostRaw(request, '/api/memories', { title: '' }, partnerA.token), 400, 'memory.titleRequired');
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/memories', { title: 'Bad date', date: '09.06.2026' }, partnerA.token),
          400,
          'memory.invalidDate',
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/memories', { title: 'Bad category', category: 'bad' }, partnerA.token),
          400,
          'memory.invalidCategory',
        );
      });
    });
  });
});
