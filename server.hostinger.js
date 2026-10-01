// Node.js production entry point for Hostinger shared hosting.
//
// The default `server.js` targets Shopify Oxygen (a Cloudflare Workers-style
// runtime) and expects Workers-only globals (`caches`, `ExecutionContext`)
// that don't exist in plain Node. This file adapts the built Oxygen worker
// bundle (`dist/server/index.js`) to run under Node's `http` module instead,
// via `@whatwg-node/server` for Request/Response <-> Node req/res bridging.
//
// Requires `npm run build` to have produced `dist/server/index.js` and
// `dist/client/`.

import {createServer} from 'node:http';
import {createReadStream, existsSync, statSync} from 'node:fs';
import {join, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServerAdapter} from '@whatwg-node/server';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const clientDir = join(__dirname, 'dist', 'client');

// Minimal in-memory polyfill for the Cache API, which Hydrogen uses for
// sub-request caching (`caches.open('hydrogen')`). Oxygen provides this
// natively; Node does not.
class MemoryCache {
  constructor() {
    this.store = new Map();
  }
  async match(request) {
    const key = typeof request === 'string' ? request : request.url;
    const cached = this.store.get(key);
    // A Response body stream can only be read once; every caller needs its
    // own clone, otherwise the second reader hits "Body has already been read".
    return cached ? cached.clone() : undefined;
  }
  async put(request, response) {
    const key = typeof request === 'string' ? request : request.url;
    this.store.set(key, response.clone ? response.clone() : response);
  }
  async delete(request) {
    return this.store.delete(typeof request === 'string' ? request : request.url);
  }
}

if (!globalThis.caches) {
  const cacheStore = new Map();
  globalThis.caches = {
    open: async (name) => {
      if (!cacheStore.has(name)) cacheStore.set(name, new MemoryCache());
      return cacheStore.get(name);
    },
  };
}

// Node's fetch (undici) requires `duplex: 'half'` in RequestInit whenever a
// request has a body - a restriction that doesn't exist in the Cloudflare
// Workers runtime Hydrogen targets natively. Without this, Hydrogen's
// built-in Storefront API proxy (used for direct browser->Shopify
// cart/checkout calls, see the bundled `forward()` helper in
// dist/server/index.js) throws `TypeError: RequestInit: duplex option is
// required when sending a body` on every POST, leaking the un-drained
// incoming request body stream on each failure. That leak is what was
// driving heap usage toward 1.3GB+ over a few days despite ~1 req/min
// average traffic.
const nativeFetch = globalThis.fetch;
function patchedFetch(input, init) {
  if (init && init.body && init.duplex === undefined) {
    init = {...init, duplex: 'half'};
  }
  return nativeFetch(input, init);
}
globalThis.fetch = patchedFetch;

const {default: worker} = await import('./dist/server/index.js');

const env = {
  SESSION_SECRET: process.env.SESSION_SECRET,
  PUBLIC_STORE_DOMAIN: process.env.PUBLIC_STORE_DOMAIN,
  PUBLIC_STOREFRONT_API_TOKEN: process.env.PUBLIC_STOREFRONT_API_TOKEN,
  PRIVATE_STOREFRONT_API_TOKEN: process.env.PRIVATE_STOREFRONT_API_TOKEN,
  // Customer Account API (native /account login, orders, addresses).
  // SHOP_ID is the numeric id (e.g. from `shop { id }` in the Admin API) -
  // Hydrogen needs it to build the shopify.com/authentication/<shopId>
  // OAuth URLs; Shopify transparently serves those under the store's
  // configured custom Customer Account API domain, if any (e.g.
  // account.<store>.com), so Hydrogen itself never needs that domain.
  PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID:
    process.env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID,
  SHOP_ID: process.env.SHOP_ID,
  // /admin/design dashboard auth (bcrypt-hashed password, checked in
  // routes/admin.login.jsx) and the Admin API token it uses server-side
  // only to write the design config back to a Shop metafield.
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  SHOPIFY_ADMIN_API_TOKEN: process.env.SHOPIFY_ADMIN_API_TOKEN,
  SHOPIFY_SHOP_GID: process.env.SHOPIFY_SHOP_GID,
  // IndexNow ping key (routes/[indexnow.txt].jsx, routes/api.indexnow.jsx) -
  // optional; both routes degrade gracefully (404/401) when unset.
  INDEXNOW_KEY: process.env.INDEXNOW_KEY,
};

const OPTIONAL_ENV_VARS = new Set([
  'PRIVATE_STOREFRONT_API_TOKEN',
  'PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID',
  'SHOP_ID',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD_HASH',
  'SHOPIFY_ADMIN_API_TOKEN',
  'SHOPIFY_SHOP_GID',
  'INDEXNOW_KEY',
]);

for (const [key, value] of Object.entries(env)) {
  if (!value && !OPTIONAL_ENV_VARS.has(key)) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const MIME_TYPES = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.woff2': 'font/woff2',
};

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    createReadStream(filePath)
      .on('data', (chunk) => chunks.push(chunk))
      .on('end', () => resolve(Buffer.concat(chunks)))
      .on('error', reject);
  });
}

// Applied here rather than in entry.server.jsx (where the CSP is set) so
// every response gets them uniformly - static assets below, and resource
// routes like [robots.txt].jsx/[sitemap.xml].jsx that return a Response
// directly from their own loader, never touch entry.server.jsx at all.
function applySecurityHeaders(response) {
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload',
  );
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );
  response.headers.set('X-Frame-Options', 'DENY');
  // Hydrogen sets this itself; strip it so the exact framework/version
  // isn't advertised to every visitor.
  response.headers.delete('powered-by');
  return response;
}

const app = createServerAdapter(async (request) => {
  // Traefik terminates TLS and forwards to this app over plain HTTP
  // internally (confirmed: it sends `x-forwarded-proto: https` on every
  // real request), so request.url's scheme is always "http:" here even
  // though every real visitor is on https://. Hydrogen's own sitemap
  // generator (getSitemapIndex, in @shopify/hydrogen) builds every URL
  // straight from `new URL(request.url).origin`, so left uncorrected this
  // produced an entire sitemap of http:// URLs - confirmed in Google
  // Search Console as the single largest reason pages weren't indexed
  // ("Page with redirect", ~3,400 pages: Google followed each http://
  // sitemap URL to its https redirect but wouldn't index the mid-redirect
  // URL itself). Rebuilding the request with the corrected scheme here
  // fixes this at the source for the sitemap and anything else in the
  // app that reads request.url, not just one route.
  if (request.headers.get('x-forwarded-proto') === 'https' && request.url.startsWith('http://')) {
    const httpsUrl = 'https://' + request.url.slice('http://'.length);
    const init = {method: request.method, headers: request.headers};
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body;
      init.duplex = 'half';
    }
    request = new Request(httpsUrl, init);
  }

  const url = new URL(request.url);

  if (url.pathname.startsWith('/assets/') || url.pathname === '/favicon.svg') {
    const filePath = join(clientDir, url.pathname);
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      const body = await readFile(filePath);
      return applySecurityHeaders(
        new Response(body, {
          headers: {
            'Content-Type': MIME_TYPES[extname(filePath)] || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        }),
      );
    }
  }

  const executionContext = {
    waitUntil: (promise) => {
      Promise.resolve(promise).catch((err) => console.error('waitUntil error:', err));
    },
    passThroughOnException: () => {},
  };

  const response = await worker.fetch(request, env, executionContext);
  return applySecurityHeaders(response);
});

const port = process.env.PORT || 3000;
createServer(app).listen(port, () => {
  console.log(`Hydrogen storefront listening on port ${port}`);
});
