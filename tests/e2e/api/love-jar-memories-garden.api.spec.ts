import { expect, test } from '@playwright/test';
import { apiGetRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../helpers/api';
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
import { testRunId, testUser } from '../helpers/testUsers';

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

    const created = await expectJson<LoveJarPayload>(
      await apiPostRaw(request, '/api/love-jar', { text: 'API note', category: 'compliment' }, partnerA.token),
      201,
    );
    expectLoveJarPayload(created);
    expect(created.notes.some((note) => note.text === null && note.category === 'compliment')).toBeTruthy();

    const drawn = await expectJson<LoveJarPayload>(await apiPostRaw(request, '/api/love-jar/draw', {}, partnerB.token));
    expectLoveJarPayload(drawn);
    expect(drawn.drawStatus.drawnToday).toBeTruthy();
    expect(drawn.notes.some((note) => note.text === 'API note' && note.isDrawn)).toBeTruthy();

    await expectApiError(await apiPostRaw(request, '/api/love-jar/draw', {}, partnerB.token), 409, 'loveJar.alreadyDrawnToday');
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
    expect(memory?.linkedGardenObjectId).toEqual(expect.any(String));

    const garden = await expectJson<GardenPayload>(await apiGetRaw(request, '/api/garden', partnerA.token));
    expectGardenPayload(garden);
    expect(garden.progress.memoryCount).toBeGreaterThanOrEqual(1);
    const object = garden.objects.find((item) => item.id === memory!.linkedGardenObjectId);
    expect(object).toBeTruthy();

    const detail = await expectJson<GardenObjectDetailPayload>(
      await apiGetRaw(request, `/api/garden/objects/${object!.id}`, partnerA.token),
    );
    expectGardenObjectDetailPayload(detail);
    expect(detail.source).toEqual(expect.objectContaining({ type: 'memory', title: 'API Memory' }));
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
  });
});
