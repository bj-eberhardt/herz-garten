import { expect, type APIRequestContext, type Browser, type BrowserContext, type Page } from '@playwright/test';

import { authenticatePage, setupCoupleByApi } from './api';

import { expectJson } from './apiAssertions';

import { testRunId, testUser } from './testUsers';

const apiBaseURL = process.env.E2E_API_URL ?? 'http://localhost:3001';

type AuthSession = { token: string; user: { id: string; displayName: string; email: string; }; };

interface SetupPagesResult {
  contextA: BrowserContext;
  contextB: BrowserContext;
  pageA: Page;
  pageB: Page;
  partnerA: AuthSession;
  partnerB: AuthSession;
  inviteCode: string;
}

export async function setupPages(browser: Browser, request: APIRequestContext, prefix: string): Promise<SetupPagesResult> {

  const runId = testRunId();

  const userA = testUser(`${prefix}-a`, runId);

  const userB = testUser(`${prefix}-b`, runId);

  const { partnerA, partnerB, inviteCode } = await setupCoupleByApi(request, userA, userB);

  const contextA = await browser.newContext();

  const contextB = await browser.newContext();

  const pageA = await contextA.newPage();

  const pageB = await contextB.newPage();

  await authenticatePage(contextA, pageA, partnerA.token);

  await authenticatePage(contextB, pageB, partnerB.token);

  return { contextA, contextB, pageA, pageB, partnerA, partnerB, inviteCode };

}

export async function openNotifications(page: Page) {

  await page.goto('/notifications');

  await expect(page.getByTestId('notification-item').first()).toBeVisible();

}

export async function adminLogin(request: APIRequestContext) {

  const response = await request.post(`${apiBaseURL}/api/admin/auth/login`, { data: { password: 'admin' } });

  const payload = await expectJson<{ token: string; }>(response);

  return payload.token;

}
