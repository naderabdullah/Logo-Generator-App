// Service Worker for AI Logo Generator PWA
const CACHE_NAME = 'logo-generator-v1';

// Files to cache
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/smartyapps.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
  console.log('Service Worker activated');
});

// Basic offline fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if found
        if (response) {
          return response;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .catch(() => {
            // If the request is for an image, return the cached smartyapps icon
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
              return caches.match('/icons/smartyapps.png');
            }
            
            // Return a simple offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return new Response('You are currently offline. Please reconnect to use the Logo Generator.', {
                headers: { 'Content-Type': 'text/html' }
              });
            }
            
            // Return a default response for other requests
            return new Response('Offline content unavailable', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});