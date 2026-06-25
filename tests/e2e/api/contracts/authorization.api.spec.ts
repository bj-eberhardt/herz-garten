import { test, type APIRequestContext } from '@playwright/test';

import { apiDeleteRaw, apiGetRaw, apiPatchRaw, apiPostRaw } from '../../helpers/api';

import { expectApiError } from '../../helpers/apiAssertions';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const protectedEndpoints: Array<{ method: Method; path: string; body?: unknown; }> = [
  { method: 'GET', path: '/api/me' },
  { method: 'PATCH', path: '/api/me/preferences', body: { featureExplainers: { today: false } } },
  { method: 'GET', path: '/api/notifications' },
  { method: 'POST', path: '/api/notifications/read-all' },
  { method: 'POST', path: '/api/notifications/not-a-notification/read' },
  { method: 'GET', path: '/api/me/export' },
  { method: 'DELETE', path: '/api/me' },
  { method: 'POST', path: '/api/couples' },
  { method: 'POST', path: '/api/couples/join', body: { inviteCode: 'apfel-sonne-0000' } },
  { method: 'POST', path: '/api/couples/leave' },
  { method: 'GET', path: '/api/today' },
  { method: 'POST', path: '/api/today/answer', body: { answerText: 'Test' } },
  { method: 'GET', path: '/api/quests' },
  { method: 'POST', path: '/api/quests/not-a-quest/accept' },
  { method: 'POST', path: '/api/quests/not-a-quest/complete' },
  { method: 'GET', path: '/api/know-me' },
  { method: 'POST', path: '/api/know-me', body: { questionText: 'Q', options: ['A', 'B'], correctOptionIndex: 0 } },
  { method: 'POST', path: '/api/know-me/not-a-question/guess', body: { selectedOptionIndex: 0 } },
  { method: 'GET', path: '/api/love-jar' },
  { method: 'POST', path: '/api/love-jar', body: { text: 'Note' } },
  { method: 'POST', path: '/api/love-jar/draw' },
  { method: 'GET', path: '/api/memories' },
  { method: 'POST', path: '/api/memories', body: { title: 'Memory' } },
  { method: 'GET', path: '/api/garden' },
  { method: 'GET', path: '/api/garden/objects/not-an-object' },
];

async function callEndpoint(request: APIRequestContext, endpoint: (typeof protectedEndpoints)[number], token?: string) {
  if (endpoint.method === 'GET') return apiGetRaw(request, endpoint.path, token);
  if (endpoint.method === 'PATCH') return apiPatchRaw(request, endpoint.path, endpoint.body ?? {}, token);
  if (endpoint.method === 'DELETE') return apiDeleteRaw(request, endpoint.path, token);
  return apiPostRaw(request, endpoint.path, endpoint.body ?? {}, token);
}

test.describe('api contracts / authorization', () => {
  for (const endpoint of protectedEndpoints) {
    test(`${endpoint.method} ${endpoint.path} rejects missing token`, async ({ request }) => {
      await test.step(`Flow: ${endpoint.method} ${endpoint.path} rejects missing token`, async () => {
        await test.step('Verify API error response', async () => {
          await expectApiError(await callEndpoint(request, endpoint), 401, 'auth.missingToken');
        });
      });
    });

    test(`${endpoint.method} ${endpoint.path} rejects invalid token`, async ({ request }) => {
      await test.step(`Flow: ${endpoint.method} ${endpoint.path} rejects invalid token`, async () => {
        await test.step('Verify API error response', async () => {
          await expectApiError(await callEndpoint(request, endpoint, 'invalid-token'), 401, 'auth.invalidToken');
        });
      });
    });
  }
});
