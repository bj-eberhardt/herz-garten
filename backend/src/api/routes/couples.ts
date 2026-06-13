import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError, sendApiError } from '../../errors.js';
import { validateBody } from '../../validation.js';
import { createCoupleBodySchema, emptyBodySchema, joinCoupleBodySchema } from '../bodySchemas.js';
import { createCoupleForUser, joinCoupleForUser, leaveCoupleForUser } from '../couples/couples.service.js';
import { normalizeText, resolveLocale } from '../support.repository.js';

export function registerCoupleRoutes(router: Router) {
  router.post('/couples', requireAuth, validateBody(createCoupleBodySchema), async (request, response) => {
    const user = currentUser(request);
    const relationshipType = normalizeText(request.body.relationshipType) || 'mixed';
    const contentPreference = normalizeText(request.body.contentPreference) || 'balanced';

    try {
      const result = await createCoupleForUser(user.id, await resolveLocale(request), relationshipType, contentPreference);
      if (result.status === 'alreadyConnected') {
        sendApiError(response, 409, 'couple.alreadyConnected');
        return;
      }
      if (result.status === 'invalidPreferences') {
        sendApiError(response, 400, 'common.validation');
        return;
      }

      response.status(201).json({ couple: result.couple });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/couples/join', requireAuth, validateBody(joinCoupleBodySchema), async (request, response) => {
    const user = currentUser(request);
    const code = normalizeText(request.body.inviteCode).toLowerCase();

    if (!code) {
      sendApiError(response, 400, 'couple.inviteCodeRequired');
      return;
    }

    try {
      const result = await joinCoupleForUser(user.id, code);
      if (result.status === 'alreadyConnected') {
        sendApiError(response, 409, 'couple.alreadyConnected');
        return;
      }
      if (result.status === 'notFound') {
        sendApiError(response, 404, 'couple.inviteCodeNotFound', { code });
        return;
      }
      if (result.status === 'full') {
        sendApiError(response, 409, 'couple.full');
        return;
      }

      response.json({ couple: result.couple });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/couples/leave', requireAuth, validateBody(emptyBodySchema), async (request, response) => {
    const user = currentUser(request);

    try {
      const payload = await leaveCoupleForUser(user.id);
      if (!payload) {
        sendApiError(response, 409, 'couple.notConnected');
        return;
      }

      response.json({ user: payload.user ?? user, couple: null });
    } catch (error) {
      handleError(response, error);
    }
  });
}
