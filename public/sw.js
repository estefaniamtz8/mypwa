const CACHE_NAME = 'my-pwa-cache-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Instalación: cachea el App Shell
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
});

// Activación: limpia caches antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

// Fetch: para navegación devuelve index.html (App Shell).

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Si es navegación (SPA) -> devuelve cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then(cached => cached || fetch('/index.html'))
    );
    return;
  }

  // Para otros recursos: cache-first, si no existe -> network and cache
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(networkResponse => {
        // sólo cachear respuestas exitosas
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        
      });
    })
  );
});
