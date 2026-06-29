import { expect, test, type APIRequestContext } from '@playwright/test';

import { apiGetRaw, apiPatchRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../../helpers/api';
import {
  expectApiError,
  expectGardenObjectDetailPayload,
  expectGardenPayload,
  expectJson,
  type GardenObjectDetailPayload,
  type GardenPayload,
  type MemoriesPayload,
} from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

interface GardenPlacementPayload {
  object: {
    id: string;
    areaKey: string;
    positionX: number;
    positionY: number;
    zIndex: number;
    scale: number;
    rotation: number;
  };
}

const missingObjectId = '00000000-0000-0000-0000-000000000000';

async function createMemoryGardenObject(request: APIRequestContext, token: string) {
  await expectJson<MemoriesPayload>(await apiPostRaw(request, '/api/memories', { title: 'Garden object source' }, token), 201);
  const garden = await expectJson<GardenPayload>(await apiGetRaw(request, '/api/garden', token));
  expectGardenPayload(garden);
  expect(garden.objects.length).toBeGreaterThan(0);
  return garden.objects[0];
}

test.describe('user api / garden', () => {
  test('returns garden payload and object detail for a couple', async ({ request }) => {
    await test.step('Flow: returns garden payload and object detail for a couple', async () => {
      const runId = testRunId();
      const { partnerA } = await setupCoupleByApi(
        request,
        testUser('api-garden-read-a', runId),
        testUser('api-garden-read-b', runId),
      );
      let objectId = '';

      await test.step('Arrange: create a memory-backed garden object', async () => {
        const object = await createMemoryGardenObject(request, partnerA.token);
        objectId = object.id;
      });

      await test.step('Assert: garden payload supports locale selection', async () => {

        const garden = await expectJson<GardenPayload>(await apiGetRaw(request, '/api/garden?lang=en', partnerA.token));

        expectGardenPayload(garden);

        expect(garden.objects.some((object) => object.id === objectId)).toBeTruthy();

      });

      await test.step('Assert: garden object detail is returned for own object', async () => {

        const detail = await expectJson<GardenObjectDetailPayload>(

        await apiGetRaw(request, `/api/garden/objects/${objectId}?lang=en`, partnerA.token),

        );

        expectGardenObjectDetailPayload(detail);

        expect(detail.object?.id).toBe(objectId);

      });
    });
  });

  test('updates garden object placement and clamps numeric boundaries', async ({ request }) => {
    await test.step('Flow: updates garden object placement and clamps numeric boundaries', async () => {
      const runId = testRunId();
      const { partnerA } = await setupCoupleByApi(
        request,
        testUser('api-garden-place-a', runId),
        testUser('api-garden-place-b', runId),
      );
      let objectId = '';

      await test.step('Arrange: create a placeable garden object', async () => {
        const object = await createMemoryGardenObject(request, partnerA.token);
        objectId = object.id;
      });

      let placed!: GardenPlacementPayload;
      await test.step('Act: place object with finite out-of-range values', async () => {
        placed = await expectJson<GardenPlacementPayload>(
          await apiPatchRaw(
            request,
            `/api/garden/objects/${objectId}/placement`,
            { areaKey: 'heart_bed', positionX: -20, positionY: 200, zIndex: 150, scale: 2, rotation: -90 },
            partnerA.token,
          ),
        );
      });

      await test.step('Assert: placement response contains clamped boundaries', async () => {

        expect(placed.object.id).toBe(objectId);

        expect(placed.object.areaKey).toBe('heart_bed');

        expect(placed.object.positionX).toBe(4);

        expect(placed.object.positionY).toBe(88);

        expect(placed.object.zIndex).toBe(99);

        expect(placed.object.scale).toBe(1.35);

        expect(placed.object.rotation).toBe(-12);

      });
    });
  });

  test('rejects unauthenticated garden access', async ({ request }) => {
    await test.step('Flow: rejects unauthenticated garden access', async () => {
      await test.step('Assert: GET /garden requires an auth token', async () => {
        await expectApiError(await apiGetRaw(request, '/api/garden'), 401, 'auth.missingToken');
      });

      await test.step('Assert: GET /garden rejects an invalid auth token', async () => {

        await expectApiError(await apiGetRaw(request, '/api/garden', 'invalid-token'), 401, 'auth.invalidToken');

      });

      await test.step('Assert: object detail requires an auth token', async () => {

        await expectApiError(await apiGetRaw(request, `/api/garden/objects/${missingObjectId}`), 401, 'auth.missingToken');

      });

      await test.step('Assert: placement update requires an auth token', async () => {

        await expectApiError(

        await apiPatchRaw(request, `/api/garden/objects/${missingObjectId}/placement`, { positionX: 50 }),

        401,

        'auth.missingToken',

        );

      });
    });
  });

  test('rejects no-couple garden access', async ({ request }) => {
    await test.step('Flow: rejects no-couple garden access', async () => {
      const user = await registerByApi(request, testUser('api-garden-no-couple', testRunId()));

      await test.step('Assert: garden payload requires a couple', async () => {
        await expectApiError(await apiGetRaw(request, '/api/garden', user.token), 409, 'couple.notConnected');
      });

      await test.step('Assert: object detail requires a couple for valid object ids', async () => {

        await expectApiError(await apiGetRaw(request, `/api/garden/objects/${missingObjectId}`, user.token), 409, 'couple.notConnected');

      });

      await test.step('Assert: placement update requires a couple', async () => {

        await expectApiError(

        await apiPatchRaw(request, `/api/garden/objects/${missingObjectId}/placement`, { positionX: 50 }, user.token),

        409,

        'couple.notConnected',

        );

      });
    });
  });

  test('returns not found for malformed missing and foreign garden objects', async ({ request }) => {
    await test.step('Flow: returns not found for malformed missing and foreign garden objects', async () => {
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
      let foreignObjectId = '';

      await test.step('Assert: malformed garden object ids are hidden as not found', async () => {
        await expectApiError(await apiGetRaw(request, '/api/garden/objects/not-a-uuid', coupleA.partnerA.token), 404, 'garden.objectNotFound');
        await expectApiError(
          await apiPatchRaw(request, '/api/garden/objects/not-a-uuid/placement', { positionX: 50 }, coupleA.partnerA.token),
          404,
          'garden.objectNotFound',
        );
      });

      await test.step('Assert: missing garden object id is not found', async () => {

        await expectApiError(await apiGetRaw(request, `/api/garden/objects/${missingObjectId}`, coupleA.partnerA.token), 404, 'garden.objectNotFound');

      });

      await test.step('Arrange: create a garden object in another couple', async () => {
        const object = await createMemoryGardenObject(request, coupleA.partnerA.token);
        foreignObjectId = object.id;
      });

      await test.step('Assert: foreign garden object detail is not found', async () => {

        await expectApiError(await apiGetRaw(request, `/api/garden/objects/${foreignObjectId}`, coupleB.partnerA.token), 404, 'garden.objectNotFound');

      });

      await test.step('Assert: foreign garden object placement is not found', async () => {

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

  test('rejects invalid garden query parameters', async ({ request }) => {
    await test.step('Flow: rejects invalid garden query parameters', async () => {
      const runId = testRunId();
      const { partnerA } = await setupCoupleByApi(
        request,
        testUser('api-garden-query-a', runId),
        testUser('api-garden-query-b', runId),
      );
      let objectId = '';

      await test.step('Arrange: create a garden object for object route query checks', async () => {
        const object = await createMemoryGardenObject(request, partnerA.token);
        objectId = object.id;
      });

      await test.step('Assert: garden list rejects unexpected query parameters', async () => {

        await expectApiError(await apiGetRaw(request, '/api/garden?unexpected=true', partnerA.token), 400, 'common.validation');

      });

      await test.step('Assert: garden list rejects malformed locale', async () => {

        await expectApiError(await apiGetRaw(request, '/api/garden?lang=de-DE-extra', partnerA.token), 400, 'common.validation');

      });

      await test.step('Assert: object detail rejects duplicate locale', async () => {

        await expectApiError(

        await apiGetRaw(request, `/api/garden/objects/${objectId}?lang=en&lang=de`, partnerA.token),

        400,

        'common.validation',

        );

      });

      await test.step('Assert: placement rejects any query parameters', async () => {

        await expectApiError(

        await apiPatchRaw(request, `/api/garden/objects/${objectId}/placement?lang=en`, { positionX: 50 }, partnerA.token),

        400,

        'common.validation',

        );

      });
    });
  });

  test('rejects invalid garden placement payloads', async ({ request }) => {
    await test.step('Flow: rejects invalid garden placement payloads', async () => {
      const runId = testRunId();
      const { partnerA } = await setupCoupleByApi(
        request,
        testUser('api-garden-invalid-place-a', runId),
        testUser('api-garden-invalid-place-b', runId),
      );
      let objectId = '';

      await test.step('Arrange: create a garden object for placement validation', async () => {
        const object = await createMemoryGardenObject(request, partnerA.token);
        objectId = object.id;
      });

      await test.step('Assert: rejects empty placement payload', async () => {

        await expectApiError(await apiPatchRaw(request, `/api/garden/objects/${objectId}/placement`, {}, partnerA.token), 400, 'common.validation');

      });

      await test.step('Assert: rejects unexpected placement fields', async () => {

        await expectApiError(

        await apiPatchRaw(request, `/api/garden/objects/${objectId}/placement`, { positionX: 50, unexpected: true }, partnerA.token),

        400,

        'common.validation',

        );

      });

      await test.step('Assert: rejects non-number placement coordinates', async () => {

        await expectApiError(

        await apiPatchRaw(request, `/api/garden/objects/${objectId}/placement`, { positionX: '50' }, partnerA.token),

        400,

        'common.validation',

        );

      });

      await test.step('Assert: rejects non-finite placement coordinates', async () => {

        await expectApiError(

        await apiPatchRaw(request, `/api/garden/objects/${objectId}/placement`, { positionX: Number.NaN }, partnerA.token),

        400,

        'common.validation',

        );

      });

      await test.step('Assert: rejects unknown garden area', async () => {

        await expectApiError(

        await apiPatchRaw(request, `/api/garden/objects/${objectId}/placement`, { areaKey: 'missing_area' }, partnerA.token),

        400,

        'garden.invalidPlacement',

        );

      });

      await test.step('Assert: rejects locked garden area', async () => {

        await expectApiError(

        await apiPatchRaw(request, `/api/garden/objects/${objectId}/placement`, { areaKey: 'wishing_well' }, partnerA.token),

        400,

        'garden.invalidPlacement',

        );

      });
    });
  });
});
