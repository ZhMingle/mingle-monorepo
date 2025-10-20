import { precacheAndRoute } from 'workbox-precaching';

// 预缓存构建生成的资源
precacheAndRoute(self.__WB_MANIFEST);

// 立即激活新的 service worker
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

