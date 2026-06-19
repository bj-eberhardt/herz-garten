import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError, sendApiError } from '../../errors.js';
import { sendJson } from '../../http.js';
import { validateBody } from '../../validation.js';
import {
  createCoupleBodySchema,
  emptyBodySchema,
  joinCoupleBodySchema,
  type CreateCoupleBody,
  type JoinCoupleBody,
} from '../bodySchemas.js';
import { createCoupleForUser, joinCoupleForUser, leaveCoupleForUser } from '../couples/couples.service.js';
import { normalizeText, resolveLocale } from '../support.repository.js';

type CreateCoupleResult = Extract<Awaited<ReturnType<typeof createCoupleForUser>>, { status: 'created' }>;
type JoinCoupleResult = Extract<Awaited<ReturnType<typeof joinCoupleForUser>>, { status: 'joined' }>;
type CouplePayload = { couple: CreateCoupleResult['couple'] | JoinCoupleResult['couple'] };
type LeaveCouplePayload = { user: NonNullable<Awaited<ReturnType<typeof leaveCoupleForUser>>>['user']; couple: null };

export function registerCoupleRoutes(router: Router) {
  router.post('/couples', requireAuth, validateBody(createCoupleBodySchema), async (request, response) => {
    const user = currentUser(request);
    const body = request.body as CreateCoupleBody;
    const relationshipType = normalizeText(body.relationshipType) || 'mixed';
    const contentPreference = normalizeText(body.contentPreference) || 'balanced';

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

      sendJson<CouplePayload>(response.status(201), { couple: result.couple });
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/couples/join', requireAuth, validateBody(joinCoupleBodySchema), async (request, response) => {
    const user = currentUser(request);
    const body = request.body as JoinCoupleBody;
    const code = normalizeText(body.inviteCode).toLowerCase();

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

      sendJson<CouplePayload>(response, { couple: result.couple });
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

      sendJson<LeaveCouplePayload>(response, { user: payload.user ?? user, couple: null });
    } catch (error) {
      handleError(response, error);
    }
  });
}
