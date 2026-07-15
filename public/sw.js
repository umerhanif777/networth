/* Networth service worker.
 *
 * Strategy is deliberately update-safe (Expo's PWA guide warns that aggressive
 * caching can trap users on a stale build):
 *   - Navigations  -> network-first, fall back to cached shell when offline.
 *     So a fresh deploy is fetched whenever online, and the app still opens
 *     offline.
 *   - Hashed static assets (/_expo, /assets, /icons) -> cache-first. Their
 *     filenames change every build, so caching them forever is safe.
 *   - skipWaiting + clients.claim so a new worker takes over promptly.
 */
const VERSION = 'v3';
const SHELL_CACHE = `networth-shell-${VERSION}`;
const ASSET_CACHE = `networth-assets-${VERSION}`;
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.add(OFFLINE_URL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, ASSET_CACHE]);
      const names = await caches.keys();
      await Promise.all(names.filter((n) => !keep.has(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

const isHashedAsset = (url) =>
  url.pathname.startsWith('/_expo/') ||
  url.pathname.startsWith('/assets/') ||
  url.pathname.startsWith('/icons/');

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // don't touch cross-origin

  // App shell / navigations: network-first, offline fallback to cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(SHELL_CACHE);
          cache.put(OFFLINE_URL, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(OFFLINE_URL);
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Immutable hashed assets: cache-first.
  if (isHashedAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const fresh = await fetch(request);
        const cache = await caches.open(ASSET_CACHE);
        cache.put(request, fresh.clone());
        return fresh;
      })()
    );
  }
});
