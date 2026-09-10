/* ============================================================
   Sprint Calendar — Service Worker
   Cache-first strategy for static assets, network-first for API
   ============================================================ */

const CACHE_NAME = 'sprint-calendar-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/design-system.css',
  './css/layout.css',
  './css/components.css',
  './css/animations.css',
  './js/storage.js',
  './js/theme.js',
  './js/modal.js',
  './js/sprint.js',
  './js/google-auth.js',
  './js/google-calendar.js',
  './js/calendar.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static, network-first for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first for Google API calls
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('accounts.google.com')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Network-first for Google Fonts
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        fetch(event.request)
          .then(response => {
            cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => caches.match(event.request))
      )
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          // Cache successful responses
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
      .catch(() => {
        // Fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});
