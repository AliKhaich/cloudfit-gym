
const CACHE_NAME = 'cloudfit-v2';
const ASSETS = [
  '/',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use addAll but wrap in a way that it doesn't fail the whole install if one asset fails
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      if (res) return res;
      
      // If not in cache, try network
      return fetch(e.request).catch(() => {
        // Fallback for navigation requests if network fails
        if (e.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
