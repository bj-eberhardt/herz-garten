import { expect, type Page } from '@playwright/test';
import type { TestUser } from './testUsers';

export async function registerViaUi(page: Page, user: TestUser) {
  await page.goto('/onboarding');
  await page.getByTestId('auth-mode-register').click();
  await page.getByTestId('auth-display-name').fill(user.displayName);
  await page.getByTestId('auth-email').fill(user.email);
  await page.getByTestId('auth-password').fill(user.password);
  await page.getByTestId('auth-submit').click();
  await expect(page.getByTestId('create-couple-form')).toBeVisible();
}

export async function loginViaUi(page: Page, user: TestUser) {
  await page.goto('/onboarding');
  await page.getByTestId('auth-mode-login').click();
  await page.getByTestId('auth-email').fill(user.email);
  await page.getByTestId('auth-password').fill(user.password);
  await page.getByTestId('auth-submit').click();
}

export async function createCoupleViaUi(page: Page) {
  await page.getByTestId('create-couple-submit').click();
  await expect(page.getByTestId('invite-code-modal')).toBeVisible();
  const inviteCode = (await page.getByTestId('invite-modal-code').innerText()).trim();
  await expect(page.getByTestId('invite-modal-code')).toContainText(/^[a-z]+-[a-z]+-\d{4}$/);
  await page.getByTestId('invite-modal-confirm').click();
  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByTestId('header-couple-link')).toContainText(/^[a-z]+-[a-z]+-\d{4}$/);
  return inviteCode;
}

export async function joinCoupleViaUi(page: Page, inviteCode: string) {
  await expect(page.getByTestId('join-couple-form')).toBeVisible();
  await page.getByTestId('invite-code-input').fill(inviteCode);
  await page.getByTestId('join-couple-submit').click();
  await expect(page).toHaveURL(/\/today$/);
}

export async function registerAndCreateCouple(page: Page, user: TestUser) {
  await registerViaUi(page, user);
  return createCoupleViaUi(page);
}

export async function registerAndJoinCouple(page: Page, user: TestUser, inviteCode: string) {
  await registerViaUi(page, user);
  await joinCoupleViaUi(page, inviteCode);
}
