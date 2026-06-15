import { apiRequest } from './api';

export type BrowserPushPermission = 'default' | 'denied' | 'granted' | 'unsupported';

interface VapidKeyPayload {
  enabled: boolean;
  publicKey: string;
}

export interface PushSubscriptionStatus {
  enabled: boolean;
  publicKey: string;
  active: boolean;
  subscriptions: Array<{
    id: string;
    endpoint: string;
    userAgent: string | null;
    createdAt: string;
    updatedAt: string;
    lastSuccessAt: string | null;
    lastFailureAt: string | null;
    failureCount: number;
    disabledAt: string | null;
  }>;
}

function hasPushSupport() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function browserPushPermission(): BrowserPushPermission {
  if (!hasPushSupport()) return 'unsupported';
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function pushRegistration() {
  if (!hasPushSupport()) {
    throw new Error('push.unsupported');
  }

  const registration = await navigator.serviceWorker.register('/push-sw.js');
  await registration.update();
  await navigator.serviceWorker.ready;
  console.info('[push-client] service worker ready', { scope: registration.scope });
  return registration;
}

export async function loadPushStatus() {
  const status = await apiRequest<PushSubscriptionStatus>('/api/push/subscriptions/me');
  return {
    ...status,
    permission: browserPushPermission(),
    supported: hasPushSupport(),
  };
}

export async function enableBrowserPush() {
  if (!hasPushSupport()) {
    throw new Error('push.unsupported');
  }

  const keyPayload = await apiRequest<VapidKeyPayload>('/api/push/vapid-public-key');
  if (!keyPayload.enabled || !keyPayload.publicKey) {
    throw new Error('push.disabled');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(permission === 'denied' ? 'push.denied' : 'push.dismissed');
  }

  const registration = await pushRegistration();
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyPayload.publicKey),
      }));

  console.info('[push-client] subscription active', {
    endpoint: `${new URL(subscription.endpoint).hostname}${new URL(subscription.endpoint).pathname.slice(0, 18)}...`,
  });

  await apiRequest('/api/push/subscriptions', {
    method: 'POST',
    body: JSON.stringify(subscription.toJSON()),
  });

  return loadPushStatus();
}

export async function disableBrowserPush() {
  let endpoint = '';

  if (hasPushSupport()) {
    const registration = await navigator.serviceWorker.getRegistration('/push-sw.js');
    const subscription = await registration?.pushManager.getSubscription();
    endpoint = subscription?.endpoint ?? '';
    await subscription?.unsubscribe();
  }

  await apiRequest('/api/push/subscriptions', {
    method: 'DELETE',
    body: JSON.stringify(endpoint ? { endpoint } : {}),
  });

  return loadPushStatus();
}

export async function sendBrowserPushTest() {
  if (hasPushSupport()) {
    await pushRegistration();
  }
  console.info('[push-client] sending test push');
  await apiRequest('/api/push/test', {
    method: 'POST',
  });
}
