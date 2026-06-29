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
  type MemoriesPayload,
} from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('user api / memories create', () => {
  test('creates memory and returns garden object detail', async ({ request }) => {
    const runId = testRunId();
    const { partnerA } = await test.step('Setup: connected couple', async () => {
      return setupCoupleByApi(
        request,
        testUser('api-memory-a', runId),
        testUser('api-memory-b', runId),
      );
    });

    await test.step('Assert: memories start empty with localized categories', async () => {

      const emptyMemories = await expectJson<MemoriesPayload>(await apiGetRaw(request, '/api/memories', partnerA.token));

      expectMemoriesPayload(emptyMemories);

      expect(emptyMemories.memories).toHaveLength(0);

      expect(emptyMemories.categories?.find((category) => category.value === 'everyday')?.label).toBe('Alltag');

    });

    const memory = await test.step('Flow: create memory and link garden object', async () => {
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
      const createdMemory = created.memories.find((item) => item.title === 'API Memory');
      expect(createdMemory).toBeTruthy();
      expect(createdMemory?.categoryLabel).toBe('Alltag');
      expect(createdMemory?.linkedGardenObjectId).toEqual(expect.any(String));
      return createdMemory!;
    });

    await test.step('Assert: memory category labels follow Accept-Language', async () => {

      const englishMemories = await expectJson<MemoriesPayload>(

      await apiGetRaw(request, '/api/memories', partnerA.token, { 'Accept-Language': 'en' }),

      );

      expect(englishMemories.memories.find((item) => item.title === 'API Memory')?.categoryLabel).toBe('Everyday');

      expect(englishMemories.categories?.find((category) => category.value === 'everyday')?.label).toBe('Everyday');

    });

    const gardenObject = await test.step('Assert: created memory appears in garden payload', async () => {
      const garden = await expectJson<GardenPayload>(await apiGetRaw(request, '/api/garden', partnerA.token));
      expectGardenPayload(garden);
      expect(garden.areas.length).toBeGreaterThanOrEqual(10);
      expect(garden.unlocks.find((unlock) => unlock.stage === 10)?.points).toBe(1400);
      expect(garden.availableAssets.every((asset) => asset.stageUnlock <= garden.couple.gardenStage)).toBeTruthy();
      expect(garden.assetCatalog?.some((asset) => asset.key === 'memory_stone')).toBeTruthy();
      expect(garden.nextUnlock).toEqual(expect.objectContaining({ stage: expect.any(Number), pointsRemaining: expect.any(Number) }));
      expect(garden.progress.memoryCount).toBeGreaterThanOrEqual(1);
      const object = garden.objects.find((item) => item.id === memory.linkedGardenObjectId);
      expect(object).toBeTruthy();
      expect(object).toEqual(expect.objectContaining({ areaKey: 'heart_bed', assetKey: 'memory_stone' }));
      return object!;
    });

    await test.step('Reject: memory object cannot be placed in a locked area', async () => {
      await expectApiError(
        await apiPatchRaw(
          request,
          `/api/garden/objects/${gardenObject.id}/placement`,
          { areaKey: 'memory_tree', positionX: 42, positionY: 58, zIndex: 7, scale: 1.1, rotation: -4 },
          partnerA.token,
        ),
        400,
        'garden.invalidPlacement',
      );
    });

    await test.step('Flow: place memory object in an unlocked area', async () => {
      const placed = await expectJson<{ object: GardenPayload['objects'][number]; }>(
        await apiPatchRaw(
          request,
          `/api/garden/objects/${gardenObject.id}/placement`,
          { areaKey: 'heart_bed', positionX: 42, positionY: 58, zIndex: 7, scale: 1.1, rotation: -4 },
          partnerA.token,
        ),
      );
      expect(placed.object).toEqual(
        expect.objectContaining({ areaKey: 'heart_bed', positionX: 42, positionY: 58, zIndex: 7, placedByUser: true }),
      );
    });

    await test.step('Flow: patch only one placement field', async () => {
      const partiallyPlaced = await expectJson<{ object: GardenPayload['objects'][number]; }>(
        await apiPatchRaw(request, `/api/garden/objects/${gardenObject.id}/placement`, { rotation: 3 }, partnerA.token),
      );
      expect(partiallyPlaced.object).toEqual(
        expect.objectContaining({ areaKey: 'heart_bed', positionX: 42, positionY: 58, zIndex: 7, rotation: 3 }),
      );
    });

    await test.step('Assert: garden object detail exposes memory source', async () => {

      const detail = await expectJson<GardenObjectDetailPayload>(

      await apiGetRaw(request, `/api/garden/objects/${gardenObject.id}`, partnerA.token),

      );

      expectGardenObjectDetailPayload(detail);

      expect(detail.source).toEqual(expect.objectContaining({ type: 'memory', title: 'API Memory', categoryLabel: 'Alltag' }));

    });

    await test.step('Reject: injected garden object id is not found', async () => {
      await expectApiError(
        await apiGetRaw(request, `/api/garden/objects/${encodeURIComponent(`${gardenObject.id}' OR '1'='1`)}`, partnerA.token),
        404,
        'garden.objectNotFound',
      );
    });
  });
});
