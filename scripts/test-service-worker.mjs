import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../sw.js', import.meta.url), 'utf8');

function makeResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    type: 'basic',
    body,
    clone() { return makeResponse(status, body); },
    async text() { return body; }
  };
}

function makeHarness({ fetchImpl, failCacheWrites = false } = {}) {
  const records = new Map();
  const keyOf = request => typeof request === 'string' ? request : request.url;
  const cache = {
    async addAll(paths) {
      for (const path of paths) records.set(new URL(path, 'https://example.test/app/').href, makeResponse(200, 'shell:' + path));
    },
    async match(request) {
      return records.get(keyOf(request));
    },
    async put(request, response) {
      if (failCacheWrites) throw new Error('simulated quota failure');
      records.set(keyOf(request), response);
    }
  };
  const listeners = new Map();
  const self = {
    location: { origin: 'https://example.test' },
    registration: { scope: 'https://example.test/app/' },
    clients: { async claim() {} },
    async skipWaiting() {},
    addEventListener(type, handler) { listeners.set(type, handler); }
  };
  const context = {
    self,
    caches: {
      async open() { return cache; },
      async keys() { return ['ai-library-shell-v57', 'ai-library-shell-v58']; },
      async delete() { return true; }
    },
    fetch: fetchImpl || (async () => makeResponse(200, 'network')),
    URL,
    Response,
    console: { warn() {} }
  };
  vm.runInNewContext(source, context, { filename: 'sw.js' });

  async function dispatchFetch({ url, mode = 'no-cors' }) {
    let responsePromise;
    const event = {
      request: { method: 'GET', url, mode },
      respondWith(promise) { responsePromise = Promise.resolve(promise); }
    };
    listeners.get('fetch')(event);
    assert.ok(responsePromise, 'service worker should handle same-origin GET request');
    return responsePromise;
  }

  return { cache, records, listeners, dispatchFetch };
}

{
  const harness = makeHarness({ fetchImpl: async () => makeResponse(503, 'server unavailable') });
  const cached = makeResponse(200, 'cached app');
  await harness.cache.put('https://example.test/app/', cached);
  const response = await harness.dispatchFetch({ url: 'https://example.test/app/', mode: 'navigate' });
  assert.equal(await response.text(), 'cached app', 'navigation should use cached app shell on HTTP errors');
}

{
  const harness = makeHarness({ fetchImpl: async () => { throw new Error('offline'); } });
  await harness.cache.put('https://example.test/app/', makeResponse(200, 'offline shell'));
  const response = await harness.dispatchFetch({ url: 'https://example.test/app/', mode: 'navigate' });
  assert.equal(await response.text(), 'offline shell', 'navigation should use cached app shell when offline');
}

{
  const harness = makeHarness({
    failCacheWrites: true,
    fetchImpl: async () => makeResponse(200, 'fresh online app')
  });
  const response = await harness.dispatchFetch({ url: 'https://example.test/app/', mode: 'navigate' });
  assert.equal(await response.text(), 'fresh online app', 'cache quota errors must not discard a successful online response');
}

{
  const harness = makeHarness({ fetchImpl: async () => makeResponse(503, 'catalog unavailable') });
  const url = 'https://example.test/app/content/catalog.json';
  await harness.cache.put(url, makeResponse(200, '{"version":1,"books":[]}'));
  const response = await harness.dispatchFetch({ url });
  assert.equal(await response.text(), '{"version":1,"books":[]}', 'catalog requests should fall back to cached data on HTTP errors');
}

console.log('Service Worker offline fallback tests passed (4 scenarios).');
