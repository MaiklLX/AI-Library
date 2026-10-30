/* AI Library service worker — offline app shell, network-first pages */
const CACHE_PREFIX = 'ai-library-shell-';
const CACHE_NAME = CACHE_PREFIX + 'v20';
const APP_SHELL = ['./', './index.html', './premiere.html', './book-creator.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
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
          await cache.put(new URL('./', self.registration.scope).href, response.clone());
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return (await cache.match(request)) ||
          (await cache.match(new URL('./', self.registration.scope).href)) ||
          (await cache.match(new URL('./index.html', self.registration.scope).href)) ||
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
        if (response && response.ok && response.type === 'basic') {
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return (await cache.match(request)) || new Response('', { status: 503, statusText: 'Offline' });
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
      if (response && response.ok && response.type === 'basic') {
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      return new Response('', { status: 503, statusText: 'Offline' });
    }
  })());
});
