// public/sw.js
// Service Worker for AI Logo Generator PWA
const CACHE_NAME = 'logo-generator-v3';

// Files to cache - be selective to avoid caching Next.js assets
const ASSETS_TO_CACHE = [
  '/manifest.json',
  '/logo.ico'
];

// Install event - cache only specific assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first strategy for Next.js assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for unsupported schemes
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip caching for Next.js specific paths
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('.json') ||
    url.pathname === '/sw.js' ||
    url.pathname === '/sw-register.js'
  ) {
    // Network only for Next.js assets and API calls
    event.respondWith(fetch(request));
    return;
  }

  // For other requests, use network-first strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Only cache specific file types
        if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|css|js)$/)) {
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(request, responseToCache));
        }

        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(request);
      })
  );
});