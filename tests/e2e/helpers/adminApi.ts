import { expect, type APIRequestContext } from '@playwright/test';

import { apiPostRaw } from './api';

import { expectJson } from './apiAssertions';

export const apiBaseURL = process.env.E2E_API_URL ?? 'http://localhost:3001';
const mailpitUrl = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8025';

export async function adminLogin(request: APIRequestContext) {
  const response = await apiPostRaw(request, '/api/admin/auth/login', { password: 'admin' });
  const payload = await expectJson<{ token: string; usesDefaultAdminPassword: boolean; }>(response);
  expect(payload.token).toBeTruthy();
  return payload.token;
}

export async function clearMailbox(request: APIRequestContext) {
  await request.delete(`${mailpitUrl}/api/v1/messages`);
}

export async function latestMailFor(request: APIRequestContext, email: string) {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    const response = await request.get(`${mailpitUrl}/api/v1/messages`);
    const payload = await response.json() as { messages?: Array<{ ID: string; Subject?: string; To?: Array<{ Address: string; }>; }>; };
    const message = payload.messages?.find((item) =>
      item.To?.some((recipient) => recipient.Address.toLowerCase() === email.toLowerCase()),
    );
    if (message) {
      const detailResponse = await request.get(`${mailpitUrl}/api/v1/message/${message.ID}`);
      const detail = await detailResponse.json() as { Subject?: string; Text?: string; };
      return {
        subject: detail.Subject ?? message.Subject ?? '',
        text: detail.Text ?? '',
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`No email received for ${email}`);
}

export function jwtPayload(token: string) {
  const payload = token.split('.')[1];
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { iat: number; exp: number; };
}

export function emailSettingsInput<T extends { smtpPasswordConfigured?: boolean; }>(settings: T) {
  const { smtpPasswordConfigured: _smtpPasswordConfigured, ...input } = settings;
  return input;
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
