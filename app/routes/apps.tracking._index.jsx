import {redirect} from 'react-router';

// The order-tracking app's Shopify app proxy is only configured for the
// main digilog.pk domain (Shopify app proxies are tied to specific
// connected domains, not automatically shared across every storefront on
// the same store) - redirect this headless storefront's tracking link
// there instead of duplicating the app proxy setup.
//
// Uses react-router's `redirect()` rather than the raw `Response.redirect()`
// - the Fetch spec makes Response.redirect()'s headers immutable, which
// crashes Hydrogen's request pipeline when it tries to append its own
// headers (session cookie, powered-by, etc.) afterward.
export async function loader({request}) {
  const {search} = new URL(request.url);
  return redirect(`https://digilog.pk/apps/tracking${search}`);
}
