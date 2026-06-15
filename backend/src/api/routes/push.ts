import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { config } from '../../config.js';
import { handleError, sendApiError } from '../../errors.js';
import { validateBody } from '../../validation.js';
import { pushSubscriptionBodySchema, pushUnsubscribeBodySchema } from '../bodySchemas.js';
import {
  buildPushSubscriptionStatus,
  pushAvailability,
  removePushSubscriptions,
  savePushSubscription,
  sendTestPushNotification,
} from '../push/push.service.js';

export function registerPushRoutes(router: Router) {
  router.get('/push/vapid-public-key', (_request, response) => {
    response.json(pushAvailability());
  });

  router.get('/push/subscriptions/me', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      response.json(await buildPushSubscriptionStatus(user.id));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/push/subscriptions', requireAuth, validateBody(pushSubscriptionBodySchema), async (request, response) => {
    const user = currentUser(request);

    try {
      response.status(201).json(await savePushSubscription(user.id, request.body, request.header('user-agent') ?? ''));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.delete('/push/subscriptions', requireAuth, validateBody(pushUnsubscribeBodySchema), async (request, response) => {
    const user = currentUser(request);

    try {
      response.json(await removePushSubscriptions(user.id, request.body.endpoint));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/push/test', requireAuth, async (request, response) => {
    if (config.nodeEnv === 'production') {
      sendApiError(response, 404, 'common.unexpected');
      return;
    }

    const user = currentUser(request);

    try {
      await sendTestPushNotification(user.id);
      response.json({ ok: true });
    } catch (error) {
      handleError(response, error);
    }
  });
}
