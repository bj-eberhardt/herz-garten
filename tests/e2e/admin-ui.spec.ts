import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { apiGet, apiPatchRaw, apiPostRaw, setupCoupleByApi } from './helpers/api';
import { testRunId, testUser } from './helpers/testUsers';

const apiBaseURL = process.env.E2E_API_URL ?? 'http://localhost:3001';
const mailpitUrl = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8025';

type ContentType = 'daily-questions' | 'quests' | 'know-me-catalog' | 'love-jar-templates';

interface AdminSettingsPayload {
  auth: { adminJwtTtlMinutes: number; userJwtTtlMinutes: number };
  server: { publicBaseUrl: string };
  passwordReset: { ttlMinutes: number; limitPer24h: number };
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

async function adminApiLogin(request: APIRequestContext) {
  const response = await apiPostRaw(request, '/api/admin/auth/login', { password: 'admin' });
  const payload = await response.json() as { token: string };
  expect(payload.token).toBeTruthy();
  return payload.token;
}

async function adminLogin(page: Page) {
  await page.goto('/admin/login');
  await page.evaluate(() => window.localStorage.removeItem('herzgarten_admin_token'));
  await page.reload();
  await page.getByTestId('admin-password').fill('admin');
  await page.getByTestId('admin-login-submit').click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByTestId('admin-dashboard')).toBeVisible();
}

function uniqueAdminValue(prefix: string) {
  return `${prefix}-${testRunId()}`.toLowerCase();
}

