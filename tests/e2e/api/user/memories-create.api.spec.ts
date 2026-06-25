import { expect, test } from '@playwright/test';

import { apiGetRaw, apiPatchRaw, apiPostRaw, setupCoupleByApi } from '../../helpers/api';

import {
  expectApiError,

  expectGardenObjectDetailPayload,

  expectGardenPayload,

  expectJson,
  expectMemoriesPayload,

  type GardenObjectDetailPayload,

  type GardenPayload,
  type MemoriesPayload
} from '../../helpers/apiAssertions';

import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / memories create', () => {
  test('creates memory and returns garden object detail', async ({ request }) => {
    await test.step('Flow: creates memory and returns garden object detail', async () => {
      const runId = testRunId();
      const { partnerA } = await setupCoupleByApi(
        request,
        testUser('api-memory-a', runId),
        testUser('api-memory-b', runId),
      );

      const emptyMemories = await expectJson<MemoriesPayload>(await apiGetRaw(request, '/api/memories', partnerA.token));
      expectMemoriesPayload(emptyMemories);
      await test.step('Verify expected result', async () => {
        expect(emptyMemories.memories).toHaveLength(0);
      });
      await test.step('Verify expected result', async () => {
        expect(emptyMemories.categories?.find((category) => category.value === 'everyday')?.label).toBe('Alltag');
      });

      const created = await expectJson<MemoriesPayload>(
        await apiPostRaw(
          request,
          '/api/memories',
          {
            title: 'API Memory',
            description: 'Created by an API test',
            date: '2026-06-09',
            category: 'everyday',
          },
          partnerA.token,
        ),
        201,
      );
      expectMemoriesPayload(created);
      const memory = created.memories.find((item) => item.title === 'API Memory');
      await test.step('Verify expected result', async () => {
        expect(memory).toBeTruthy();
      });
      await test.step('Verify expected result', async () => {
        expect(memory?.categoryLabel).toBe('Alltag');
      });
      await test.step('Verify expected result', async () => {
        expect(memory?.linkedGardenObjectId).toEqual(expect.any(String));
      });

      const englishMemories = await expectJson<MemoriesPayload>(
        await apiGetRaw(request, '/api/memories', partnerA.token, { 'Accept-Language': 'en' }),
      );
      await test.step('Verify expected result', async () => {
        expect(englishMemories.memories.find((item) => item.title === 'API Memory')?.categoryLabel).toBe('Everyday');
      });
      await test.step('Verify expected result', async () => {
        expect(englishMemories.categories?.find((category) => category.value === 'everyday')?.label).toBe('Everyday');
      });

      const garden = await expectJson<GardenPayload>(await apiGetRaw(request, '/api/garden', partnerA.token));
      expectGardenPayload(garden);
      await test.step('Verify expected result', async () => {
        expect(garden.areas.length).toBeGreaterThanOrEqual(10);
      });
      await test.step('Verify expected result', async () => {
        expect(garden.unlocks.find((unlock) => unlock.stage === 10)?.points).toBe(1400);
      });
      await test.step('Verify expected result', async () => {
        expect(garden.availableAssets.every((asset) => asset.stageUnlock <= garden.couple.gardenStage)).toBeTruthy();
      });
      await test.step('Verify expected result', async () => {
        expect(garden.assetCatalog?.some((asset) => asset.key === 'memory_stone')).toBeTruthy();
      });
      await test.step('Verify expected result', async () => {
        expect(garden.nextUnlock).toEqual(expect.objectContaining({ stage: expect.any(Number), pointsRemaining: expect.any(Number) }));
      });
      await test.step('Verify expected result', async () => {
        expect(garden.progress.memoryCount).toBeGreaterThanOrEqual(1);
      });
      const object = garden.objects.find((item) => item.id === memory!.linkedGardenObjectId);
      await test.step('Verify expected result', async () => {
        expect(object).toBeTruthy();
      });
      await test.step('Verify expected result', async () => {
        expect(object).toEqual(expect.objectContaining({ areaKey: 'heart_bed', assetKey: 'memory_stone' }));
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPatchRaw(
            request,
            `/api/garden/objects/${object!.id}/placement`,
            { areaKey: 'memory_tree', positionX: 42, positionY: 58, zIndex: 7, scale: 1.1, rotation: -4 },
            partnerA.token,
          ),
          400,
          'garden.invalidPlacement',
        );
      });

      const placed = await expectJson<{ object: GardenPayload['objects'][number]; }>(
        await apiPatchRaw(
          request,
          `/api/garden/objects/${object!.id}/placement`,
          { areaKey: 'heart_bed', positionX: 42, positionY: 58, zIndex: 7, scale: 1.1, rotation: -4 },
          partnerA.token,
        ),
      );
      await test.step('Verify expected result', async () => {
        expect(placed.object).toEqual(
          expect.objectContaining({ areaKey: 'heart_bed', positionX: 42, positionY: 58, zIndex: 7, placedByUser: true }),
        );
      });

      const partiallyPlaced = await expectJson<{ object: GardenPayload['objects'][number]; }>(
        await apiPatchRaw(request, `/api/garden/objects/${object!.id}/placement`, { rotation: 3 }, partnerA.token),
      );
      await test.step('Verify expected result', async () => {
        expect(partiallyPlaced.object).toEqual(
          expect.objectContaining({ areaKey: 'heart_bed', positionX: 42, positionY: 58, zIndex: 7, rotation: 3 }),
        );
      });

      const detail = await expectJson<GardenObjectDetailPayload>(
        await apiGetRaw(request, `/api/garden/objects/${object!.id}`, partnerA.token),
      );
      expectGardenObjectDetailPayload(detail);
      await test.step('Verify expected result', async () => {
        expect(detail.source).toEqual(expect.objectContaining({ type: 'memory', title: 'API Memory', categoryLabel: 'Alltag' }));
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiGetRaw(request, `/api/garden/objects/${encodeURIComponent(`${object!.id}' OR '1'='1`)}`, partnerA.token),
          404,
          'garden.objectNotFound',
        );
      });
    });
  });
});
