/* AI Library service worker — resilient offline app shell and book delivery.
 * Shell cache versions are immutable: bump CACHE_NAME when app-shell assets change.
 * Downloaded book bodies are stored separately in IndexedDB by the download manager.
 */
const CACHE_PREFIX = 'ai-library-shell-';
const CACHE_NAME = CACHE_PREFIX + 'v58';
const APP_SHELL = [
  './',
  './index.html',
  './premiere.html',
  './book-creator.html',
  './manifest.webmanifest',
  './icon.svg',
  './src/platform/runtime.js',
  './src/platform/library-store.js',
  './src/platform/download-manager.js'
];

async function cacheResponseSafely(cache, request, response) {
  if (!response || !response.ok || response.type !== 'basic') return;
  try {
    await cache.put(request, response.clone());
  } catch (error) {
    // A full/evicted browser cache must not turn a successful online request into a failure.
    console.warn('AI Library: app cache could not be updated.', error);
  }
}

async function matchShellFallback(cache, request) {
  return (await cache.match(request)) ||
    (await cache.match(new URL('./', self.registration.scope).href)) ||
    (await cache.match(new URL('./index.html', self.registration.scope).href));
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // addAll is intentionally atomic: do not activate a partial app shell.
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Never intercept AI generation or shared-library API calls.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          // Cache both the requested route and the app entry point for standalone launches.
          await cacheResponseSafely(cache, new URL('./', self.registration.scope).href, response);
          await cacheResponseSafely(cache, request, response);
          return response;
        }
        // A transient server error or deployment gap should not blank an installed library.
        return (await matchShellFallback(cache, request)) || response;
      } catch {
        return (await matchShellFallback(cache, request)) ||
          new Response('AI Library пока недоступна офлайн. Откройте сайт с подключением к интернету хотя бы один раз.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
      }
    })());
    return;
  }

  // Published catalog and book files use network-first so new commits appear promptly.
  if (url.pathname.endsWith('/content/catalog.json') ||
      url.pathname.includes('/content/books/')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request, { cache: 'no-cache' });
        if (response && response.ok) {
          await cacheResponseSafely(cache, request, response);
          return response;
        }
        return (await cache.match(request)) || response;
      } catch {
        return (await cache.match(request)) ||
          new Response('', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      await cacheResponseSafely(cache, request, response);
      return response;
    } catch {
      return new Response('', { status: 503, statusText: 'Offline' });
    }
  })());
});
