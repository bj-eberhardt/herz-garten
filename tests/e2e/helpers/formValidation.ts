import { expect, type APIRequestContext, type Browser, type Locator } from '@playwright/test';
import { authenticatePage, setupCoupleByApi } from './api';
import { testRunId, testUser } from './testUsers';

export async function setupAuthenticatedPage(browser: Browser, request: APIRequestContext, prefix: string) {
  const runId = testRunId();
  const { partnerA } = await setupCoupleByApi(
    request,
    testUser(`${prefix}-a`, runId),
    testUser(`${prefix}-b`, runId),
  );
  const context = await browser.newContext();
  const page = await context.newPage();
  await authenticatePage(context, page, partnerA.token);
  await expect(page.getByTestId('nav-love-jar')).toBeVisible();
  return { context, page };
}

export async function expectRequiredFeedback(locator: Locator) {
  await expect
    .poll(() => locator.evaluate((element: HTMLInputElement | HTMLTextAreaElement) => element.validity.valueMissing))
    .toBe(true);
  await expect
    .poll(() => locator.evaluate((element) => getComputedStyle(element).borderTopColor))
    .toBe('rgb(214, 69, 61)');
}
