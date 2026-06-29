import { expect, test, type APIRequestContext } from '@playwright/test';
import { adminLogin, apiBaseURL, pngHeader } from '../../helpers/adminApi';
import { apiDeleteRaw, apiGet, apiGetRaw, apiPatchRaw, setupCoupleByApi } from '../../helpers/api';
import { expectApiError, expectJson } from '../../helpers/apiAssertions';
import { runDbSql } from '../../helpers/db';
import { testRunId, testUser } from '../../helpers/testUsers';

type MultipartFile = { name: string; mimeType: string; buffer: Buffer };
type MultipartValue = string | MultipartFile;
type MultipartPayload = Record<string, MultipartValue>;

interface GardenLevelItem {
  id: string;
  stage: number;
  name: string;
  pointsToNext: number | null;
  minimumPoints: number;
  areaKey: string;
  backgroundImage: string;
  accent: string;
  translations: Record<string, { name: string }>;
}

function validLevelMultipart(
  overrides: Record<string, MultipartValue | undefined> = {},
  options: { includeImage?: boolean; image?: MultipartFile } = {},
) {
  const multipart: MultipartPayload = {
    name: `Admin Garden ${testRunId()}`,
    pointsToNext: '150',
    accent: '#123456',
    translations: JSON.stringify({ de: { name: 'Admin Garten' }, en: { name: 'Admin Garden' } }),
  };

  for (const [field, value] of Object.entries(overrides)) {
    if (value === undefined) delete multipart[field];
    else multipart[field] = value;
  }

  if (options.includeImage !== false) {
    multipart.backgroundImage = options.image ?? {
      name: 'background.png',
      mimeType: 'image/png',
      buffer: pngHeader(700, 520),
    };
  }

  return multipart;
}

function validPatchMultipart(overrides: Record<string, MultipartValue | undefined> = {}, options: { image?: MultipartFile } = {}) {
  const multipart = validLevelMultipart(overrides, { includeImage: false });
  if (options.image) multipart.backgroundImage = options.image;
  return multipart;
}

async function createGardenLevel(request: APIRequestContext, token: string, overrides: Record<string, MultipartValue | undefined> = {}) {
  return expectJson<{ id: string; items: GardenLevelItem[] }>(
    await request.post(`${apiBaseURL}/api/admin/garden/levels`, {
      multipart: validLevelMultipart(overrides),
      headers: { Authorization: `Bearer ${token}` },
    }),
    201,
  );
}

