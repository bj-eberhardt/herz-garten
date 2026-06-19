import type { Router } from 'express';
import { currentUser, requireAuth } from '../../auth.js';
import { handleError, sendApiError } from '../../errors.js';
import { sendJson } from '../../http.js';
import { validateBody } from '../../validation.js';
import { emptyBodySchema } from '../bodySchemas.js';
import { readAllNotifications, readNotification } from '../notifications/notifications.service.js';
import { buildNotificationDetailPayload, buildNotificationPayload, resolveLocale } from '../support.repository.js';

type NotificationsPayload = Awaited<ReturnType<typeof buildNotificationPayload>>;
type NotificationDetailPayload = NonNullable<Awaited<ReturnType<typeof buildNotificationDetailPayload>>>;

export function registerNotificationRoutes(router: Router) {
  router.get('/notifications', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      sendJson<NotificationsPayload>(response, await buildNotificationPayload(user.id));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.post('/notifications/read-all', requireAuth, validateBody(emptyBodySchema), async (request, response) => {
    const user = currentUser(request);

    try {
      sendJson<NotificationsPayload>(response, await readAllNotifications(user.id));
    } catch (error) {
      handleError(response, error);
    }
  });

  router.get('/notifications/:notificationId/detail', requireAuth, async (request, response) => {
    const user = currentUser(request);

    try {
      const locale = await resolveLocale(request);
      const payload = await buildNotificationDetailPayload(user.id, String(request.params.notificationId), locale);
      if (!payload) {
        sendApiError(response, 404, 'notification.notFound');
        return;
      }

      sendJson<NotificationDetailPayload>(response, payload);
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

      sendJson<NotificationsPayload>(response, payload);
    } catch (error) {
      handleError(response, error);
    }
  });
}
