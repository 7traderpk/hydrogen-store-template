import {pingIndexNow} from '~/lib/seo/indexnow';

/**
 * IndexNow push endpoint. External automation (a Shopify webhook or cron job)
 * should POST here whenever content is published or updated so the changed
 * URLs are submitted to IndexNow.
 *
 * Body: {"key": "...", "urls": ["https://..."]}. The key may instead be sent
 * as an `Authorization: Bearer <key>` header; it must match INDEXNOW_KEY.
 * @param {Route.ActionArgs}
 */
export async function action({request, context}) {
  if (request.method !== 'POST') {
    return methodNotAllowed();
  }

  let body;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const key = context.env.INDEXNOW_KEY;
  const authorization = request.headers.get('Authorization');
  const providedKey =
    body?.key ??
    (authorization?.startsWith('Bearer ') ? authorization.slice(7) : null);
  if (!key || providedKey !== key) {
    return Response.json({error: 'Unauthorized'}, {status: 401});
  }

  const host = new URL(request.url).host;
  const urls = body?.urls;
  if (
    !Array.isArray(urls) ||
    urls.length === 0 ||
    !urls.every((url) => isUrlOnHost(url, host))
  ) {
    return Response.json(
      {error: 'urls must be a non-empty array of http(s) URLs on this host'},
      {status: 400},
    );
  }

  const result = await pingIndexNow({
    urls,
    origin: new URL(request.url).origin,
    key,
  });
  return Response.json(result);
}

/** GET/HEAD hit the loader, not the action; answer 405 like other verbs. */
export function loader() {
  return methodNotAllowed();
}

function methodNotAllowed() {
  return Response.json(
    {error: 'Method not allowed'},
    {status: 405, headers: {Allow: 'POST'}},
  );
}

/**
 * @param {unknown} value
 * @param {string} host
 * @returns {boolean}
 */
function isUrlOnHost(value, host) {
  try {
    const url = new URL(String(value));
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.host === host
    );
  } catch {
    return false;
  }
}

/** @typedef {import('./+types/api.indexnow').Route} Route */