test.describe('admin api / garden levels', () => {
  test('manages garden levels and recalculates existing gardens', async ({ request }) => {
    await test.step('Flow: manages garden levels and recalculates existing gardens', async () => {
      const token = await adminLogin(request);
      const sqlLiteral = (value: string) => `'${value.replace(/'/g, "''")}'`;
      const listed = await apiGet<{ items: GardenLevelItem[] }>(request, '/api/admin/garden/levels', token);
      expect(listed.items.length).toBeGreaterThanOrEqual(10);
      expect(listed.items[0]).toMatchObject({ stage: 1, minimumPoints: 0 });
      expect(listed.items[0]).toEqual(expect.objectContaining({ areaKey: expect.any(String), backgroundImage: expect.any(String), accent: expect.any(String) }));
      expect(listed.items[0].translations).toEqual(expect.any(Object));
      const englishListed = await apiGet<{ items: GardenLevelItem[] }>(request, '/api/admin/garden/levels?lang=en', token);
      expect(englishListed.items[0]).toEqual(expect.objectContaining({ name: expect.any(String), localizedName: expect.any(String) }));
      const stageOne = listed.items.find((item) => item.stage === 1)!;
      const originalStageOnePoints = stageOne.pointsToNext;

      const created = await createGardenLevel(request, token);
      expect(created.id).toBeTruthy();
      expect(created.items.at(-1)?.pointsToNext).toBeNull();
      expect(created.items.at(-1)).toEqual(expect.objectContaining({ backgroundImage: expect.stringMatching(/^\/uploads\/garden-backgrounds\//) }));

      await expectJson(await apiDeleteRaw(request, `/api/admin/garden/levels/${created.id}`, token));

      const runId = testRunId();
      const setup = await setupCoupleByApi(request, testUser('admin-garden-a', runId), testUser('admin-garden-b', runId));
      const couples = await apiGet<{ items: Array<{ id: string; inviteCode: string }> }>(
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
            multipart: validPatchMultipart({
              name: stageOne.name,
              pointsToNext: '80',
              accent: stageOne.accent,
              translations: JSON.stringify({ de: { name: stageOne.name } }),
            }),
            headers: { Authorization: `Bearer ${token}` },
          }),
        );

        const garden = await apiGet<{
          couple: { gardenStage: number; heartPoints: number };
          areas: Array<{ key: string; startX: number; width: number; backgroundImage: string; accent: string }>;
          assetCatalog: Array<{ key: string; image: string; active: boolean }>;
          objects: Array<{ label: string; areaKey: string; positionX: number; positionY: number; zIndex: number; placedByUser: boolean }>;
        }>(request, '/api/garden', setup.partnerA.token);
        expect(garden.couple.heartPoints).toBe(300);
        expect(garden.couple.gardenStage).toBe(4);
        expect(garden.areas[0]).toMatchObject({ startX: 0, width: 700, backgroundImage: expect.any(String), accent: expect.any(String) });
        expect(garden.areas[1]).toMatchObject({ startX: 700, width: 700 });
        expect(garden.assetCatalog.some((asset) => asset.key === 'garden_decor')).toBeTruthy();
        expect(garden.objects.find((object) => object.label === 'First reward')).toMatchObject({ areaKey: 'heart_bed', positionX: 21, positionY: 61, zIndex: 7, placedByUser: false });
        expect(garden.objects.find((object) => object.label === 'Boundary reward')).toMatchObject({ areaKey: 'flower_meadow', positionX: 42, positionY: 62, zIndex: 8, placedByUser: false });
        expect(garden.objects.find((object) => object.label === 'Zero reward')).toMatchObject({ areaKey: 'flower_meadow', positionX: 63, positionY: 63, zIndex: 9, placedByUser: false });
        expect(garden.objects.find((object) => object.label === 'Later reward')).toMatchObject({ areaKey: 'memory_tree', positionX: 84, positionY: 64, zIndex: 10, placedByUser: false });
      } finally {
        await request.patch(`${apiBaseURL}/api/admin/garden/levels/${stageOne.id}`, {
          multipart: validPatchMultipart({
            name: stageOne.name,
            pointsToNext: originalStageOnePoints === null ? '' : String(originalStageOnePoints),
            accent: stageOne.accent,
            translations: JSON.stringify({ de: { name: stageOne.name } }),
          }),
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    });
  });

  test('rejects invalid auth and query parameters', async ({ request }) => {
    const token = await adminLogin(request);
    const levels = await apiGet<{ items: GardenLevelItem[] }>(request, '/api/admin/garden/levels', token);
    const stageOne = levels.items[0];

    await test.step('Reject missing and invalid auth', async () => {
      await expectApiError(await apiGetRaw(request, '/api/admin/garden/levels'), 401, 'auth.missingToken');
      await expectApiError(await apiGetRaw(request, '/api/admin/garden/levels', 'not-a-token'), 401, 'auth.invalidToken');
      await expectApiError(await request.post(`${apiBaseURL}/api/admin/garden/levels`, { multipart: validLevelMultipart() }), 401, 'auth.missingToken');
      await expectApiError(
        await request.post(`${apiBaseURL}/api/admin/garden/levels`, { multipart: validLevelMultipart(), headers: { Authorization: 'Bearer not-a-token' } }),
        401,
        'auth.invalidToken',
      );
      await expectApiError(await apiPatchRaw(request, `/api/admin/garden/levels/${stageOne.id}`, {}, undefined), 401, 'auth.missingToken');
      await expectApiError(await apiPatchRaw(request, `/api/admin/garden/levels/${stageOne.id}`, {}, 'not-a-token'), 401, 'auth.invalidToken');
      await expectApiError(await apiDeleteRaw(request, `/api/admin/garden/levels/${stageOne.id}`), 401, 'auth.missingToken');
      await expectApiError(await apiDeleteRaw(request, `/api/admin/garden/levels/${stageOne.id}`, 'not-a-token'), 401, 'auth.invalidToken');
    });

    await test.step('Reject invalid query parameters', async () => {
      for (const path of [
        '/api/admin/garden/levels?unexpected=true',
        '/api/admin/garden/levels?lang=de-DE-extra',
      ]) {
        await expectApiError(await apiGetRaw(request, path, token), 400, 'common.validation');
      }
      await expectApiError(
        await request.post(`${apiBaseURL}/api/admin/garden/levels?unexpected=true`, { multipart: validLevelMultipart(), headers: { Authorization: `Bearer ${token}` } }),
        400,
        'common.validation',
      );
      await expectApiError(
        await request.patch(`${apiBaseURL}/api/admin/garden/levels/${stageOne.id}?lang=de-DE-extra`, { multipart: validPatchMultipart(), headers: { Authorization: `Bearer ${token}` } }),
        400,
        'common.validation',
      );
      await expectApiError(await apiDeleteRaw(request, `/api/admin/garden/levels/${stageOne.id}?unexpected=true`, token), 400, 'common.validation');
    });
  });

  test('rejects invalid garden level create payloads and uploads', async ({ request }) => {
    const token = await adminLogin(request);

    await expectApiError(
      await request.post(`${apiBaseURL}/api/admin/garden/levels`, {
        multipart: validLevelMultipart({}, { includeImage: false }),
        headers: { Authorization: `Bearer ${token}` },
      }),
      400,
      'admin.gardenLevel.backgroundRequired',
    );

    const invalidBusinessPayloads: Array<{ overrides: Record<string, MultipartValue | undefined>; errorKey: string }> = [
      { overrides: { name: ' ' }, errorKey: 'admin.gardenLevel.nameRequired' },
      { overrides: { accent: undefined }, errorKey: 'admin.gardenLevel.accentRequired' },
      { overrides: { accent: 'red' }, errorKey: 'admin.gardenLevel.accentRequired' },
      { overrides: { pointsToNext: undefined }, errorKey: 'admin.gardenLevel.newLevelPointsRequired' },
      { overrides: { pointsToNext: '0' }, errorKey: 'admin.gardenLevel.pointsMustBePositive' },
    ];

    for (const invalid of invalidBusinessPayloads) {
      await expectApiError(
        await request.post(`${apiBaseURL}/api/admin/garden/levels`, {
          multipart: validLevelMultipart(invalid.overrides),
          headers: { Authorization: `Bearer ${token}` },
        }),
        400,
        invalid.errorKey,
      );
    }

    const invalidShapePayloads: Array<Record<string, MultipartValue | undefined>> = [
      { pointsToNext: '-1' },
      { pointsToNext: '1.5' },
      { pointsToNext: 'abc' },
      { translations: 'not-json' },
      { translations: JSON.stringify([]) },
      { translations: JSON.stringify({ 'de-extra': { name: 'Name' } }) },
      { translations: JSON.stringify({ de: null }) },
      { translations: JSON.stringify({ de: { name: '' } }) },
      { translations: JSON.stringify({ de: { name: 'Name', extra: true } }) },
    ];

    for (const overrides of invalidShapePayloads) {
      await expectApiError(
        await request.post(`${apiBaseURL}/api/admin/garden/levels`, {
          multipart: validLevelMultipart(overrides),
          headers: { Authorization: `Bearer ${token}` },
        }),
        400,
        'common.validation',
      );
    }

    await expectApiError(
      await request.post(`${apiBaseURL}/api/admin/garden/levels`, {
        multipart: validLevelMultipart({ translations: JSON.stringify({ xx: { name: 'Unsupported' } }) }),
        headers: { Authorization: `Bearer ${token}` },
      }),
      400,
      'admin.gardenLevel.translationInvalid',
    );

    await expectApiError(
      await request.post(`${apiBaseURL}/api/admin/garden/levels`, {
        multipart: validLevelMultipart({}, { image: { name: 'wrong-size.png', mimeType: 'image/png', buffer: pngHeader(10, 10) } }),
        headers: { Authorization: `Bearer ${token}` },
      }),
      400,
      'admin.upload.invalidDimensions',
    );
    await expectApiError(
      await request.post(`${apiBaseURL}/api/admin/garden/levels`, {
        multipart: validLevelMultipart({}, { image: { name: 'background.txt', mimeType: 'text/plain', buffer: Buffer.from('plain text') } }),
        headers: { Authorization: `Bearer ${token}` },
      }),
      400,
      'admin.upload.invalidImage',
    );
    await expectApiError(
      await request.post(`${apiBaseURL}/api/admin/garden/levels`, {
        multipart: validLevelMultipart({}, { image: { name: 'background.png', mimeType: 'image/png', buffer: Buffer.from('not an image') } }),
        headers: { Authorization: `Bearer ${token}` },
      }),
      400,
      'admin.upload.invalidImage',
    );
  });

  test('rejects invalid garden level patch and delete operations', async ({ request }) => {
    const token = await adminLogin(request);
    const levels = await apiGet<{ items: GardenLevelItem[] }>(request, '/api/admin/garden/levels', token);
    const stageOne = levels.items.find((item) => item.stage === 1)!;
    const lastLevel = levels.items.at(-1)!;

    const patchNotFoundPayload = validPatchMultipart({ name: 'Missing Level', pointsToNext: '150', accent: '#123456' });
    for (const id of ['00000000-0000-4000-8000-000000000999', 'not-a-uuid']) {
      await expectApiError(
        await request.patch(`${apiBaseURL}/api/admin/garden/levels/${id}`, { multipart: patchNotFoundPayload, headers: { Authorization: `Bearer ${token}` } }),
        404,
        'admin.gardenLevelNotFound',
      );
      await expectApiError(await apiDeleteRaw(request, `/api/admin/garden/levels/${id}`, token), 404, 'admin.gardenLevelNotFound');
    }

    await expectApiError(await apiDeleteRaw(request, `/api/admin/garden/levels/${stageOne.id}`, token), 400, 'admin.gardenLevel.cannotDeleteFirstStage');

    await expectApiError(
      await request.patch(`${apiBaseURL}/api/admin/garden/levels/${stageOne.id}`, {
        multipart: validPatchMultipart({ name: ' ', pointsToNext: String(stageOne.pointsToNext ?? 150), accent: stageOne.accent }),
        headers: { Authorization: `Bearer ${token}` },
      }),
      400,
      'admin.gardenLevel.nameRequired',
    );
    await expectApiError(
      await request.patch(`${apiBaseURL}/api/admin/garden/levels/${stageOne.id}`, {
        multipart: validPatchMultipart({ name: stageOne.name, pointsToNext: String(stageOne.pointsToNext ?? 150), accent: 'red' }),
        headers: { Authorization: `Bearer ${token}` },
      }),
      400,
      'admin.gardenLevel.accentRequired',
    );
    await expectApiError(
      await request.patch(`${apiBaseURL}/api/admin/garden/levels/${stageOne.id}`, {
        multipart: validPatchMultipart({ name: stageOne.name, pointsToNext: '', accent: stageOne.accent }),
        headers: { Authorization: `Bearer ${token}` },
      }),
      400,
      'admin.gardenLevel.intermediatePointsRequired',
    );
    await expectApiError(
      await request.patch(`${apiBaseURL}/api/admin/garden/levels/${stageOne.id}`, {
        multipart: validPatchMultipart({ name: stageOne.name, pointsToNext: '0', accent: stageOne.accent }),
        headers: { Authorization: `Bearer ${token}` },
      }),
      400,
      'admin.gardenLevel.pointsMustBePositive',
    );

    for (const overrides of [
      { pointsToNext: '-1' },
      { pointsToNext: '1.5' },
      { translations: 'not-json' },
      { translations: JSON.stringify({ de: { name: '' } }) },
    ] satisfies Array<Record<string, MultipartValue | undefined>>) {
      await expectApiError(
        await request.patch(`${apiBaseURL}/api/admin/garden/levels/${stageOne.id}`, {
          multipart: validPatchMultipart({ name: stageOne.name, pointsToNext: String(stageOne.pointsToNext ?? 150), accent: stageOne.accent, ...overrides }),
          headers: { Authorization: `Bearer ${token}` },
        }),
        400,
        'common.validation',
      );
    }

    await expectApiError(
      await request.patch(`${apiBaseURL}/api/admin/garden/levels/${stageOne.id}`, {
        multipart: validPatchMultipart({ name: stageOne.name, pointsToNext: String(stageOne.pointsToNext ?? 150), accent: stageOne.accent, translations: JSON.stringify({ xx: { name: 'Unsupported' } }) }),
        headers: { Authorization: `Bearer ${token}` },
      }),
      400,
      'admin.gardenLevel.translationInvalid',
    );
    await expectApiError(
      await request.patch(`${apiBaseURL}/api/admin/garden/levels/${stageOne.id}`, {
        multipart: validPatchMultipart(
          { name: stageOne.name, pointsToNext: String(stageOne.pointsToNext ?? 150), accent: stageOne.accent },
          { image: { name: 'wrong-size.png', mimeType: 'image/png', buffer: pngHeader(10, 10) } },
        ),
        headers: { Authorization: `Bearer ${token}` },
      }),
      400,
      'admin.upload.invalidDimensions',
    );
    await expectApiError(
      await request.patch(`${apiBaseURL}/api/admin/garden/levels/${stageOne.id}`, {
        multipart: validPatchMultipart(
          { name: stageOne.name, pointsToNext: String(stageOne.pointsToNext ?? 150), accent: stageOne.accent },
          { image: { name: 'background.png', mimeType: 'image/png', buffer: Buffer.from('not an image') } },
        ),
        headers: { Authorization: `Bearer ${token}` },
      }),
      400,
      'admin.upload.invalidImage',
    );

    const lastPatch = await expectJson<{ items: GardenLevelItem[] }>(
      await request.patch(`${apiBaseURL}/api/admin/garden/levels/${lastLevel.id}`, {
        multipart: validPatchMultipart({ name: lastLevel.name, pointsToNext: '', accent: lastLevel.accent, translations: JSON.stringify({ de: { name: lastLevel.name } }) }),
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(lastPatch.items.find((item) => item.id === lastLevel.id)?.pointsToNext).toBeNull();
  });
});