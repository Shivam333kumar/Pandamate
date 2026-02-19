self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Panda-Mate';
  const options = {
    body: data.body || 'Task started',
    icon: '/icon.png',
    badge: '/badge.png'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
