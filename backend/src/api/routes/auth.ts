import type { Router } from 'express';
import { signToken } from '../../auth.js';
import { config } from '../../config.js';
import { handleError, sendApiError } from '../../errors.js';
import { sendJson } from '../../http.js';
import { createRateLimiter } from '../../security/rateLimit.js';
import { validateBody, validateQuery } from '../../validation.js';
import {
  authLoginBodySchema,
  authRegisterBodySchema,
  emptyQuerySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
  type AuthLoginBody,
  type AuthRegisterBody,
  type ForgotPasswordBody,
  type ResetPasswordBody,
} from '../bodySchemas.js';
import { loginUser, registerUser } from '../auth/auth.service.js';
import { neutralPasswordResetResponse, requestPasswordReset, resetPassword } from '../auth/passwordReset.service.js';
import { normalizeEmail, normalizeText } from '../support.repository.js';

const authRateLimit = createRateLimiter({
  keyPrefix: 'auth',
  windowMs: config.authRateLimitWindowMs,
  max: config.authRateLimitMax,
});

type AuthUser = Awaited<ReturnType<typeof registerUser>>;
type AuthPayload = { token: string; user: AuthUser };

export function registerAuthRoutes(router: Router) {
  router.post('/auth/register', authRateLimit, validateQuery(emptyQuerySchema), validateBody(authRegisterBodySchema), async (request, response) => {
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

  router.post('/auth/login', authRateLimit, validateQuery(emptyQuerySchema), validateBody(authLoginBodySchema), async (request, response) => {
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

  router.post('/auth/forgot-password', authRateLimit, validateQuery(emptyQuerySchema, 'rejected'), validateBody(forgotPasswordBodySchema, 'rejected'), async (request, response) => {
    const body = request.body as ForgotPasswordBody;
    const email = normalizeEmail(body.email);

    try {
      const result = await requestPasswordReset(email, String(request.header('accept-language') ?? config.i18nDefaultLocale).slice(0, 2));
      if (result.status === 'limited') {
        sendApiError(response, 429, 'auth.resetRequestLimited');
        return;
      }

      sendJson(response, neutralPasswordResetResponse);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/auth/reset-password', authRateLimit, validateQuery(emptyQuerySchema, 'rejected'), validateBody(resetPasswordBodySchema, 'rejected'), async (request, response) => {
    const body = request.body as ResetPasswordBody;

    try {
      const result = await resetPassword(body.token, normalizeText(body.password));
      if (result.status === 'invalid') {
        sendApiError(response, 400, 'auth.resetTokenInvalid');
        return;
      }

      sendJson(response, { ok: true });
    } catch (error) {
      handleError(response, error);
    }
  });
}


