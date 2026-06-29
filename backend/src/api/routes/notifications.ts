import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError, sendApiError } from '../../errors.js';
import { sendJson } from '../../http.js';
import { validateBody, validateQuery } from '../../validation.js';
import { emptyBodySchema, emptyQuerySchema } from '../bodySchemas.js';
import { readAllNotifications, readNotification } from '../notifications/notifications.service.js';
import { buildNotificationDetailPayload, buildNotificationPayload, resolveLocale } from '../support.repository.js';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type NotificationsPayload = Awaited<ReturnType<typeof buildNotificationPayload>>;
type NotificationDetailPayload = NonNullable<Awaited<ReturnType<typeof buildNotificationDetailPayload>>>;

export function registerNotificationRoutes(router: Router) {
  router.get('/notifications', requireAuth, validateQuery(emptyQuerySchema, 'rejected'), async (request, response) => {
    const user = currentUser(request);

    try {
      sendJson<NotificationsPayload>(response, await buildNotificationPayload(user.id));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/notifications/read-all', requireAuth, validateQuery(emptyQuerySchema, 'rejected'), validateBody(emptyBodySchema, 'rejected'), async (request, response) => {
    const user = currentUser(request);

    try {
      sendJson<NotificationsPayload>(response, await readAllNotifications(user.id));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/notifications/:notificationId/detail', requireAuth, validateQuery(emptyQuerySchema, 'rejected'), async (request, response) => {
    const user = currentUser(request);

    try {
      const notificationId = String(request.params.notificationId);
      if (!uuidPattern.test(notificationId)) {
        sendApiError(response, 400, 'rejected');
        return;
      }

      const locale = await resolveLocale(request);
      const payload = await buildNotificationDetailPayload(user.id, notificationId, locale);
      if (!payload) {
        sendApiError(response, 404, 'notification.notFound');
        return;
      }

      sendJson<NotificationDetailPayload>(response, payload);
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/notifications/:notificationId/read', requireAuth, validateQuery(emptyQuerySchema, 'rejected'), validateBody(emptyBodySchema, 'rejected'), async (request, response) => {
    const user = currentUser(request);

    try {
      const notificationId = String(request.params.notificationId);
      if (!uuidPattern.test(notificationId)) {
        sendApiError(response, 400, 'rejected');
        return;
      }

      const payload = await readNotification(user.id, notificationId);
      if (!payload) {
        sendApiError(response, 404, 'notification.notFound');
        return;
      }

      sendJson<NotificationsPayload>(response, payload);
    } catch (error) {
      handleError(response, error);
    }
  });
}
