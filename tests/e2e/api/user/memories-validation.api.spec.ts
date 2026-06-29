import { expect, test, type APIResponse } from '@playwright/test';

import { apiGetRaw, apiPostRaw, registerByApi, setupCoupleByApi } from '../../helpers/api';
import { expectApiError, expectJson, type MemoriesPayload } from '../../helpers/apiAssertions';
import { testRunId, testUser } from '../../helpers/testUsers';

async function expectRejected(response: APIResponse) {
  await expectApiError(response, 400, 'rejected');
}

test.describe('user api / memories validation', () => {
  test('rejects unauthenticated access', async ({ request }) => {
    await test.step('Reject: list memories without auth token', async () => {
      await expectApiError(await apiGetRaw(request, '/api/memories'), 401, 'auth.missingToken');
    });

    await test.step('Reject: create memory without auth token', async () => {
      await expectApiError(await apiPostRaw(request, '/api/memories', { title: 'No token memory' }), 401, 'auth.missingToken');
    });
  });

  test('rejects invalid locale query parameters', async ({ request }) => {
    const runId = testRunId();
    const { partnerA } = await setupCoupleByApi(
      request,
      testUser('api-memory-query-a', runId),
      testUser('api-memory-query-b', runId),
    );

    const invalidQueries = ['unexpected=true', 'lang=de-DE-extra', 'lang=en&lang=de', 'lang='];

    for (const query of invalidQueries) {
      await test.step(`Reject: list memories with invalid query ${query}`, async () => {
        await expectRejected(await apiGetRaw(request, `/api/memories?${query}`, partnerA.token));
      });

      await test.step(`Reject: create memory with invalid query ${query}`, async () => {
        await expectRejected(await apiPostRaw(request, `/api/memories?${query}`, { title: 'Invalid query memory' }, partnerA.token));
      });
    }
  });

  test('rejects no-couple access while keeping domain error keys', async ({ request }) => {
    const noCouple = await registerByApi(request, testUser('api-memory-no-couple', testRunId()));

    await test.step('Reject: list memories without couple', async () => {
      await expectApiError(await apiGetRaw(request, '/api/memories', noCouple.token), 409, 'couple.notConnected');
    });

    await test.step('Reject: create memory without couple', async () => {
      await expectApiError(await apiPostRaw(request, '/api/memories', { title: 'No couple memory' }, noCouple.token), 409, 'couple.notConnected');
    });
  });

  test('rejects invalid memory payload shapes', async ({ request }) => {
    const runId = testRunId();
    const { partnerA } = await setupCoupleByApi(
      request,
      testUser('api-memory-shape-a', runId),
      testUser('api-memory-shape-b', runId),
    );

    const validPayload = { title: 'Valid memory', description: 'Description', date: '2026-06-09', category: 'everyday' };
    const invalidPayloads: Array<{ name: string; body: unknown }> = [
      { name: 'unknown field', body: { ...validPayload, extra: true } },
      { name: 'numeric title', body: { ...validPayload, title: 123 } },
      { name: 'numeric description', body: { ...validPayload, description: 123 } },
      { name: 'numeric date', body: { ...validPayload, date: 20260609 } },
      { name: 'numeric category', body: { ...validPayload, category: 123 } },
    ];

    for (const { name, body } of invalidPayloads) {
      await test.step(`Reject: memory payload shape ${name}`, async () => {
        await expectRejected(await apiPostRaw(request, '/api/memories', body, partnerA.token));
      });
    }
  });

  test('rejects invalid memory payload values', async ({ request }) => {
    const runId = testRunId();
    const { partnerA } = await setupCoupleByApi(
      request,
      testUser('api-memory-values-a', runId),
      testUser('api-memory-values-b', runId),
    );

    const invalidPayloads: Array<{ name: string; body: unknown }> = [
      { name: 'missing title', body: {} },
      { name: 'blank title', body: { title: '   ' } },
      { name: 'malformed date', body: { title: 'Bad date', date: '09.06.2026' } },
      { name: 'impossible calendar date', body: { title: 'Impossible date', date: '2026-02-30' } },
      { name: 'out-of-range date components', body: { title: 'Out of range date', date: '2026-99-99' } },
      { name: 'invalid category', body: { title: 'Bad category', category: 'bad' } },
    ];

    for (const { name, body } of invalidPayloads) {
      await test.step(`Reject: memory payload value ${name}`, async () => {
        await expectRejected(await apiPostRaw(request, '/api/memories', body, partnerA.token));
      });
    }
  });

  test('accepts nullable description and defaults blank date', async ({ request }) => {
    const runId = testRunId();
    const { partnerA } = await setupCoupleByApi(
      request,
      testUser('api-memory-null-description-a', runId),
      testUser('api-memory-null-description-b', runId),
    );

    await test.step('Flow: create memory with null description and blank date', async () => {
      const payload = await expectJson<MemoriesPayload>(
        await apiPostRaw(request, '/api/memories', { title: 'Nullable description memory', description: null, date: '   ' }, partnerA.token),
        201,
      );
      const memory = payload.memories.find((item) => item.title === 'Nullable description memory');
      expect(memory).toBeTruthy();
      expect(memory?.date).toEqual(expect.stringMatching(/^\d{4}-\d{2}-\d{2}/));
    });
  });
});
