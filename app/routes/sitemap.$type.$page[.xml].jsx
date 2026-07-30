import {getSitemap} from '@shopify/hydrogen';

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({request, params, context: {storefront}}) {
  // No `locales` - this store is single-market EN-US (see app/lib/context.js's
  // hardcoded i18n) with no locale-prefixed routes at all. getSitemap()
  // requires a `getLink` regardless, so it's kept but never prefixes with a
  // locale. The Hydrogen skeleton template's ['EN-US','EN-CA','FR-CA']
  // boilerplate would have emitted broken /en-ca/products/... URLs that
  // 404 on this store.
  const response = await getSitemap({
    storefront,
    request,
    params,
    getLink: ({type, baseUrl, handle}) => `${baseUrl}/${type}/${handle}`,
  });

  response.headers.set('Cache-Control', `max-age=${60 * 60 * 24}`);

  return response;
}

/** @typedef {import('./+types/sitemap.$type.$page[.xml]').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
