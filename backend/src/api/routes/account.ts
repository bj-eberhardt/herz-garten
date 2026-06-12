import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError } from '../../errors.js';
import { validateBody } from '../../validation.js';
import { preferencesBodySchema } from '../bodySchemas.js';
import { buildAccountExport, deleteAccount, getMePayload, updateUserPreferences } from '../account/account.service.js';
import { getCurrentCouple, isRecord, resolveLocale } from '../support.js';

export function registerAccountRoutes(router: Router) {
  router.get('/me', requireAuth, async (request, response) => {
    const user = currentUser(request);
    try {
      response.json(await getMePayload(user.id, user));
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
