import { expect, test, type APIRequestContext } from '@playwright/test';

import { apiGetRaw, apiPostRaw, setupCoupleByApi } from '../../helpers/api';

import {
  expectJson,
  type GardenPayload,
  type MemoriesPayload
} from '../../helpers/apiAssertions';

import { runDbSql } from '../../helpers/db';

import { testRunId, testUser } from '../../helpers/testUsers';

const apiBaseURL = process.env.E2E_API_URL ?? 'http://localhost:3001';

function sqlLiteral(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

async function adminLogin(request: APIRequestContext) {
  const response = await apiPostRaw(request, '/api/admin/auth/login', { password: 'admin' });
  const payload = await expectJson<{ token: string; }>(response);
  expect(payload.token).toBeTruthy();
  return payload.token;
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

test.describe('user api / memories garden rewards', () => {
  test('memory rewards use unlocked areas after stage progression', async ({ request }) => {
    await test.step('Flow: memory rewards use unlocked areas after stage progression', async () => {
      const runId = testRunId();
      const { partnerA } = await setupCoupleByApi(
        request,
        testUser('api-memory-stage-a', runId),
        testUser('api-memory-stage-b', runId),
      );
      const initialGarden = await expectJson<GardenPayload>(await apiGetRaw(request, '/api/garden', partnerA.token));
      runDbSql(`
                update couples
                set heart_points = 600, garden_stage = 4
                where id = ${sqlLiteral(initialGarden.couple.id)};
              `);

      const created = await expectJson<MemoriesPayload>(
        await apiPostRaw(request, '/api/memories', { title: 'Stage four memory', category: 'everyday' }, partnerA.token),
        201,
      );
      const memory = created.memories.find((item) => item.title === 'Stage four memory');
      await test.step('Verify expected result', async () => {
        expect(memory?.linkedGardenObjectId).toEqual(expect.any(String));
      });
      const garden = await expectJson<GardenPayload>(await apiGetRaw(request, '/api/garden', partnerA.token));
      const object = garden.objects.find((item) => item.id === memory!.linkedGardenObjectId);
      await test.step('Verify expected result', async () => {
        expect(object).toEqual(expect.objectContaining({ areaKey: 'memory_tree' }));
      });
      await test.step('Verify expected result', async () => {
        expect(['memory_stone', 'polaroid_frame']).toContain(object?.assetKey);
      });
    });
  });

  test('memory rewards can use uploaded matching garden assets', async ({ request }) => {
    await test.step('Flow: memory rewards can use uploaded matching garden assets', async () => {
      const adminToken = await adminLogin(request);
      const runId = testRunId().replaceAll('-', '_');
      const assetKey = `e2e_memory_asset_${runId}`;

      runDbSql("update garden_assets set active = false where key like 'e2e_memory_asset_%';");

      await expectJson(
        await request.post(`${apiBaseURL}/api/admin/garden/assets`, {
          multipart: {
            key: assetKey,
            label: 'E2E Memory Stone',
            sourceTypes: JSON.stringify(['memory']),
            stageUnlock: '1',
            anchorX: '0.5',
            anchorY: '0.9',
            active: 'true',
            sortOrder: '1',
            image: {
              name: 'memory-stone.png',
              mimeType: 'image/png',
              buffer: pngHeader(72, 64),
            },
          },
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        201,
      );

      const { partnerA } = await setupCoupleByApi(
        request,
        testUser('api-memory-asset-a', runId),
        testUser('api-memory-asset-b', runId),
      );

      const created = await expectJson<MemoriesPayload>(
        await apiPostRaw(request, '/api/memories', { title: 'Memory with uploaded asset', category: 'everyday' }, partnerA.token),
        201,
      );
      const memory = created.memories.find((item) => item.title === 'Memory with uploaded asset');
      await test.step('Verify expected result', async () => {
        expect(memory?.linkedGardenObjectId).toEqual(expect.any(String));
      });

      const garden = await expectJson<GardenPayload>(await apiGetRaw(request, '/api/garden', partnerA.token));
      const object = garden.objects.find((item) => item.id === memory!.linkedGardenObjectId);
      await test.step('Verify expected result', async () => {
        expect(object).toEqual(expect.objectContaining({ assetKey, type: 'stone' }));
      });
      await test.step('Verify expected result', async () => {
        expect(garden.assetCatalog?.find((asset) => asset.key === assetKey)).toEqual(
          expect.objectContaining({ image: expect.stringMatching(/^\/uploads\/garden-assets\//), width: 72, height: 64 }),
        );
      });
    });
  });
});
