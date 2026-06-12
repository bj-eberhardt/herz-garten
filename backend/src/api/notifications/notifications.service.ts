import { buildNotificationPayload } from '../support.js';
import { markAllNotificationsRead, markNotificationRead } from './notifications.repository.js';

export async function readAllNotifications(userId: string) {
  await markAllNotificationsRead(userId);
  return buildNotificationPayload(userId);
}

export async function readNotification(userId: string, notificationId: string) {
  const updated = await markNotificationRead(userId, notificationId);
  return updated ? buildNotificationPayload(userId) : null;
}
