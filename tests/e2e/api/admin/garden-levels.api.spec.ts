import { expect, test } from '@playwright/test';
import { adminLogin, apiBaseURL, gardenLevelMultipart, pngHeader } from '../../helpers/adminApi';
import { apiDeleteRaw, apiGet, setupCoupleByApi } from '../../helpers/api';
import { expectApiError, expectJson } from '../../helpers/apiAssertions';
import { runDbSql } from '../../helpers/db';
import { testRunId, testUser } from '../../helpers/testUsers';

test.describe('admin api / garden levels', () => {
  test('manages garden levels and recalculates existing gardens', async ({ request }) => {
    await test.step('Flow: manages garden levels and recalculates existing gardens', async () => {
      const token = await adminLogin(request);
      const sqlLiteral = (value: string) => `'${value.replace(/'/g, "''")}'`;
      const listed = await apiGet<{
        items: Array<{ id: string; stage: number; name: string; pointsToNext: number | null; minimumPoints: number; accent: string; }>;
      }>(request, '/api/admin/garden/levels', token);
      await test.step('Verify expected result', async () => {
        expect(listed.items.length).toBeGreaterThanOrEqual(10);
      });
      await test.step('Verify expected result', async () => {
        expect(listed.items[0]).toMatchObject({ stage: 1, minimumPoints: 0 });
      });
      await test.step('Verify expected result', async () => {
        expect(listed.items[0]).toEqual(expect.objectContaining({ areaKey: expect.any(String), backgroundImage: expect.any(String), accent: expect.any(String) }));
      });
      const stageOne = listed.items.find((item) => item.stage === 1)!;
      const originalStageOnePoints = stageOne.pointsToNext;

      const invalid = await request.post(`${apiBaseURL}/api/admin/garden/levels`, {
        multipart: gardenLevelMultipart({ name: '', pointsToNext: -1, image: pngHeader(700, 520) }),
        headers: { Authorization: `Bearer ${token}` },
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(invalid, 400, 'admin.gardenLevel.nameRequired');
      });

      const invalidSize = await request.post(`${apiBaseURL}/api/admin/garden/levels`, {
        multipart: gardenLevelMultipart({ name: 'Wrong size', pointsToNext: 150, image: pngHeader(10, 10) }),
        headers: { Authorization: `Bearer ${token}` },
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(invalidSize, 400, 'admin.upload.invalidDimensions');
      });

      const created = await expectJson<{
        id: string;
        items: Array<{ id: string; stage: number; pointsToNext: number | null; backgroundImage: string; }>;
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
      await test.step('Verify expected result', async () => {
        expect(created.id).toBeTruthy();
      });
      await test.step('Verify expected result', async () => {
        expect(created.items.at(-1)?.pointsToNext).toBeNull();
      });
      await test.step('Verify expected result', async () => {
        expect(created.items.at(-1)).toEqual(expect.objectContaining({ backgroundImage: expect.stringMatching(/^\/uploads\/garden-backgrounds\//) }));
      });

      await expectJson(await apiDeleteRaw(request, `/api/admin/garden/levels/${created.id}`, token));

      const runId = testRunId();
      const setup = await setupCoupleByApi(request, testUser('admin-garden-a', runId), testUser('admin-garden-b', runId));
      const couples = await apiGet<{ items: Array<{ id: string; inviteCode: string; }>; }>(
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
          couple: { gardenStage: number; heartPoints: number; };
          areas: Array<{ key: string; startX: number; width: number; backgroundImage: string; accent: string; }>;
          assetCatalog: Array<{ key: string; image: string; active: boolean; }>;
          objects: Array<{ label: string; areaKey: string; positionX: number; positionY: number; zIndex: number; placedByUser: boolean; }>;
        }>(request, '/api/garden', setup.partnerA.token);
        expect(garden.couple.heartPoints).toBe(300);
        expect(garden.couple.gardenStage).toBe(4);
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
          areaKey: 'memory_tree',
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
  });
});
