import { expect, test, type APIRequestContext } from '@playwright/test';
import { apiGetRaw, apiPatchRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../helpers/api';
import {
  expectApiError,
  expectGardenObjectDetailPayload,
  expectGardenPayload,
  expectJson,
  expectLoveJarPayload,
  expectMemoriesPayload,
  type GardenObjectDetailPayload,
  type GardenPayload,
  type LoveJarPayload,
  type MemoriesPayload,
} from '../helpers/apiAssertions';
import { runDbSql } from '../helpers/db';
import { testRunId, testUser } from '../helpers/testUsers';

const apiBaseURL = process.env.E2E_API_URL ?? 'http://localhost:3001';

function sqlLiteral(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

async function adminLogin(request: APIRequestContext) {
  const response = await apiPostRaw(request, '/api/admin/auth/login', { password: 'admin' });
  const payload = await expectJson<{ token: string }>(response);
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

test.describe('love jar api', () => {
  test('creates draws and blocks duplicate daily draw', async ({ request }) => {
    const runId = testRunId();
    const { partnerA, partnerB } = await setupCoupleByApi(
      request,
      testUser('api-love-a', runId),
      testUser('api-love-b', runId),
    );

    const empty = await expectJson<LoveJarPayload>(await apiGetRaw(request, '/api/love-jar', partnerB.token));
    expectLoveJarPayload(empty);
    expect(empty.notes).toHaveLength(0);

    const templatesDe = await expectJson<{
      categories: Array<{ value: string; label: string }>;
      templates: Array<{ category: string; categoryLabel: string }>;
    }>(
      await apiGetRaw(request, '/api/love-jar/templates', partnerB.token),
    );
    expect(templatesDe.categories.find((category) => category.value === 'compliment')?.label).toBe('Kompliment');
    expect(templatesDe.templates.find((template) => template.category === 'compliment')?.categoryLabel).toBe('Kompliment');
    const templatesEn = await expectJson<{
      categories: Array<{ value: string; label: string }>;
      templates: Array<{ category: string; categoryLabel: string }>;
    }>(
      await apiGetRaw(request, '/api/love-jar/templates', partnerB.token, { 'Accept-Language': 'en' }),
    );
    expect(templatesEn.categories.find((category) => category.value === 'compliment')?.label).toBe('Compliment');
    expect(templatesEn.templates.find((template) => template.category === 'compliment')?.categoryLabel).toBe('Compliment');

    const created = await expectJson<LoveJarPayload>(
      await apiPostRaw(request, '/api/love-jar', { text: 'API note', category: 'compliment' }, partnerA.token),
      201,
    );
    expectLoveJarPayload(created);
    expect(created.notes.some((note) => note.text === null && note.category === 'compliment')).toBeTruthy();
    expect(created.notes.find((note) => note.category === 'compliment')?.categoryLabel).toBe('Kompliment');

    const drawn = await expectJson<LoveJarPayload>(await apiPostRaw(request, '/api/love-jar/draw', {}, partnerB.token));
    expectLoveJarPayload(drawn);
    expect(drawn.drawStatus.drawnToday).toBeTruthy();
    expect(drawn.notes.some((note) => note.text === 'API note' && note.isDrawn)).toBeTruthy();

    await expectApiError(await apiPostRaw(request, '/api/love-jar/draw', {}, partnerB.token), 409, 'loveJar.alreadyDrawnToday');
  });

  test('draw does not open own note when no partner note exists', async ({ request }) => {
    const runId = testRunId();
    const { partnerA } = await setupCoupleByApi(
      request,
      testUser('api-love-own-a', runId),
      testUser('api-love-own-b', runId),
    );

    const created = await expectJson<LoveJarPayload>(
      await apiPostRaw(request, '/api/love-jar', { text: 'Own fallback note', category: 'compliment' }, partnerA.token),
      201,
    );
    expect(created.drawStatus.ownUnreadCount).toBeGreaterThanOrEqual(1);
    expect(created.drawStatus.partnerUnreadCount).toBe(0);
    expect(created.drawStatus.canDrawToday).toBe(false);

    await expectApiError(await apiPostRaw(request, '/api/love-jar/draw', {}, partnerA.token), 404, 'loveJar.noUnreadNote');

    const afterDrawAttempt = await expectJson<LoveJarPayload>(await apiGetRaw(request, '/api/love-jar', partnerA.token));
    expect(afterDrawAttempt.drawStatus.drawnToday).toBe(false);
    expect(afterDrawAttempt.notes).toEqual(
      expect.arrayContaining([expect.objectContaining({ authorId: partnerA.user.id, text: null, isDrawn: false })]),
    );
  });

  test('rejects invalid love jar states', async ({ request }) => {
    const noCouple = await registerByApi(request, testUser('api-love-no-couple', testRunId()));
    const runId = testRunId();
    const { partnerA } = await setupCoupleByApi(
      request,
      testUser('api-love-invalid-a', runId),
      testUser('api-love-invalid-b', runId),
    );

    await expectApiError(await apiGetRaw(request, '/api/love-jar', noCouple.token), 409, 'couple.notConnected');
    await expectApiError(
      await apiPostRaw(request, '/api/love-jar', { text: 'No couple' }, noCouple.token),
      409,
      'couple.notConnected',
    );
    await expectApiError(await apiPostRaw(request, '/api/love-jar', {}, partnerA.token), 400, 'loveJar.noteRequired');
    await expectApiError(await apiPostRaw(request, '/api/love-jar', { text: '' }, partnerA.token), 400, 'loveJar.noteRequired');
    await expectApiError(
      await apiPostRaw(request, '/api/love-jar', { text: 'Bad category', category: 'bad' }, partnerA.token),
      400,
      'loveJar.invalidCategory',
    );
    await expectApiError(await apiPostRaw(request, '/api/love-jar/draw', {}, partnerA.token), 404, 'loveJar.noUnreadNote');
  });
});

test.describe('memories and garden api', () => {
  test('creates memory and returns garden object detail', async ({ request }) => {
    const runId = testRunId();
    const { partnerA } = await setupCoupleByApi(
      request,
      testUser('api-memory-a', runId),
      testUser('api-memory-b', runId),
    );

    const emptyMemories = await expectJson<MemoriesPayload>(await apiGetRaw(request, '/api/memories', partnerA.token));
    expectMemoriesPayload(emptyMemories);
    expect(emptyMemories.memories).toHaveLength(0);
    expect(emptyMemories.categories?.find((category) => category.value === 'everyday')?.label).toBe('Alltag');

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
    expect(memory).toBeTruthy();
    expect(memory?.categoryLabel).toBe('Alltag');
    expect(memory?.linkedGardenObjectId).toEqual(expect.any(String));

    const englishMemories = await expectJson<MemoriesPayload>(
      await apiGetRaw(request, '/api/memories', partnerA.token, { 'Accept-Language': 'en' }),
    );
    expect(englishMemories.memories.find((item) => item.title === 'API Memory')?.categoryLabel).toBe('Everyday');
    expect(englishMemories.categories?.find((category) => category.value === 'everyday')?.label).toBe('Everyday');

    const garden = await expectJson<GardenPayload>(await apiGetRaw(request, '/api/garden', partnerA.token));
    expectGardenPayload(garden);
    expect(garden.areas.length).toBeGreaterThanOrEqual(10);
    expect(garden.unlocks.find((unlock) => unlock.stage === 10)?.points).toBe(1800);
    expect(garden.availableAssets.every((asset) => asset.stageUnlock <= garden.couple.gardenStage)).toBeTruthy();
    expect(garden.assetCatalog?.some((asset) => asset.key === 'memory_stone')).toBeTruthy();
    expect(garden.nextUnlock).toEqual(expect.objectContaining({ stage: expect.any(Number), pointsRemaining: expect.any(Number) }));
    expect(garden.progress.memoryCount).toBeGreaterThanOrEqual(1);
    const object = garden.objects.find((item) => item.id === memory!.linkedGardenObjectId);
    expect(object).toBeTruthy();
    expect(object).toEqual(expect.objectContaining({ areaKey: 'heart_bed', assetKey: 'memory_stone' }));

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

    const placed = await expectJson<{ object: GardenPayload['objects'][number] }>(
      await apiPatchRaw(
        request,
        `/api/garden/objects/${object!.id}/placement`,
        { areaKey: 'heart_bed', positionX: 42, positionY: 58, zIndex: 7, scale: 1.1, rotation: -4 },
        partnerA.token,
      ),
    );
    expect(placed.object).toEqual(
      expect.objectContaining({ areaKey: 'heart_bed', positionX: 42, positionY: 58, zIndex: 7, placedByUser: true }),
    );

    const partiallyPlaced = await expectJson<{ object: GardenPayload['objects'][number] }>(
      await apiPatchRaw(request, `/api/garden/objects/${object!.id}/placement`, { rotation: 3 }, partnerA.token),
    );
    expect(partiallyPlaced.object).toEqual(
      expect.objectContaining({ areaKey: 'heart_bed', positionX: 42, positionY: 58, zIndex: 7, rotation: 3 }),
    );

    const detail = await expectJson<GardenObjectDetailPayload>(
      await apiGetRaw(request, `/api/garden/objects/${object!.id}`, partnerA.token),
    );
    expectGardenObjectDetailPayload(detail);
    expect(detail.source).toEqual(expect.objectContaining({ type: 'memory', title: 'API Memory', categoryLabel: 'Alltag' }));

    await expectApiError(
      await apiGetRaw(request, `/api/garden/objects/${encodeURIComponent(`${object!.id}' OR '1'='1`)}`, partnerA.token),
      404,
      'garden.objectNotFound',
    );
  });

  test('rejects invalid memories and no-couple garden access', async ({ request }) => {
    const noCouple = await registerByApi(request, testUser('api-memory-no-couple', testRunId()));
    const runId = testRunId();
    const { partnerA } = await setupCoupleByApi(
      request,
      testUser('api-memory-invalid-a', runId),
      testUser('api-memory-invalid-b', runId),
    );

    await expectApiError(await apiGetRaw(request, '/api/memories', noCouple.token), 409, 'couple.notConnected');
    await expectApiError(await apiGetRaw(request, '/api/garden', noCouple.token), 409, 'couple.notConnected');
    await expectApiError(
      await apiGetRaw(request, '/api/garden/objects/00000000-0000-0000-0000-000000000000', noCouple.token),
      409,
      'couple.notConnected',
    );
    await expectApiError(await apiPostRaw(request, '/api/memories', {}, partnerA.token), 400, 'memory.titleRequired');
    await expectApiError(await apiPostRaw(request, '/api/memories', { title: '' }, partnerA.token), 400, 'memory.titleRequired');
    await expectApiError(
      await apiPostRaw(request, '/api/memories', { title: 'Bad date', date: '09.06.2026' }, partnerA.token),
      400,
      'memory.invalidDate',
    );
    await expectApiError(
      await apiPostRaw(request, '/api/memories', { title: 'Bad category', category: 'bad' }, partnerA.token),
      400,
      'memory.invalidCategory',
    );
  });

  test('memory rewards use unlocked areas after stage progression', async ({ request }) => {
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
    expect(memory?.linkedGardenObjectId).toEqual(expect.any(String));
    const garden = await expectJson<GardenPayload>(await apiGetRaw(request, '/api/garden', partnerA.token));
    const object = garden.objects.find((item) => item.id === memory!.linkedGardenObjectId);
    expect(object).toEqual(expect.objectContaining({ areaKey: 'memory_tree' }));
    expect(['memory_stone', 'polaroid_frame']).toContain(object?.assetKey);
  });

  test('memory rewards can use uploaded matching garden assets', async ({ request }) => {
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
    expect(memory?.linkedGardenObjectId).toEqual(expect.any(String));

    const garden = await expectJson<GardenPayload>(await apiGetRaw(request, '/api/garden', partnerA.token));
    const object = garden.objects.find((item) => item.id === memory!.linkedGardenObjectId);
    expect(object).toEqual(expect.objectContaining({ assetKey, type: 'stone' }));
    expect(garden.assetCatalog?.find((asset) => asset.key === assetKey)).toEqual(
      expect.objectContaining({ image: expect.stringMatching(/^\/uploads\/garden-assets\//), width: 72, height: 64 }),
    );
  });

  test('returns not found for missing and foreign garden objects', async ({ request }) => {
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

    await expectApiError(
      await apiGetRaw(request, '/api/garden/objects/00000000-0000-0000-0000-000000000000', coupleA.partnerA.token),
      404,
      'garden.objectNotFound',
    );

    await expectJson<MemoriesPayload>(
      await apiPostRaw(request, '/api/memories', { title: 'Foreign object source' }, coupleA.partnerA.token),
      201,
    );
    const gardenA = await expectJson<GardenPayload>(await apiGetRaw(request, '/api/garden', coupleA.partnerA.token));
    expectGardenPayload(gardenA);
    const foreignObjectId = gardenA.objects[0].id;

    await expectApiError(
      await apiGetRaw(request, `/api/garden/objects/${foreignObjectId}`, coupleB.partnerA.token),
      404,
      'garden.objectNotFound',
    );
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
