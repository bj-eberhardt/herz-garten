import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError, sendApiError } from '../../errors.js';
import { validateBody } from '../../validation.js';
import { emptyBodySchema } from '../bodySchemas.js';
import { readAllNotifications, readNotification } from '../notifications/notifications.service.js';
import { buildNotificationPayload } from '../support.repository.js';

export function registerNotificationRoutes(router: Router) {
  router.get('/notifications', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      response.json(await buildNotificationPayload(user.id));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/notifications/read-all', requireAuth, validateBody(emptyBodySchema), async (request, response) => {
    const user = currentUser(request);

    try {
      response.json(await readAllNotifications(user.id));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/notifications/:notificationId/read', requireAuth, validateBody(emptyBodySchema), async (request, response) => {
    const user = currentUser(request);

    try {
      const payload = await readNotification(user.id, String(request.params.notificationId));
      if (!payload) {
        sendApiError(response, 404, 'notification.notFound');
        return;
      }

      response.json(payload);
    } catch (error) {
      handleError(response, error);
    }
  });
}
