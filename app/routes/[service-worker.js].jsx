/**
 * Serves the service worker JS at the root scope (/service-worker.js), so
 * its default scope covers the whole site — a service worker's scope is
 * capped at the directory it's served from, and this is a live storefront
 * where every path needs to be reachable, not just a subfolder.
 *
 * Deliberately network-first for everything, no offline fallback page:
 * this is a real store with live pricing/stock/cart state, so serving a
 * stale cached page when the network is merely slow (rather than fully
 * offline) risks showing wrong prices or stock. The only thing actually
 * cached is the static build output under /assets/, which is
 * content-hashed by Vite and safe to keep indefinitely.
 *
 * @param {Route.LoaderArgs}
 */
export function loader() {
  const body = `
const CACHE_NAME = 'digilog-shell-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Only Vite's content-hashed static assets are ever cached - product
  // pages, collections, cart, and checkout always hit the network so
  // prices/stock/cart state are never served stale.
  if (!url.pathname.startsWith('/assets/')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          })
      )
    )
  );
});
`.trim();

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache',
      'Service-Worker-Allowed': '/',
    },
  });
}

/** @typedef {import('./+types/[service-worker.js]').Route} Route */
