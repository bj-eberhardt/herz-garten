import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { config } from '../../config.js';
import { handleError, sendApiError } from '../../errors.js';
import { sendJson } from '../../http.js';
import { validateBody, validateQuery } from '../../validation.js';
import {
  emptyBodySchema,
  emptyQuerySchema,
  pushSubscriptionBodySchema,
  pushUnsubscribeBodySchema,
  type PushSubscriptionBody,
  type PushUnsubscribeBody,
} from '../bodySchemas.js';
import {
  buildPushSubscriptionStatus,
  pushAvailability,
  removePushSubscriptions,
  savePushSubscription,
  sendTestPushNotification,
} from '../push/push.service.js';

type PushAvailabilityPayload = ReturnType<typeof pushAvailability>;
type PushStatusPayload = Awaited<ReturnType<typeof buildPushSubscriptionStatus>>;
type PushSubscriptionPayload = Awaited<ReturnType<typeof savePushSubscription>>;
type PushUnsubscribePayload = Awaited<ReturnType<typeof removePushSubscriptions>>;
type PushTestPayload = { ok: true };

export function registerPushRoutes(router: Router) {
  router.get('/push/vapid-public-key', validateQuery(emptyQuerySchema, 'rejected'), (_request, response) => {
    sendJson<PushAvailabilityPayload>(response, pushAvailability());
  });

  router.get('/push/subscriptions/me', requireAuth, validateQuery(emptyQuerySchema, 'rejected'), async (request, response) => {
    const user = currentUser(request);

    try {
      sendJson<PushStatusPayload>(response, await buildPushSubscriptionStatus(user.id));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/push/subscriptions', requireAuth, validateQuery(emptyQuerySchema, 'rejected'), validateBody(pushSubscriptionBodySchema, 'rejected'), async (request, response) => {
    const user = currentUser(request);
    const body = request.body as PushSubscriptionBody;

    try {
      sendJson<PushSubscriptionPayload>(
        response.status(201),
        await savePushSubscription(user.id, body, request.header('user-agent') ?? ''),
      );
    } catch (error) {
      handleError(response, error);
    }
  });

  router.delete('/push/subscriptions', requireAuth, validateQuery(emptyQuerySchema, 'rejected'), validateBody(pushUnsubscribeBodySchema, 'rejected'), async (request, response) => {
    const user = currentUser(request);
    const body = request.body as PushUnsubscribeBody;

    try {
      sendJson<PushUnsubscribePayload>(response, await removePushSubscriptions(user.id, body.endpoint));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/push/test', requireAuth, validateQuery(emptyQuerySchema, 'rejected'), validateBody(emptyBodySchema, 'rejected'), async (request, response) => {
    if (config.nodeEnv === 'production') {
      sendApiError(response, 404, 'common.unexpected');
      return;
    }

    const user = currentUser(request);

    try {
      await sendTestPushNotification(user.id);
      sendJson<PushTestPayload>(response, { ok: true });
    } catch (error) {
      handleError(response, error);
    }
  });
}
