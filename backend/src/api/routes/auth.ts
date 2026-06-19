import type { Router } from 'express';
import { signToken } from '../../auth.js';
import { config } from '../../config.js';
import { handleError, sendApiError } from '../../errors.js';
import { sendJson } from '../../http.js';
import { createRateLimiter } from '../../security/rateLimit.js';
import { validateBody } from '../../validation.js';
import {
  authLoginBodySchema,
  authRegisterBodySchema,
  type AuthLoginBody,
  type AuthRegisterBody,
} from '../bodySchemas.js';
import { loginUser, registerUser } from '../auth/auth.service.js';
import { normalizeEmail, normalizeText } from '../support.repository.js';

const authRateLimit = createRateLimiter({
  keyPrefix: 'auth',
  windowMs: config.authRateLimitWindowMs,
  max: config.authRateLimitMax,
});

type AuthUser = Awaited<ReturnType<typeof registerUser>>;
type AuthPayload = { token: string; user: AuthUser };

export function registerAuthRoutes(router: Router) {
  router.post('/auth/register', authRateLimit, validateBody(authRegisterBodySchema), async (request, response) => {
    const body = request.body as AuthRegisterBody;
    const email = normalizeEmail(body.email);
    const displayName = normalizeText(body.displayName);
    const password = normalizeText(body.password);

    if (!email || !displayName || password.length < 8) {
      sendApiError(response, 400, 'auth.registrationInvalid');
      return;
    }

    try {
      const user = await registerUser(email, displayName, password);
      sendJson<AuthPayload>(response.status(201), { token: await signToken(user.id), user });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        sendApiError(response, 409, 'auth.emailAlreadyRegistered');
        return;
      }
      handleError(response, error);
    }
  });

  router.post('/auth/login', authRateLimit, validateBody(authLoginBodySchema), async (request, response) => {
    const body = request.body as AuthLoginBody;
    const email = normalizeEmail(body.email);
    const password = normalizeText(body.password);

    if (!email || !password) {
      sendApiError(response, 400, 'auth.registrationInvalid');
      return;
    }

    try {
      const user = await loginUser(email, password);
      if (!user) {
        sendApiError(response, 401, 'auth.invalidCredentials');
        return;
      }

      sendJson<AuthPayload>(response, { token: await signToken(user.id), user });
    } catch (error) {
      handleError(response, error);
    }
  });
}
