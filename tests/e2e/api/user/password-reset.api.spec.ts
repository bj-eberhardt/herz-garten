import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test';

import { apiPostRaw } from '../../helpers/api';
import { expectApiError, expectJson, type AuthPayload } from '../../helpers/apiAssertions';
import { runDbSql } from '../../helpers/db';
import { testRunId, testUser } from '../../helpers/testUsers';

const mailpitUrl = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8025';

async function expectRejected(response: APIResponse) {
  await expectApiError(response, 400, 'rejected');
}

async function clearMailbox(request: APIRequestContext) {
  await request.delete(`${mailpitUrl}/api/v1/messages`);
}

async function latestResetToken(request: APIRequestContext, email: string) {
  const deadline = Date.now() + 15_000;
  let messageId = '';

  while (Date.now() < deadline) {
    const response = await request.get(`${mailpitUrl}/api/v1/messages`);
    const payload = (await response.json()) as { messages?: Array<{ ID: string; To?: Array<{ Address: string }> }> };
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
  const detail = (await detailResponse.json()) as { Text?: string };
  const match = detail.Text?.match(/\/reset-password\?token=([A-Za-z0-9_-]+)/);
  expect(match?.[1]).toBeTruthy();
  return match![1];
}

test.describe('user api / password reset', () => {
  test('accepts forgot-password for registered and unknown emails', async ({ request }) => {
    await clearMailbox(request);
    const user = testUser('api-reset-neutral', testRunId());

    await test.step('Arrange: register user for reset request', async () => {
      await expectJson<AuthPayload>(await apiPostRaw(request, '/api/auth/register', user), 201);
    });

    await test.step('Assert: registered email receives neutral response', async () => {

      const payload = await expectJson<{ ok: boolean }>(

      await apiPostRaw(request, '/api/auth/forgot-password', { email: user.email.toUpperCase() }),

      );

      expect(payload.ok).toBe(true);

    });

    await test.step('Assert: unknown email receives same neutral response', async () => {

      const payload = await expectJson<{ ok: boolean }>(

      await apiPostRaw(request, '/api/auth/forgot-password', { email: `missing-${user.email}` }),

      );

      expect(payload.ok).toBe(true);

    });
  });

  test('rejects invalid forgot-password payloads and query parameters', async ({ request }) => {
    const invalidPayloads: Array<{ name: string; body: unknown }> = [
      { name: 'missing email', body: {} },
      { name: 'blank email', body: { email: '   ' } },
      { name: 'malformed email', body: { email: 'not-an-email' } },
      { name: 'numeric email', body: { email: 123 } },
      { name: 'unexpected field', body: { email: 'reset-invalid@example.test', unexpected: true } },
    ];

    for (const { name, body } of invalidPayloads) {
      await test.step(`Reject: forgot-password payload ${name}`, async () => {
        await expectRejected(await apiPostRaw(request, '/api/auth/forgot-password', body));
      });
    }

    await test.step('Reject: forgot-password with unexpected query parameter', async () => {
      await expectRejected(
        await apiPostRaw(request, '/api/auth/forgot-password?unexpected=true', { email: 'reset-query@example.test' }),
      );
    });
  });

  test('rejects invalid reset-password payloads and query parameters', async ({ request }) => {
    const validToken = 'x'.repeat(32);
    const invalidPayloads: Array<{ name: string; body: unknown }> = [
      { name: 'missing token', body: { password: 'new-password-123' } },
      { name: 'missing password', body: { token: validToken } },
      { name: 'blank token', body: { token: '   ', password: 'new-password-123' } },
      { name: 'short token', body: { token: 'short-token', password: 'new-password-123' } },
      { name: 'short password', body: { token: validToken, password: 'short' } },
      { name: 'numeric token', body: { token: 123, password: 'new-password-123' } },
      { name: 'numeric password', body: { token: validToken, password: 123 } },
      { name: 'unexpected field', body: { token: validToken, password: 'new-password-123', unexpected: true } },
    ];

    for (const { name, body } of invalidPayloads) {
      await test.step(`Reject: reset-password payload ${name}`, async () => {
        await expectRejected(await apiPostRaw(request, '/api/auth/reset-password', body));
      });
    }

    await test.step('Reject: reset-password with unexpected query parameter', async () => {
      await expectRejected(
        await apiPostRaw(request, '/api/auth/reset-password?unexpected=true', {
          token: validToken,
          password: 'new-password-123',
        }),
      );
    });
  });

  test('keeps domain error for unknown reset token', async ({ request }) => {
    await test.step('Reject: syntactically valid but unknown token', async () => {
      await expectApiError(
        await apiPostRaw(request, '/api/auth/reset-password', {
          token: 'x'.repeat(32),
          password: 'new-password-123',
        }),
        400,
        'auth.resetTokenInvalid',
      );
    });
  });

  test('applies password reset without storing plain tokens and rejects token reuse', async ({ request }) => {
    await clearMailbox(request);
    const user = testUser('api-reset-success', testRunId());
    const newPassword = 'new-password-123';

    await test.step('Arrange: register user and request reset link', async () => {
      await expectJson<AuthPayload>(await apiPostRaw(request, '/api/auth/register', user), 201);
      await expectJson<{ ok: boolean }>(await apiPostRaw(request, '/api/auth/forgot-password', { email: user.email }));
    });

    const token = await test.step('Arrange: read latest reset token from email', async () => {
      return latestResetToken(request, user.email);
    });

    await test.step('Assert: database does not store plain reset token', async () => {

      const tokenQuery = runDbSql(`select count(*) from password_reset_tokens where token_hash = '${token.replace(/'/g, "''")}';`);

      expect(tokenQuery).toContain('0');

    });

    await test.step('Act: reset password with emailed token', async () => {
      const payload = await expectJson<{ ok: boolean }>(
        await apiPostRaw(request, '/api/auth/reset-password', { token, password: newPassword }),
      );
      expect(payload.ok).toBe(true);
    });

    await test.step('Assert: old password no longer logs in', async () => {

      await expectApiError(

      await apiPostRaw(request, '/api/auth/login', { email: user.email, password: user.password }),

      401,

      'auth.invalidCredentials',

      );

    });

    await test.step('Assert: new password logs in', async () => {

      await expectJson<AuthPayload>(await apiPostRaw(request, '/api/auth/login', { email: user.email, password: newPassword }));

    });

    await test.step('Reject: used reset token cannot be reused', async () => {
      await expectApiError(
        await apiPostRaw(request, '/api/auth/reset-password', { token, password: 'another-password-123' }),
        400,
        'auth.resetTokenInvalid',
      );
    });
  });

  test('rejects expired reset tokens', async ({ request }) => {
    await clearMailbox(request);
    const user = testUser('api-reset-expired', testRunId());

    await test.step('Arrange: register user and request reset link', async () => {
      await expectJson<AuthPayload>(await apiPostRaw(request, '/api/auth/register', user), 201);
      await expectJson<{ ok: boolean }>(await apiPostRaw(request, '/api/auth/forgot-password', { email: user.email }));
    });

    const token = await test.step('Arrange: read latest reset token from email', async () => {
      return latestResetToken(request, user.email);
    });

    await test.step('Arrange: expire active reset token in database', async () => {
      runDbSql(`
        update password_reset_tokens
        set expires_at = now() - interval '1 minute'
        where used_at is null
          and user_id = (select id from profiles where email = '${user.email.replace(/'/g, "''")}')
      `);
    });

    await test.step('Reject: expired reset token', async () => {
      await expectApiError(
        await apiPostRaw(request, '/api/auth/reset-password', { token, password: 'new-password-123' }),
        400,
        'auth.resetTokenInvalid',
      );
    });
  });

  test('limits reset requests per email', async ({ request }) => {
    const limitedUser = testUser('api-reset-limited', testRunId());

    await test.step('Arrange: register user for reset request limit', async () => {
      await expectJson<AuthPayload>(await apiPostRaw(request, '/api/auth/register', limitedUser), 201);
      await clearMailbox(request);
    });

    for (const attempt of [1, 2, 3]) {
      await test.step(`Act: allowed reset request ${attempt}`, async () => {
        await expectJson<{ ok: boolean }>(await apiPostRaw(request, '/api/auth/forgot-password', { email: limitedUser.email }));
      });
    }

    await test.step('Reject: reset request beyond per-email limit', async () => {
      await expectApiError(
        await apiPostRaw(request, '/api/auth/forgot-password', { email: limitedUser.email }),
        429,
        'auth.resetRequestLimited',
      );
    });
  });
});
