// Service worker with workbox manifest injection point
// This will be replaced by vite-plugin-pwa with the actual precache manifest
const manifest = self.__WB_MANIFEST;

self.addEventListener('install', event => {
  console.log('Service Worker installing.', manifest);
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating.');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  // Basic fetch handler - just pass through requests
  event.respondWith(
    fetch(event.request).catch(() => {
      // Fallback for offline
      return new Response('Offline', { status: 503 });
    })
  );
});
