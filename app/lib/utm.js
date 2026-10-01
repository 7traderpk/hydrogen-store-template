/**
 * Tags a checkout (or any outbound) URL with this storefront's UTM
 * parameters, so orders placed via lite.digilog.pk are attributable in
 * Shopify Analytics (Analytics > Reports, filter by utm_source = lite).
 *
 * Existing query params are preserved untouched, and if the URL already
 * carries any utm_* param, none of them are overwritten - the caller's
 * values win. This matters because checkoutUrl can already carry a
 * discount code or (via a shared/forwarded link) someone else's UTM tags,
 * and this should never clobber either.
 *
 * @param {string} url
 * @returns {string}
 */
export function appendUtmParams(url) {
  const parsed = new URL(url);
  const defaults = {
    utm_source: 'lite',
    utm_medium: 'pwa',
    utm_campaign: 'lite-storefront',
  };

  for (const [key, value] of Object.entries(defaults)) {
    if (!parsed.searchParams.has(key)) {
      parsed.searchParams.set(key, value);
    }
  }

  return parsed.toString();
}
