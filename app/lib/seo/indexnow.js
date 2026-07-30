/**
 * Submit URLs to IndexNow (https://www.indexnow.org/) so participating
 * search engines re-crawl them promptly. Used by app/routes/api.indexnow.jsx.
 *
 * @param {object} input
 * @param {string[]} input.urls Absolute URLs to submit.
 * @param {string} input.origin Site origin; its host must match the URLs.
 * @param {string} input.key IndexNow API key (served at /indexnow.txt).
 * @returns {Promise<{ok: boolean, status: number}>}
 */
export async function pingIndexNow({urls, origin, key}) {
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: {'Content-Type': 'application/json; charset=utf-8'},
    body: JSON.stringify({
      host: new URL(origin).host,
      key,
      keyLocation: `${origin}/indexnow.txt`,
      urlList: urls,
    }),
  });
  return {ok: response.ok, status: response.status};
}
