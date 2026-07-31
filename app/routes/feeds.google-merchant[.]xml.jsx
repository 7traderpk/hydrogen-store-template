import {SITE_URL, SITE_NAME} from '~/lib/seo/metadata';
import {stripHtml, truncate} from '~/lib/seo/text';

/** 250 products per page x 40 pages = 10,000 product cap. */
const MAX_PAGES = 40;
const DESCRIPTION_MAX = 5000;

/**
 * Google Merchant Center product feed (RSS 2.0 + Google Base namespace).
 * Point Merchant Center at this URL as a scheduled fetch - registering it
 * needs your Merchant Center account, but the feed itself needs nothing
 * beyond this route existing.
 *
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  const products = [];
  let cursor = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    // Sequential cursor pagination; each page depends on the previous cursor.
    const {products: connection} = await context.storefront.query(
      MERCHANT_FEED_QUERY,
      {variables: {cursor}},
    );
    products.push(...connection.nodes);
    if (!connection.pageInfo.hasNextPage) break;
    cursor = connection.pageInfo.endCursor;
  }

  const items = products
    .map((product) => buildItem(product))
    .filter(Boolean)
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xmlEscape(`${SITE_NAME} product feed`)}</title>
    <link>${xmlEscape(SITE_URL)}</link>
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': `max-age=${60 * 60 * 6}`,
    },
  });
}

/**
 * Build one feed <item> for a product, or null when Google can't list it
 * (no price on the first variant, or no image).
 * @param {object} product
 * @returns {string | null}
 */
function buildItem(product) {
  // Multi-variant products aren't sold on this storefront and their product
  // page 404s - see products.$handle.jsx - so don't advertise them here.
  if (product.variants.nodes.length > 1) return null;

  const variant = product.variants.nodes[0];
  const image = product.featuredImage;
  if (!variant?.price?.amount || !image?.url) return null;

  let identifier;
  if (variant.barcode) {
    identifier = `<g:gtin>${xmlEscape(variant.barcode)}</g:gtin>`;
  } else if (variant.sku) {
    identifier = `<g:mpn>${xmlEscape(variant.sku)}</g:mpn>`;
  } else {
    identifier = '<g:identifier_exists>false</g:identifier_exists>';
  }

  return `    <item>
      <g:id>${xmlEscape(variant.sku || product.handle)}</g:id>
      <title>${xmlEscape(product.title)}</title>
      <link>${xmlEscape(`${SITE_URL}/products/${product.handle}`)}</link>
      <g:description>${xmlEscape(truncate(stripHtml(product.description), DESCRIPTION_MAX))}</g:description>
      <g:image_link>${xmlEscape(image.url)}</g:image_link>
      <g:availability>${variant.availableForSale ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${xmlEscape(`${variant.price.amount} ${variant.price.currencyCode}`)}</g:price>
      <g:brand>${xmlEscape(product.vendor)}</g:brand>
      <g:condition>new</g:condition>
      ${identifier}
    </item>`;
}

/**
 * Escape a value for safe interpolation into XML text/attributes.
 * @param {unknown} value
 * @returns {string}
 */
function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/product
const MERCHANT_FEED_QUERY = `#graphql
  query MerchantFeedProducts(
    $cursor: String
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: 250, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        handle
        title
        description
        vendor
        featuredImage {
          url
          altText
        }
        variants(first: 2) {
          nodes {
            sku
            barcode
            availableForSale
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

/** @typedef {import('./+types/feeds.google-merchant[.]xml').Route} Route */
