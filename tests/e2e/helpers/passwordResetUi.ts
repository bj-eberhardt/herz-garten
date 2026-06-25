import { type APIRequestContext } from '@playwright/test';
import { apiGet, apiPostRaw } from './api';
import { expectJson } from './apiAssertions';

const mailpitUrl = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8025';

export async function clearMailbox(request: APIRequestContext) {
  await request.delete(`${mailpitUrl}/api/v1/messages`);
}

export async function latestResetToken(request: APIRequestContext, email: string) {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    const response = await request.get(`${mailpitUrl}/api/v1/messages`);
    const payload = await response.json() as { messages?: Array<{ ID: string; To?: Array<{ Address: string; }>; }>; };
    const message = payload.messages?.find((item) =>
      item.To?.some((recipient) => recipient.Address.toLowerCase() === email.toLowerCase()),
    );
    if (message) {
      const detailResponse = await request.get(`${mailpitUrl}/api/v1/message/${message.ID}`);
      const detail = await detailResponse.json() as { Text?: string; };
      const match = detail.Text?.match(/\/reset-password\?token=([A-Za-z0-9_-]+)/);
      if (match?.[1]) return match[1];
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`No reset email received for ${email}`);
}

export async function adminLogin(request: APIRequestContext) {
  const response = await apiPostRaw(request, '/api/admin/auth/login', { password: 'admin' });
  const payload = await expectJson<{ token: string; }>(response);
  return payload.token;
}

export function emailSettingsInput<T extends { smtpPasswordConfigured?: boolean; }>(settings: T) {
  const { smtpPasswordConfigured: _smtpPasswordConfigured, ...input } = settings;
  return input;
}

export async function adminSettings(request: APIRequestContext, token: string) {
  return apiGet<{
    auth: { adminJwtTtlMinutes: number; userJwtTtlMinutes: number; };
    server: { publicBaseUrl: string; };
    passwordReset: { ttlMinutes: number; limitPer24h: number; };
    email: {
      enabled: boolean;
      smtpHost: string;
      smtpPort: number;
      smtpSecure: boolean;
      smtpUser: string;
      smtpPasswordConfigured: boolean;
      fromAddress: string;
      fromName: string;
      replyTo: string;
    };
  }>(request, '/api/admin/settings', token);
}