function slug(prefix: string) {
  return uniqueAdminValue(prefix).replace(/[^a-z0-9_]+/g, '_');
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

function settingsInput(payload: AdminSettingsPayload) {
  const { smtpPasswordConfigured: _configured, smtpPassword: _password, ...email } = payload.email;
  return {
    auth: payload.auth,
    server: payload.server,
    passwordReset: payload.passwordReset,
    email,
  };
}

async function clearMailbox(request: APIRequestContext) {
  await request.delete(`${mailpitUrl}/api/v1/messages`);
}

async function latestMailFor(request: APIRequestContext, email: string) {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    const response = await request.get(`${mailpitUrl}/api/v1/messages`);
    const payload = await response.json() as { messages?: Array<{ ID: string; To?: Array<{ Address: string }> }> };
    const message = payload.messages?.find((item) =>
      item.To?.some((recipient) => recipient.Address.toLowerCase() === email.toLowerCase()),
    );
    if (message) {
      const detailResponse = await request.get(`${mailpitUrl}/api/v1/message/${message.ID}`);
      return await detailResponse.json() as { Subject?: string; Text?: string };
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`No email received for ${email}`);
}

async function selectFirstRealOption(page: Page, testId: string) {
  await expect(page.locator(`[data-testid="${testId}"] option`).nth(1)).toBeAttached();
  await page.getByTestId(testId).selectOption({ index: 1 });
}

async function tableRowByText(page: Page, rowTestIdPrefix: string, text: string) {
  const row = page.locator(`[data-testid^="${rowTestIdPrefix}"]`).filter({ hasText: text }).first();
  await expect(row).toBeVisible();
  return row;
}

async function rowSpecificTestId(row: Locator) {
  const value = await row.getAttribute('data-testid');
  if (!value) throw new Error('Row has no data-testid');
  return value;
}

async function createContentItem(page: Page, type: ContentType, label: string) {
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

test.describe('admin ui', () => {
  test('authenticates, protects admin routes and logs out', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.locator('.bottom-nav')).toHaveCount(0);

    await page.getByTestId('admin-password').fill('wrong-password');
    await page.getByTestId('admin-login-submit').click();
    await expect(page.getByTestId('admin-login-error')).toBeVisible();
    await expect(page.getByTestId('admin-password')).toHaveValue('');

    await page.getByTestId('admin-password').fill('admin');
    await page.getByTestId('admin-login-submit').click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByTestId('admin-dashboard')).toBeVisible();
    await expect(page.getByTestId('admin-default-password-warning')).toBeVisible();

    for (const navItem of [
      'dashboard',
      'users',
      'couples',
      'content',
      'garden',
      'garden-assets',
      'categories',
      'taxonomies',
      'messages',
      'settings',
      'audit-log',
    ]) {
      await expect(page.getByTestId(`admin-nav-${navItem}`)).toBeVisible();
    }

    await page.getByTestId('admin-logout').click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.evaluate(() => window.localStorage.getItem('herzgarten_admin_token'))).resolves.toBeNull();
  });

  test('searches users and couples, resets passwords and downloads exports', async ({ page, request }) => {
    test.setTimeout(60000);
    const runId = testRunId();
    const userA = testUser('admin-ui-user-a', runId);
    const userB = testUser('admin-ui-user-b', runId);
    const setup = await setupCoupleByApi(request, userA, userB);

    await adminLogin(page);
    await page.getByTestId('admin-nav-users').click();
    await page.getByTestId('admin-users-search').fill(userA.email);
    await page.getByTestId('admin-users-search-submit').click();
    await expect(page.locator('.admin-table')).toContainText(userA.email);

    const userJsonDownload = page.waitForEvent('download');
    await page.getByTestId('admin-users-export-json').click();
    expect((await userJsonDownload).suggestedFilename()).toBe('herzgarten-users.json');
    const userCsvDownload = page.waitForEvent('download');
    await page.getByTestId('admin-users-export-csv').click();
    expect((await userCsvDownload).suggestedFilename()).toBe('herzgarten-users.csv');

    await page.getByTestId('admin-user-password-reset-open').first().click();
    await expect(page.getByTestId('admin-user-password-reset-form')).toBeVisible();
    await page.getByTestId('admin-user-password-reset-input').fill('short');
    await page.getByTestId('admin-user-password-reset-save').click();
    await expect(page.getByTestId('admin-user-password-reset-error')).toBeVisible();
    await page.getByTestId('admin-user-password-reset-close').click();
    await expect(page.getByTestId('admin-user-password-reset-form')).toHaveCount(0);

    await clearMailbox(request);
    await page.getByTestId('admin-user-password-reset-open').first().click();
    await page.getByTestId('admin-user-password-reset-input').fill(`Admin-ui-reset-${runId}`);
    await page.getByTestId('admin-user-password-reset-save').click();
    await expect(page.getByTestId('admin-user-password-reset-success')).toContainText(userA.displayName);
    const adminResetMail = await latestMailFor(request, userA.email);
    expect(adminResetMail.Subject).toMatch(/Herzgarten.*(Passwort|password)/i);

    await page.locator('[data-testid^="admin-user-couple-filter-"]').first().click();
    await expect(page).toHaveURL(new RegExp(`/admin/couples\\?search=${setup.inviteCode}`));
    await expect(page.getByTestId('admin-couples-search')).toHaveValue(setup.inviteCode);

    const coupleJsonDownload = page.waitForEvent('download');
    await page.getByTestId('admin-couples-export-json').click();
    expect((await coupleJsonDownload).suggestedFilename()).toBe('herzgarten-couples.json');
    const coupleCsvDownload = page.waitForEvent('download');
    await page.getByTestId('admin-couples-export-csv').click();
    expect((await coupleCsvDownload).suggestedFilename()).toBe('herzgarten-couples.csv');

    await page.locator('[data-testid^="admin-couple-member-filter-"]').first().click();
    await expect(page).toHaveURL(new RegExp(`/admin/users\\?search=${userA.email}`));
    await page.getByTestId('admin-nav-couples').click();
    await page.getByTestId('admin-couples-search').fill(setup.inviteCode);
    await page.getByTestId('admin-couples-search-submit').click();
    await page.locator('[data-testid^="admin-couple-details-"]').first().click();
    await expect(page.getByTestId('admin-couple-detail')).toBeVisible();
    await page.getByTestId('admin-couple-relationship-type').selectOption('long_distance');
    await page.getByTestId('admin-couple-content-preference').selectOption('deep');
    await page.getByTestId('admin-couple-preferences-save').click();
    await expect(page.getByTestId('admin-couple-preferences-success')).toBeVisible();
    await page.getByTestId('admin-couple-detail-back').click();
    await expect(page).toHaveURL(new RegExp(`/admin/couples\\?search=${setup.inviteCode}`));
  });

  test('validates and saves settings', async ({ page, request }) => {
    const token = await adminApiLogin(request);
    const original = await apiGet<AdminSettingsPayload>(request, '/api/admin/settings', token);

    await adminLogin(page);
    await page.getByTestId('admin-nav-settings').click();
    await expect(page.getByTestId('admin-settings')).toBeVisible();

    try {
      const originalAdminTtl = await page.getByTestId('admin-settings-admin-jwt-ttl').inputValue();
      const originalUserTtl = await page.getByTestId('admin-settings-user-jwt-ttl').inputValue();
      await page.getByTestId('admin-settings-admin-jwt-ttl').fill('0');
      await page.getByTestId('admin-settings-save').click();
      await expect(page.getByTestId('admin-settings-error')).toBeVisible();
      await page.getByTestId('admin-settings-admin-jwt-ttl').fill(originalAdminTtl);

      await page.getByTestId('admin-settings-user-jwt-ttl').fill('43201');
      await page.getByTestId('admin-settings-save').click();
      await expect(page.getByTestId('admin-settings-error')).toBeVisible();
      await page.getByTestId('admin-settings-user-jwt-ttl').fill(originalUserTtl);

      await page.getByTestId('admin-settings-public-base-url').fill('not-a-url');
      await page.getByTestId('admin-settings-save').click();
      await expect(page.getByTestId('admin-settings-error')).toBeVisible();
      await page.getByTestId('admin-settings-public-base-url').fill('http://localhost:5174');

      await page.getByTestId('admin-settings-reset-ttl').fill('1');
      await page.getByTestId('admin-settings-save').click();
      await expect(page.getByTestId('admin-settings-error')).toBeVisible();
      await page.getByTestId('admin-settings-reset-ttl').fill('30');

      await page.getByTestId('admin-settings-reset-limit').fill('0');
      await page.getByTestId('admin-settings-save').click();
      await expect(page.getByTestId('admin-settings-error')).toBeVisible();
      await page.getByTestId('admin-settings-reset-limit').fill('5');

      await page.getByTestId('admin-settings-email-enabled').setChecked(true);
      await page.getByTestId('admin-settings-email-host').fill('');
      await page.getByTestId('admin-settings-save').click();
      await expect(page.getByTestId('admin-settings-error')).toBeVisible();
      await page.getByTestId('admin-settings-email-host').fill('mailpit');

      await page.getByTestId('admin-settings-email-port').fill('70000');
      await page.getByTestId('admin-settings-save').click();
      await expect(page.getByTestId('admin-settings-error')).toBeVisible();
      await page.getByTestId('admin-settings-email-port').fill('1025');

      await page.getByTestId('admin-settings-email-from').fill('invalid-email');
      await page.getByTestId('admin-settings-save').click();
      await expect(page.getByTestId('admin-settings-error')).toBeVisible();
      await page.getByTestId('admin-settings-email-from').fill('noreply@herzgarten.test');

      await page.getByTestId('admin-settings-email-reply-to').fill('invalid-reply');
      await page.getByTestId('admin-settings-save').click();
      await expect(page.getByTestId('admin-settings-error')).toBeVisible();
      await page.getByTestId('admin-settings-email-reply-to').fill('');

      await page.getByTestId('admin-settings-admin-jwt-ttl').fill('61');
      await page.getByTestId('admin-settings-user-jwt-ttl').fill('10081');
      await page.getByTestId('admin-settings-email-password').fill(`smtp-${testRunId()}`);
      await page.getByTestId('admin-settings-save').click();
      await expect(page.getByTestId('admin-settings-success')).toBeVisible();
      await expect(page.getByTestId('admin-settings-email-password')).toHaveValue('');
    } finally {
      await apiPatchRaw(request, '/api/admin/settings', settingsInput(original), token);
    }
  });

  test('creates, edits, deactivates and reactivates all content types', async ({ page }) => {
    test.setTimeout(90000);
    await adminLogin(page);
    await page.getByTestId('admin-nav-content').click();

    for (const type of ['daily-questions', 'quests', 'know-me-catalog', 'love-jar-templates'] satisfies ContentType[]) {
      const label = `UI ${type} ${testRunId()}`;
      const editedLabel = `${label} edited`;
      const row = await createContentItem(page, type, label);
      const rowId = await rowSpecificTestId(row);

      await page.getByTestId(`${rowId.replace('admin-content-row-', 'admin-content-edit-')}`).click();
      if (type === 'quests') await page.getByTestId('admin-content-title').fill(editedLabel);
      else if (type === 'know-me-catalog') await page.getByTestId('admin-content-question-text').fill(editedLabel);
      else if (type === 'love-jar-templates') await page.getByTestId('admin-content-love-jar-text').fill(editedLabel);
      else await page.getByTestId('admin-content-text').fill(editedLabel);
      await page.getByTestId('admin-content-save').click();
      await page.getByTestId('admin-content-search').fill(editedLabel);
      await page.getByRole('button', { name: 'Filtern' }).click();
      const editedRow = await tableRowByText(page, 'admin-content-row-', editedLabel);
      const editedRowId = await rowSpecificTestId(editedRow);

      await page.getByTestId(`${editedRowId.replace('admin-content-row-', 'admin-content-deactivate-')}`).click();
      await page.getByTestId('admin-content-active-filter').selectOption('false');
      await expect(await tableRowByText(page, 'admin-content-row-', editedLabel)).toBeVisible();
      await page.getByTestId(`${editedRowId.replace('admin-content-row-', 'admin-content-reactivate-')}`).click();
      await page.getByTestId('admin-content-active-filter').selectOption('true');
      await expect(await tableRowByText(page, 'admin-content-row-', editedLabel)).toBeVisible();

      await page.getByTestId('admin-content-new').click();
      await page.getByTestId('admin-content-form-close').click();
      await expect(page.getByTestId('admin-content-form')).toHaveCount(0);
      await page.getByTestId('admin-content-active-filter').selectOption('all');
    }
  });

  test('creates, edits and deletes categories and edits taxonomies', async ({ page }) => {
    test.setTimeout(90000);
    await adminLogin(page);

    await page.getByTestId('admin-nav-taxonomies').click();
    const relationshipValue = slug('ui_relationship');
    const styleValue = slug('ui_style');

    for (const [kind, value, label] of [
      ['relationship-modes', relationshipValue, `UI Beziehung ${testRunId()}`],
      ['content-styles', styleValue, `UI Stil ${testRunId()}`],
    ] as const) {
      await page.getByTestId(`admin-preference-tab-${kind}`).click();
      await page.getByTestId('admin-preference-new').click();
      await page.getByTestId('admin-preference-save').click();
      await expect(page.getByTestId('admin-preference-error')).toBeVisible();
      await page.getByTestId('admin-preference-value').fill(value);
      await page.getByTestId('admin-preference-label').fill(label);
      await page.getByTestId('admin-preference-sort-order').fill('777');
      await page.getByTestId('admin-preference-save').click();
      const row = await tableRowByText(page, 'admin-preference-row-', label);
      const rowId = await rowSpecificTestId(row);
      await page.getByTestId(rowId.replace('admin-preference-row-', 'admin-preference-edit-')).click();
      await page.getByTestId('admin-preference-label').fill(`${label} bearbeitet`);
      await page.getByTestId('admin-preference-active').setChecked(false);
      await page.getByTestId('admin-preference-save').click();
      await expect(await tableRowByText(page, 'admin-preference-row-', `${label} bearbeitet`)).toContainText('inaktiv');
    }

    await page.getByTestId('admin-nav-categories').click();
    await page.getByTestId('admin-category-tab-daily-questions').click();
    await expect(page.locator('[data-testid^="admin-category-delete-"]').first()).toBeDisabled();
    await page.getByTestId('admin-category-new').click();
    await page.getByTestId('admin-category-save').click();
    await expect(page.getByTestId('admin-category-error')).toBeVisible();

    const categoryValue = slug('ui_category');
    const categoryLabel = `UI Kategorie ${testRunId()}`;
    await page.getByTestId('admin-category-value').fill(categoryValue);
    await page.getByTestId('admin-category-label').fill(categoryLabel);
    await page.getByTestId('admin-category-sort-order').fill('778');
    await page.getByTestId('admin-category-save').click();
    const categoryRow = await tableRowByText(page, 'admin-category-row-', categoryLabel);
    const categoryRowId = await rowSpecificTestId(categoryRow);

    await page.getByTestId(categoryRowId.replace('admin-category-row-', 'admin-category-edit-')).click();
    await page.getByTestId('admin-category-label').fill(`${categoryLabel} bearbeitet`);
    await page.getByTestId('admin-category-active').setChecked(false);
    await page.getByTestId('admin-category-save').click();
    const editedCategoryRow = await tableRowByText(page, 'admin-category-row-', `${categoryLabel} bearbeitet`);
    await expect(editedCategoryRow).toContainText('inaktiv');
    const editedCategoryRowId = await rowSpecificTestId(editedCategoryRow);
    await page.getByTestId(editedCategoryRowId.replace('admin-category-row-', 'admin-category-delete-')).click();
    await expect(page.getByTestId(editedCategoryRowId)).toHaveCount(0);
  });

  test('searches, validates and saves message templates', async ({ page, request }) => {
    const token = await adminApiLogin(request);
    const key = 'notifications.bodies.questWaitingConfirmation';
    const listed = await apiGet<{
      items: Array<{ key: string; translations: Record<string, { text: string; description: string }> }>;
    }>(request, '/api/admin/message-templates?namespace=notifications', token);
    const original = listed.items.find((item) => item.key === key)?.translations;
    if (!original) throw new Error(`Missing template ${key}`);

    await adminLogin(page);
    await page.getByTestId('admin-nav-messages').click();

    try {
      await page.getByTestId('admin-message-search').fill(key);
      await expect(page.getByTestId(`admin-message-row-${key}`)).toBeVisible();
      await page.getByTestId('admin-message-search').fill('');
      await page.getByTestId('admin-message-channel-push').click();
      await expect(page.locator('[data-testid^="admin-message-row-push."]').first()).toBeVisible();
      await page.getByTestId('admin-message-channel-email').click();
      await expect(page.locator('[data-testid^="admin-message-row-emails."]').first()).toBeVisible();
      await page.getByTestId('admin-message-channel-notifications').click();
      await page.getByTestId('admin-message-search').fill(key);
      await page.getByTestId(`admin-message-edit-${key}`).click();
      await expect(page.getByTestId('admin-message-form')).toBeVisible();

      await page.getByTestId('admin-message-text-de').fill('{name} wartet.');
      await page.getByTestId('admin-message-save').click();
      await expect(page.getByTestId('admin-message-error')).toHaveCount(0);
      await expect(page.getByText(/\{title\}/)).toBeVisible();

      const customText = `Admin UI: {name} wartet bei "{title}" ${testRunId()}.`;
      await page.getByTestId('admin-message-text-de').fill(customText);
      await page.getByTestId('admin-message-description-de').fill('Admin UI Test');
      await page.getByTestId('admin-message-save').click();
      await expect(page.getByTestId('admin-message-success')).toBeVisible();
      await expect(page.getByTestId('admin-message-form')).toHaveCount(0);
      await expect(page.getByTestId(`admin-message-row-${key}`)).toContainText(customText);
    } finally {
      await apiPatchRaw(request, `/api/admin/message-templates/${key}`, { translations: original }, token);
    }
  });

  test('creates, edits and deletes garden levels and edits garden assets', async ({ page }) => {
    test.setTimeout(90000);
    await adminLogin(page);

    await page.getByTestId('admin-nav-garden').click();
    await expect(page.locator('[data-testid^="admin-garden-level-delete-"], [data-testid="admin-garden-level-delete"]').first()).toBeDisabled();
    await page.getByTestId('admin-garden-level-new').click();
    await page.getByTestId('admin-garden-level-save').click();
    await expect(page.getByTestId('admin-garden-level-error')).toBeVisible();

    const levelName = `UI Garten ${testRunId()}`;
    await page.getByTestId('admin-garden-level-name').fill(levelName);
    await page.getByTestId('admin-garden-level-accent').fill('#446688');
    await page.getByTestId('admin-garden-level-points').fill('175');
    await page.getByTestId('admin-garden-level-save').click();
    await expect(page.getByTestId('admin-garden-level-error')).toBeVisible();
    await page.getByTestId('admin-garden-level-background').setInputFiles({
      name: 'background.png',
      mimeType: 'image/png',
      buffer: pngHeader(700, 520),
    });
    await page.getByTestId('admin-garden-level-save').click();
    const levelRow = await tableRowByText(page, 'admin-garden-level-row-', levelName);
    const levelRowId = await rowSpecificTestId(levelRow);
    await page.getByTestId(levelRowId.replace('admin-garden-level-row-', 'admin-garden-level-edit-')).click();
    const editedLevelName = `${levelName} bearbeitet`;
    await page.getByTestId('admin-garden-level-name').fill(editedLevelName);
    await page.getByTestId('admin-garden-level-name-de').fill(editedLevelName);
    await page.getByTestId('admin-garden-level-points').fill('190');
    await page.getByTestId('admin-garden-level-save').click();
    const editedLevelRow = await tableRowByText(page, 'admin-garden-level-row-', editedLevelName);
    await editedLevelRow.getByTestId('admin-garden-level-delete').click();
    await expect(page.locator('.admin-table')).not.toContainText(editedLevelName);

    await page.getByTestId('admin-nav-garden-assets').click();
    await page.getByTestId('admin-garden-asset-new').click();
    await page.getByTestId('admin-garden-asset-save').click();
    await expect(page.getByTestId('admin-garden-asset-error')).toBeVisible();

    const assetKey = slug('asset_ui');
    const assetLabel = `UI Asset ${testRunId()}`;
    await page.getByTestId('admin-garden-asset-key').fill(assetKey);
    await page.getByTestId('admin-garden-asset-label').fill(assetLabel);
    await page.getByTestId('admin-garden-asset-stage').selectOption('1');
    await page.getByTestId('admin-garden-asset-source-types').selectOption(['quest']);
    await page.getByTestId('admin-garden-asset-sort-order').fill('999');
    await page.getByTestId('admin-garden-asset-image').setInputFiles({
      name: 'asset.png',
      mimeType: 'image/png',
      buffer: pngHeader(64, 80),
    });
    await page.getByTestId('admin-garden-asset-save').click();
    const assetRow = await tableRowByText(page, 'admin-garden-asset-row-', assetLabel);
    const assetRowId = await rowSpecificTestId(assetRow);
    await page.getByTestId(assetRowId.replace('admin-garden-asset-row-', 'admin-garden-asset-edit-')).click();
    await expect(page.getByTestId('admin-garden-asset-key')).toBeDisabled();
    await page.getByTestId('admin-garden-asset-label').fill(`${assetLabel} bearbeitet`);
    await page.getByTestId('admin-garden-asset-active').setChecked(false);
    await page.getByTestId('admin-garden-asset-source-types').selectOption(['quest', 'memory']);
    await page.getByTestId('admin-garden-asset-anchor-x').fill('0.25');
    await page.getByTestId('admin-garden-asset-anchor-y').fill('0.75');
    await page.getByTestId('admin-garden-asset-save').click();
    await expect(await tableRowByText(page, 'admin-garden-asset-row-', `${assetLabel} bearbeitet`)).toContainText('Inaktiv');
  });

  test('shows audit log entries for representative admin mutations', async ({ page }) => {
    await adminLogin(page);
    await page.getByTestId('admin-nav-audit-log').click();
    await expect(page.getByTestId('admin-audit-log')).toBeVisible();
    await expect(page.getByTestId('admin-audit-log')).toContainText(/app-settings|love-jar-templates|garden-level|category|message-template/);
  });
});
