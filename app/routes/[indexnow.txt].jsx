/**
 * indexnow.txt - serves the IndexNow API key so api.indexnow.org can verify
 * site ownership (keyLocation). 404s when INDEXNOW_KEY is not configured.
 * @param {Route.LoaderArgs}
 */
export function loader({context}) {
  const key = context.env.INDEXNOW_KEY;
  if (!key) {
    throw new Response('Not Found', {status: 404});
  }

  return new Response(key, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

/** @typedef {import('./+types/[indexnow.txt]').Route} Route */
