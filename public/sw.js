// Service Worker for caching static assets
// Version: 2.0.0

const CACHE_NAME = 'spare-finance-v2';
const STATIC_ASSETS = [
  '/icon.svg',
];

// Routes that should NEVER be cached (always fetch from network)
const NO_CACHE_ROUTES = [
  '/dashboard',
  '/insights',
  '/reports',
  '/planning',
  '/investments',
  '/banking',
  '/billing',
  '/profile',
  '/members',
  '/api/',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  const pathname = url.pathname;

  // Skip external URLs (extensions, etc.)
  if (
    event.request.url.startsWith('chrome-extension://') ||
    event.request.url.startsWith('moz-extension://')
  ) {
    return;
  }

  // NEVER cache dynamic routes - always fetch from network
  const shouldNotCache = NO_CACHE_ROUTES.some(route => pathname.startsWith(route));
  
  if (shouldNotCache) {
    // For dynamic routes, always fetch from network and bypass cache
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => {
        // If network fails, return a basic error response
        return new Response('Network error', { status: 408 });
      })
    );
    return;
  }

  // For static assets and Next.js static files, use cache-first strategy
  if (event.request.url.includes('_next/static') || event.request.url.includes('/api/')) {
    // Let Next.js handle its own caching
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // For static assets, prefer cache but fallback to network
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Only cache static assets (images, fonts, icons) - never cache HTML pages
        if (
          event.request.url.match(/\.(jpg|jpeg|png|gif|svg|webp|woff|woff2|ttf|eot|ico)$/i) &&
          !pathname.match(/\.html?$/i)
        ) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      });
    })
  );
});

