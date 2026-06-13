import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError, sendApiError } from '../../errors.js';
import { validateBody } from '../../validation.js';
import { passwordBodySchema, preferencesBodySchema, profileBodySchema } from '../bodySchemas.js';
import {
  buildAccountExport,
  deleteAccount,
  getMePayload,
  updateUserPassword,
  updateUserPreferences,
  updateUserProfile,
} from '../account/account.service.js';
import { getCurrentCouple, isRecord, normalizeEmail, normalizeText, resolveLocale } from '../support.repository.js';

export function registerAccountRoutes(router: Router) {
  router.get('/me', requireAuth, async (request, response) => {
    const user = currentUser(request);
    try {
      response.json(await getMePayload(user.id, user, await resolveLocale(request)));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.patch('/me/preferences', requireAuth, validateBody(preferencesBodySchema), async (request, response) => {
    const user = currentUser(request);

    try {
      const incomingPreferences = isRecord(request.body.preferences) ? request.body.preferences : request.body;
      const [updatedUser, couple] = await Promise.all([
        updateUserPreferences(user.id, incomingPreferences),
        getCurrentCouple(user.id),
      ]);
      response.json({ user: updatedUser, couple });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.patch('/me/profile', requireAuth, validateBody(profileBodySchema), async (request, response) => {
    const user = currentUser(request);
    const email = request.body.email === undefined ? undefined : normalizeEmail(request.body.email);
    const displayName = request.body.displayName === undefined ? undefined : normalizeText(request.body.displayName);

    if ((email === undefined && displayName === undefined) || email === '' || displayName === '') {
      sendApiError(response, 400, 'profile.updateInvalid');
      return;
    }

    try {
      const [updatedUser, couple] = await Promise.all([
        updateUserProfile(user.id, { email, displayName }),
        getCurrentCouple(user.id),
      ]);
      response.json({ user: updatedUser, couple });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        sendApiError(response, 409, 'auth.emailAlreadyRegistered');
        return;
      }
      handleError(response, error);
    }
  });

  router.patch('/me/password', requireAuth, validateBody(passwordBodySchema), async (request, response) => {
    const user = currentUser(request);

    try {
      const updated = await updateUserPassword(user.id, request.body.currentPassword, request.body.newPassword);
      if (!updated) {
        sendApiError(response, 400, 'profile.passwordInvalid');
        return;
      }

      response.status(204).send();
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/me/export', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      response.json(await buildAccountExport(user, await resolveLocale(request)));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.delete('/me', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      await deleteAccount(user);
      response.status(204).send();
    } catch (error) {
      handleError(response, error);
    }
  });
}
