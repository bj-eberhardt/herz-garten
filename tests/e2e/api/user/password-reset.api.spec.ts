import { expect, test, type APIRequestContext } from '@playwright/test';

import { apiPostRaw } from '../../helpers/api';

import {
  expectApiError,
  expectJson,

  type AuthPayload
} from '../../helpers/apiAssertions';

import { testRunId, testUser } from '../../helpers/testUsers';

import { runDbSql } from '../../helpers/db';

const mailpitUrl = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8025';

async function clearMailbox(request: APIRequestContext) {
  await request.delete(`${mailpitUrl}/api/v1/messages`);
}

async function latestResetToken(request: APIRequestContext, email: string) {
  const deadline = Date.now() + 15_000;
  let messageId = '';

  while (Date.now() < deadline) {
    const response = await request.get(`${mailpitUrl}/api/v1/messages`);
    const payload = await response.json() as { messages?: Array<{ ID: string; To?: Array<{ Address: string; }>; }>; };
    const message = payload.messages?.find((item) =>
      item.To?.some((recipient) => recipient.Address.toLowerCase() === email.toLowerCase()),
    );
    if (message) {
      messageId = message.ID;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  expect(messageId).toBeTruthy();
  const detailResponse = await request.get(`${mailpitUrl}/api/v1/message/${messageId}`);
  const detail = await detailResponse.json() as { Text?: string; };
  const match = detail.Text?.match(/\/reset-password\?token=([A-Za-z0-9_-]+)/);
  expect(match?.[1]).toBeTruthy();
  return match![1];
}

test.describe('user api / password reset', () => {
  test('requests and applies a password reset without storing plain tokens', async ({ request }) => {
    await test.step('Flow: requests and applies a password reset without storing plain tokens', async () => {
      await clearMailbox(request);
      const user = testUser('api-reset', testRunId());
      await test.step('Verify JSON response payload', async () => {
        await expectJson<AuthPayload>(await apiPostRaw(request, '/api/auth/register', user), 201);
      });

      await test.step('Verify JSON response payload', async () => {
        await expectJson<{ ok: boolean; }>(await apiPostRaw(request, '/api/auth/forgot-password', { email: user.email.toUpperCase() }));
      });
      await test.step('Verify JSON response payload', async () => {
        await expectJson<{ ok: boolean; }>(await apiPostRaw(request, '/api/auth/forgot-password', { email: `missing-${user.email}` }));
      });

      const token = await latestResetToken(request, user.email);
      const tokenQuery = runDbSql(`select count(*) from password_reset_tokens where token_hash = '${token.replace(/'/g, "''")}';`);
      await test.step('Verify expected result', async () => {
        expect(tokenQuery).toContain('0');
      });

      const newPassword = 'new-password-123';
      await test.step('Verify JSON response payload', async () => {
        await expectJson<{ ok: boolean; }>(await apiPostRaw(request, '/api/auth/reset-password', { token, password: newPassword }));
      });

      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/auth/login', {
            email: user.email,
            password: user.password,
          }),
          401,
          'auth.invalidCredentials',
        );
      });
      await test.step('Verify JSON response payload', async () => {
        await expectJson<AuthPayload>(
          await apiPostRaw(request, '/api/auth/login', {
            email: user.email,
            password: newPassword,
          }),
        );
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/auth/reset-password', { token, password: 'another-password-123' }),
          400,
          'auth.resetTokenInvalid',
        );
      });
    });
  });

  test('rejects expired reset tokens and limits reset requests per email', async ({ request }) => {
    await test.step('Flow: rejects expired reset tokens and limits reset requests per email', async () => {
      await clearMailbox(request);
      const user = testUser('api-reset-expired', testRunId());
      await test.step('Verify JSON response payload', async () => {
        await expectJson<AuthPayload>(await apiPostRaw(request, '/api/auth/register', user), 201);
      });
      await test.step('Verify JSON response payload', async () => {
        await expectJson<{ ok: boolean; }>(await apiPostRaw(request, '/api/auth/forgot-password', { email: user.email }));
      });
      const token = await latestResetToken(request, user.email);

      runDbSql(`
              update password_reset_tokens
              set expires_at = now() - interval '1 minute'
              where used_at is null
                and user_id = (select id from profiles where email = '${user.email.replace(/'/g, "''")}')
            `);
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/auth/reset-password', { token, password: 'new-password-123' }),
          400,
          'auth.resetTokenInvalid',
        );
      });

      const limitedUser = testUser('api-reset-limited', testRunId());
      await test.step('Verify JSON response payload', async () => {
        await expectJson<AuthPayload>(await apiPostRaw(request, '/api/auth/register', limitedUser), 201);
      });
      await clearMailbox(request);
      await test.step('Verify JSON response payload', async () => {
        await expectJson<{ ok: boolean; }>(await apiPostRaw(request, '/api/auth/forgot-password', { email: limitedUser.email }));
      });
      await test.step('Verify JSON response payload', async () => {
        await expectJson<{ ok: boolean; }>(await apiPostRaw(request, '/api/auth/forgot-password', { email: limitedUser.email }));
      });
      await test.step('Verify JSON response payload', async () => {
        await expectJson<{ ok: boolean; }>(await apiPostRaw(request, '/api/auth/forgot-password', { email: limitedUser.email }));
      });
      await test.step('Verify API error response', async () => {
        await expectApiError(
          await apiPostRaw(request, '/api/auth/forgot-password', { email: limitedUser.email }),
          429,
          'auth.resetRequestLimited',
        );
      });
    });
  });
});
