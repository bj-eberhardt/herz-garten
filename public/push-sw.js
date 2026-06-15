self.addEventListener('install', () => {
  console.info('[push-sw] installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.info('[push-sw] activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.info('[push-sw] push event received');
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (_error) {
      payload = { body: event.data.text() };
    }
  }

  const title = payload.title || 'Herzgarten';
  const url = payload.url || '/notifications';
  const notificationId = payload.notificationId || '';

  event.waitUntil(
    self.registration
      .showNotification(title, {
        body: payload.body || '',
        icon: '/android-chrome-192x192.png',
        badge: '/favicon-192x192.png',
        tag: notificationId ? `herzgarten-${notificationId}` : 'herzgarten-notification',
        data: {
          notificationId,
          url,
        },
      })
      .then(() => {
        console.info('[push-sw] notification shown', { notificationId });
      })
      .catch((error) => {
        console.error('[push-sw] notification failed', error);
      }),
  );
});

self.addEventListener('notificationclick', (event) => {
  console.info('[push-sw] notification clicked');
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url || '/notifications', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin && 'focus' in client) {
          return client.focus().then(() => client.navigate(targetUrl));
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});
