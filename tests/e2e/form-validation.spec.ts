import { expect, test, type Browser, type Locator } from '@playwright/test';
import { registerAndCreateCouple } from './helpers/auth';
import { testRunId, testUser } from './helpers/testUsers';

async function setupAuthenticatedPage(browser: Browser, prefix: string) {
  const runId = testRunId();
  const context = await browser.newContext();
  const page = await context.newPage();
  await registerAndCreateCouple(page, testUser(prefix, runId));
  return { context, page };
}

async function expectRequiredFeedback(locator: Locator) {
  await expect
    .poll(() => locator.evaluate((element: HTMLInputElement | HTMLTextAreaElement) => element.validity.valueMissing))
    .toBe(true);
  await expect
    .poll(() => locator.evaluate((element) => getComputedStyle(element).borderTopColor))
    .toBe('rgb(214, 69, 61)');
}

test('memories marks missing title and does not create an entry', async ({ browser }) => {
  const { context, page } = await setupAuthenticatedPage(browser, 'validation-memory');

  await page.goto('/memories');
  await page.getByTestId('memory-save').click();

  await expectRequiredFeedback(page.getByTestId('memory-title'));
  await expect(page.getByTestId('memory-item')).toHaveCount(0);

  await context.close();
});

test('love jar marks missing note text and does not create a note', async ({ browser }) => {
  const { context, page } = await setupAuthenticatedPage(browser, 'validation-lovejar');

  await page.goto('/love-jar');
  await expect(page.getByTestId('love-jar-templates')).toBeVisible();
  await page.getByTestId('love-jar-note-input').fill('');
  await expect(page.getByTestId('love-jar-note-input')).toHaveValue('');
  await expect(page.getByTestId('love-jar-save')).toBeEnabled();
  await page.getByTestId('love-jar-save').click();

  await expectRequiredFeedback(page.getByTestId('love-jar-note-input'));
  await expect(page.getByTestId('love-jar-note')).toHaveCount(0);

  await context.close();
});

test('today marks missing answer and does not save it', async ({ browser }) => {
  const { context, page } = await setupAuthenticatedPage(browser, 'validation-today');

  await page.goto('/today');
  await page.getByTestId('today-answer-input').fill('');
  await page.getByTestId('today-answer-submit').click();

  await expectRequiredFeedback(page.getByTestId('today-answer-input'));
  await expect(page.getByTestId('today-waiting-status')).toBeHidden();

  await context.close();
});

test('onboarding marks required register and login fields', async ({ page }) => {
  await page.goto('/onboarding');
  await page.getByTestId('auth-mode-register').click();
  await page.getByTestId('auth-submit').click();

  await expectRequiredFeedback(page.getByTestId('auth-display-name'));
  await expectRequiredFeedback(page.getByTestId('auth-email'));
  await expectRequiredFeedback(page.getByTestId('auth-password'));

  await page.getByTestId('auth-mode-login').click();
  await page.getByTestId('auth-submit').click();

  await expectRequiredFeedback(page.getByTestId('auth-email'));
  await expectRequiredFeedback(page.getByTestId('auth-password'));
});

test('know me marks missing question and first two answers', async ({ browser }) => {
  const { context, page } = await setupAuthenticatedPage(browser, 'validation-knowme');

  await page.goto('/know-me');
  await page.getByTestId('know-me-create-submit').click();

  await expectRequiredFeedback(page.getByTestId('know-me-question-input'));
  await expectRequiredFeedback(page.getByTestId('know-me-option-0'));
  await expectRequiredFeedback(page.getByTestId('know-me-option-1'));
  await expect(page.getByTestId('know-me-own-card')).toHaveCount(0);

  await context.close();
});
