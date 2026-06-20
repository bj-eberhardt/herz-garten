import webpush, { type PushSubscription } from 'web-push';
import { config } from '../../config.js';
import { translatePushBackend } from '../notifications/messages.js';
import {
  disablePushSubscriptions,
  listActivePushSubscriptions,
  mapPushSubscription,
  markPushSubscriptionFailure,
  markPushSubscriptionSuccess,
  type PushSubscriptionInput,
  upsertPushSubscription,
} from './push.repository.js';

export interface PushNotificationPayload {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  url: string;
  unreadCount?: number;
}

let vapidConfigured = false;

function endpointLabel(endpoint: string) {
  try {
    const url = new URL(endpoint);
    return `${url.hostname}${url.pathname.slice(0, 18)}...`;
  } catch (_error) {
    return `${endpoint.slice(0, 32)}...`;
  }
}

function configureVapid() {
  if (vapidConfigured || !config.pushEnabled || !config.vapidPublicKey || !config.vapidPrivateKey) return;
  webpush.setVapidDetails(config.vapidSubject, config.vapidPublicKey, config.vapidPrivateKey);
  vapidConfigured = true;
}

export function pushAvailability() {
  return {
    enabled: config.pushEnabled && Boolean(config.vapidPublicKey && config.vapidPrivateKey),
    publicKey: config.vapidPublicKey,
  };
}

export async function buildPushSubscriptionStatus(userId: string) {
  const availability = pushAvailability();
  const subscriptions = await listActivePushSubscriptions(userId);

  return {
    enabled: availability.enabled,
    publicKey: availability.publicKey,
    active: subscriptions.length > 0,
    subscriptions: subscriptions.map(mapPushSubscription),
  };
}

export async function savePushSubscription(userId: string, subscription: PushSubscriptionInput, userAgent = '') {
  const row = await upsertPushSubscription(userId, subscription, userAgent);
  return {
    enabled: pushAvailability().enabled,
    active: true,
    subscription: mapPushSubscription(row),
  };
}

export async function removePushSubscriptions(userId: string, endpoint?: string) {
  await disablePushSubscriptions(userId, endpoint);
  return buildPushSubscriptionStatus(userId);
}

export async function sendPushNotifications(payloads: PushNotificationPayload[]) {
  const availability = pushAvailability();
  if (payloads.length === 0) return;
  if (!availability.enabled) {
    console.info('[push] skipped: push is disabled or VAPID keys are missing', {
      notificationIds: payloads.map((payload) => payload.notificationId),
    });
    return;
  }
  configureVapid();

  for (const payload of payloads) {
    const subscriptions = await listActivePushSubscriptions(payload.userId);
    console.info('[push] dispatch notification', {
      notificationId: payload.notificationId,
      userId: payload.userId,
      subscriptionCount: subscriptions.length,
    });

    for (const subscription of subscriptions) {
      const pushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      try {
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify({
            notificationId: payload.notificationId,
            title: payload.title,
            body: payload.body,
            url: payload.url,
            unreadCount: payload.unreadCount,
          }),
          {
            TTL: 60 * 60,
            urgency: 'normal',
            topic: payload.notificationId.replace(/-/g, '').slice(0, 32),
          },
        );
        await markPushSubscriptionSuccess(subscription.id);
        console.info('[push] delivered notification', {
          notificationId: payload.notificationId,
          userId: payload.userId,
          subscriptionId: subscription.id,
          endpoint: endpointLabel(subscription.endpoint),
        });
      } catch (error) {
        const statusCode = typeof error === 'object' && error && 'statusCode' in error ? Number(error.statusCode) : 0;
        await markPushSubscriptionFailure(subscription.id, statusCode === 404 || statusCode === 410);
        console.warn('[push] delivery failed', {
          notificationId: payload.notificationId,
          userId: payload.userId,
          subscriptionId: subscription.id,
          endpoint: endpointLabel(subscription.endpoint),
          statusCode,
        });
      }
    }
  }
}

export async function sendTestPushNotification(userId: string) {
  const title = await translatePushBackend('push.titles.test');
  const body = await translatePushBackend('push.bodies.test');
  await sendPushNotifications([
    {
      notificationId: 'test',
      userId,
      title,
      body,
      url: '/notifications',
    },
  ]);
}
