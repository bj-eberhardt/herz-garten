import type { APIRequestContext, BrowserContext, Page } from '@playwright/test';
import type { TestUser } from './testUsers';

const apiBaseURL = process.env.E2E_API_URL ?? 'http://localhost:3001';

function authHeaders(token?: string, headers: Record<string, string> = {}) {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
}

interface AuthResponse {
  token: string;
  user: { id: string; displayName: string; email: string };
}

export async function apiPost<T>(
  request: APIRequestContext,
  path: string,
  body: unknown,
  token?: string,
): Promise<T> {
  const response = await request.post(`${apiBaseURL}${path}`, {
    data: body,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok()) {
    throw new Error(`${path} failed with ${response.status()}: ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

export async function apiGet<T>(request: APIRequestContext, path: string, token?: string): Promise<T> {
  const response = await request.get(`${apiBaseURL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok()) {
    throw new Error(`${path} failed with ${response.status()}: ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

export async function apiGetRaw(
  request: APIRequestContext,
  path: string,
  token?: string,
  headers: Record<string, string> = {},
) {
  return request.get(`${apiBaseURL}${path}`, {
    headers: authHeaders(token, headers),
  });
}

export async function apiPostRaw(
  request: APIRequestContext,
  path: string,
  body: unknown = {},
  token?: string,
  headers: Record<string, string> = {},
) {
  return request.post(`${apiBaseURL}${path}`, {
    data: body,
    headers: authHeaders(token, headers),
  });
}

export async function apiPatchRaw(
  request: APIRequestContext,
  path: string,
  body: unknown = {},
  token?: string,
  headers: Record<string, string> = {},
) {
  return request.patch(`${apiBaseURL}${path}`, {
    data: body,
    headers: authHeaders(token, headers),
  });
}

export async function apiDeleteRaw(
  request: APIRequestContext,
  path: string,
  token?: string,
  headers: Record<string, string> = {},
) {
  return request.delete(`${apiBaseURL}${path}`, {
    headers: authHeaders(token, headers),
  });
}

export async function registerByApi(request: APIRequestContext, user: TestUser) {
  return apiPost<AuthResponse>(request, '/api/auth/register', user);
}

export async function createCoupleByApi(request: APIRequestContext, token: string) {
  return apiPost<{ couple: { inviteCode: string } }>(
    request,
    '/api/couples',
    { relationshipType: 'mixed', contentPreference: 'balanced' },
    token,
  );
}

export async function joinCoupleByApi(request: APIRequestContext, token: string, inviteCode: string) {
  return apiPost(request, '/api/couples/join', { inviteCode }, token);
}

export async function setupCoupleByApi(request: APIRequestContext, userA: TestUser, userB: TestUser) {
  const partnerA = await registerByApi(request, userA);
  const partnerB = await registerByApi(request, userB);
  const couple = await createCoupleByApi(request, partnerA.token);
  await joinCoupleByApi(request, partnerB.token, couple.couple.inviteCode);
  return { partnerA, partnerB, inviteCode: couple.couple.inviteCode };
}

export async function authenticatePage(context: BrowserContext, page: Page, token: string) {
  await page.goto('/onboarding');
  await page.evaluate((authToken) => {
    window.localStorage.setItem('herzgarten_token', authToken);
  }, token);
  await page.goto('/today');
}
