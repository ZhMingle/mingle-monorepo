const OFFLINE_CACHE='mingle-offline-v2';
self.addEventListener('install',event=>{event.waitUntil(caches.open(OFFLINE_CACHE).then(cache=>cache.add('/offline.html')).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim());});
// Cache only the generic offline notice. Never cache shop/admin HTML, auth or API data.
self.addEventListener('fetch',event=>{
  if(event.request.mode==='navigate'&&new URL(event.request.url).origin===self.location.origin)
    event.respondWith(fetch(event.request).catch(()=>caches.open(OFFLINE_CACHE).then(cache=>cache.match('/offline.html'))));
});
