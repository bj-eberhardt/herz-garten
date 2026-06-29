import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError, sendApiError } from '../../errors.js';
import { sendJson } from '../../http.js';
import { validateBody, validateQuery } from '../../validation.js';
import {
  accountExportQuerySchema,
  emptyBodySchema,
  emptyQuerySchema,
  passwordBodySchema,
  preferencesBodySchema,
  profileBodySchema,
  type PasswordBody,
  type PreferencesBody,
  type ProfileBody,
} from '../bodySchemas.js';
import {
  buildAccountExport,
  deleteAccount,
  getMePayload,
  updateUserPassword,
  updateUserPreferences,
  updateUserProfile,
} from '../account/account.service.js';
import { getCurrentCouple, isRecord, normalizeEmail, normalizeText, resolveLocale } from '../support.repository.js';

type MePayload = Awaited<ReturnType<typeof getMePayload>>;
type AccountUserPayload = {
  user: Awaited<ReturnType<typeof updateUserProfile>> | Awaited<ReturnType<typeof updateUserPreferences>>;
  couple: Awaited<ReturnType<typeof getCurrentCouple>>;
};
type AccountExportPayload = Awaited<ReturnType<typeof buildAccountExport>>;

export function registerAccountRoutes(router: Router) {
  router.get('/me', requireAuth, validateQuery(emptyQuerySchema, 'rejected'), async (request, response) => {
    const user = currentUser(request);
    try {
      sendJson<MePayload>(response, await getMePayload(user.id, user, await resolveLocale(request)));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.patch('/me/preferences', requireAuth, validateQuery(emptyQuerySchema, 'rejected'), validateBody(preferencesBodySchema, 'rejected'), async (request, response) => {
    const user = currentUser(request);
    const body = request.body as PreferencesBody;

    try {
      const incomingPreferences = isRecord(body.preferences) ? body.preferences : body;
      const [updatedUser, couple] = await Promise.all([
        updateUserPreferences(user.id, incomingPreferences),
        getCurrentCouple(user.id),
      ]);
      sendJson<AccountUserPayload>(response, { user: updatedUser, couple });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.patch('/me/profile', requireAuth, validateQuery(emptyQuerySchema, 'rejected'), validateBody(profileBodySchema, 'rejected'), async (request, response) => {
    const user = currentUser(request);
    const body = request.body as ProfileBody;
    const email = body.email === undefined ? undefined : normalizeEmail(body.email);
    const displayName = body.displayName === undefined ? undefined : normalizeText(body.displayName);

    if ((email === undefined && displayName === undefined) || email === '' || displayName === '') {
      sendApiError(response, 400, 'rejected');
      return;
    }

    try {
      const [updatedUser, couple] = await Promise.all([
        updateUserProfile(user.id, { email, displayName }),
        getCurrentCouple(user.id),
      ]);
      sendJson<AccountUserPayload>(response, { user: updatedUser, couple });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        sendApiError(response, 409, 'auth.emailAlreadyRegistered');
        return;
      }
      handleError(response, error);
    }
  });

  router.patch('/me/password', requireAuth, validateQuery(emptyQuerySchema, 'rejected'), validateBody(passwordBodySchema, 'rejected'), async (request, response) => {
    const user = currentUser(request);
    const body = request.body as PasswordBody;

    try {
      const updated = await updateUserPassword(user.id, body.currentPassword, body.newPassword);
      if (!updated) {
        sendApiError(response, 400, 'profile.passwordInvalid');
        return;
      }

      response.status(204).send();
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/me/export', requireAuth, validateQuery(accountExportQuerySchema), async (request, response) => {
    const user = currentUser(request);

    try {
      sendJson<AccountExportPayload>(response, await buildAccountExport(user, await resolveLocale(request)));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.delete(
    '/me',
    requireAuth,
    validateQuery(emptyQuerySchema),
    validateBody(emptyBodySchema),
    async (request, response) => {
      const user = currentUser(request);

      try {
        await deleteAccount(user);
        response.status(204).send();
      } catch (error) {
        handleError(response, error);
      }
    },
  );
}

