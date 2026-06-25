import { test } from '@playwright/test';

import { apiGetRaw, apiPatchRaw, apiPostRaw, setupCoupleByApi } from '../../helpers/api';

import {
  expectApiError,
  expectGardenPayload,

  expectJson,
  type GardenPayload,
  type MemoriesPayload
} from '../../helpers/apiAssertions';

import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / garden', () => {
  test('returns not found for missing and foreign garden objects', async ({ request }) => {
    await test.step('Flow: returns not found for missing and foreign garden objects', async () => {
      const runId = testRunId();
      const coupleA = await setupCoupleByApi(
        request,
        testUser('api-garden-foreign-a1', runId),
        testUser('api-garden-foreign-a2', runId),
      );
      const coupleB = await setupCoupleByApi(
        request,
        testUser('api-garden-foreign-b1', runId),
        testUser('api-garden-foreign-b2', runId),
      );

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiGetRaw(request, '/api/garden/objects/00000000-0000-0000-0000-000000000000', coupleA.partnerA.token),
          404,
          'garden.objectNotFound',
        );
      });

      await test.step('Verify JSON response payload', async () => {
        await expectJson<MemoriesPayload>(
          await apiPostRaw(request, '/api/memories', { title: 'Foreign object source' }, coupleA.partnerA.token),
          201,
        );
      });
      const gardenA = await expectJson<GardenPayload>(await apiGetRaw(request, '/api/garden', coupleA.partnerA.token));
      expectGardenPayload(gardenA);
      const foreignObjectId = gardenA.objects[0].id;

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiGetRaw(request, `/api/garden/objects/${foreignObjectId}`, coupleB.partnerA.token),
          404,
          'garden.objectNotFound',
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPatchRaw(
            request,
            `/api/garden/objects/${foreignObjectId}/placement`,
            { areaKey: 'heart_bed', positionX: 50, positionY: 60, zIndex: 7 },
            coupleB.partnerA.token,
          ),
          404,
          'garden.objectNotFound',
        );
      });
    });
  });
});
