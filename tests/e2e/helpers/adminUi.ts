import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';

import { apiPostRaw } from './api';

import { testRunId } from './testUsers';

const mailpitUrl = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8025';

export type ContentType = 'daily-questions' | 'quests' | 'know-me-catalog' | 'love-jar-templates';

export interface AdminSettingsPayload {
  auth: { adminJwtTtlMinutes: number; userJwtTtlMinutes: number; };
  server: { publicBaseUrl: string; };
  passwordReset: { ttlMinutes: number; limitPer24h: number; };
  email: {
    enabled: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    smtpPassword?: string;
    smtpPasswordConfigured?: boolean;
    fromAddress: string;
    fromName: string;
    replyTo: string;
  };
}

export async function adminApiLogin(request: APIRequestContext) {
  const response = await apiPostRaw(request, '/api/admin/auth/login', { password: 'admin' });
  const payload = await response.json() as { token: string; };
  expect(payload.token).toBeTruthy();
  return payload.token;
}

export interface AdminNavTarget {
  navItem: string;
  url: RegExp;
  view: string;
}

export async function adminLogin(page: Page) {
  await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('admin-password').fill('admin');
  await page.getByTestId('admin-password').press('Enter');
  await expect(page).toHaveURL(/\/admin$/, { timeout: 30000 });
  await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 30000 });
}

export async function openAdminNavPage(page: Page, target: AdminNavTarget) {
  const deadline = Date.now() + 30000;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      if (!target.url.test(page.url())) {
        await page.getByTestId(`admin-nav-${target.navItem}`).click();
      }
      await expect(page).toHaveURL(target.url, { timeout: 5000 });
      await expect(page.getByTestId(target.view)).toBeVisible({ timeout: 5000 });
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export function uniqueAdminValue(prefix: string) {
  return `${prefix}-${testRunId()}`.toLowerCase();
}

export function slug(prefix: string) {
  return uniqueAdminValue(prefix).replace(/[^a-z0-9_]+/g, '_');
}

export function pngHeader(width: number, height: number) {
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

export function settingsInput(payload: AdminSettingsPayload) {
  const { smtpPasswordConfigured: _configured, smtpPassword: _password, ...email } = payload.email;
  return {
    auth: payload.auth,
    server: payload.server,
    passwordReset: payload.passwordReset,
    email,
  };
}

export async function clearMailbox(request: APIRequestContext) {
  await request.delete(`${mailpitUrl}/api/v1/messages`);
}

export async function latestMailFor(request: APIRequestContext, email: string) {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    const response = await request.get(`${mailpitUrl}/api/v1/messages`);
    const payload = await response.json() as { messages?: Array<{ ID: string; To?: Array<{ Address: string; }>; }>; };
    const message = payload.messages?.find((item) =>
      item.To?.some((recipient) => recipient.Address.toLowerCase() === email.toLowerCase()),
    );
    if (message) {
      const detailResponse = await request.get(`${mailpitUrl}/api/v1/message/${message.ID}`);
      return await detailResponse.json() as { Subject?: string; Text?: string; };
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`No email received for ${email}`);
}

export async function selectFirstRealOption(page: Page, testId: string) {
  await expect(page.locator(`[data-testid="${testId}"] option`).nth(1)).toBeAttached();
  await page.getByTestId(testId).selectOption({ index: 1 });
}

export async function tableRowByText(page: Page, rowTestIdPrefix: string, text: string) {
  const row = page.locator(`[data-testid^="${rowTestIdPrefix}"]`).filter({ hasText: text }).first();
  await expect(row).toBeVisible();
  return row;
}

export async function rowSpecificTestId(row: Locator) {
  const value = await row.getAttribute('data-testid');
  if (!value) throw new Error('Row has no data-testid');
  return value;
}

export async function createContentItem(page: Page, type: ContentType, label: string) {
  await page.getByTestId(`admin-content-tab-${type}`).click();
  await page.getByTestId('admin-content-new').click();
  await expect(page.getByTestId('admin-content-form')).toBeVisible();
  await page.getByTestId('admin-content-save').click();

  await selectFirstRealOption(page, 'admin-content-category');

  if (type === 'daily-questions') {
    await expect(page.getByTestId('admin-content-text-error')).toBeVisible();
    await page.getByTestId('admin-content-text').fill(label);
    await page.getByTestId('admin-content-depth').fill('2');
    await page.getByTestId('admin-content-long-distance').setChecked(false);
  }
  if (type === 'quests') {
    await expect(page.getByTestId('admin-content-title-error')).toBeVisible();
    await page.getByTestId('admin-content-title').fill(label);
    await page.getByTestId('admin-content-description').fill(`${label} Beschreibung`);
    await page.getByTestId('admin-content-minutes').fill('15');
    await page.getByTestId('admin-content-effort').selectOption('medium');
    await page.getByTestId('admin-content-reward-points').fill('12');
    await page.getByTestId('admin-content-seed').fill('test-seed');
    await page.getByTestId('admin-content-requires-both').setChecked(false);
  }
  if (type === 'know-me-catalog') {
    await expect(page.getByTestId('admin-content-question-text-error')).toBeVisible();
    await page.getByTestId('admin-content-question-text').fill(label);
    await page.getByTestId('admin-content-sort-order').fill('900');
  }
  if (type === 'love-jar-templates') {
    await expect(page.getByTestId('admin-content-text-error')).toBeVisible();
    await page.getByTestId('admin-content-love-jar-text').fill(label);
    await page.getByTestId('admin-content-sort-order').fill('901');
  }

  await page.getByTestId('admin-content-save').click();
  await expect(page.getByTestId('admin-content-form')).toHaveCount(0);
  await page.getByTestId('admin-content-search').fill(label);
  await page.getByRole('button', { name: 'Filtern' }).click();
  return tableRowByText(page, 'admin-content-row-', label);
}
