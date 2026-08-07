import {SITE_URL} from '~/lib/seo/metadata';

/**
 * A dedicated image sitemap (https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps),
 * separate from the URL sitemaps Hydrogen's own getSitemap()/getSitemapIndex()
 * generate (see [sitemap.xml].jsx / sitemap.$type.$page[.xml].jsx) - those
 * don't support the <image:image> extension at all, and product images are
 * otherwise only discoverable by Google Images through a slower organic
 * crawl of each product page. Referenced as an extra `Sitemap:` line in
 * robots.txt rather than folded into the existing sitemap index, so it
 * doesn't need to match that index's internal pagination.
 *
 * One combined file rather than paginated - the catalog is well under the
 * sitemap protocol's 50,000 URL limit, so this stays simpler to generate
 * and reason about.
 * @param {Route.LoaderArgs}
 */
export async function loader({context: {storefront}}) {
  const products = await fetchAllProductImages(storefront);

  const body = buildImageSitemapXml(products);

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}

const PAGE_SIZE = 100;
// Safety bound on total products fetched, well above any real catalog size
// for this store - prevents a runaway loop if pagination ever misbehaves.
const MAX_PRODUCTS = 20000;

async function fetchAllProductImages(storefront) {
  const products = [];
  let cursor = null;

  while (products.length < MAX_PRODUCTS) {
    const {products: connection} = await storefront.query(
      SITEMAP_IMAGES_QUERY,
      {variables: {first: PAGE_SIZE, after: cursor}},
    );

    for (const product of connection.nodes) {
      if (product.featuredImage?.url) products.push(product);
    }

    if (!connection.pageInfo.hasNextPage) break;
    cursor = connection.pageInfo.endCursor;
  }

  return products;
}

function buildImageSitemapXml(products) {
  const urls = products
    .map(
      (product) => `  <url>
    <loc>${escapeXml(`${SITE_URL}/products/${product.handle}`)}</loc>
    <image:image>
      <image:loc>${escapeXml(product.featuredImage.url)}</image:loc>
      <image:title>${escapeXml(product.featuredImage.altText || product.title)}</image:title>
    </image:image>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const SITEMAP_IMAGES_QUERY = `#graphql
  query SitemapImages($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      nodes {
        handle
        title
        featuredImage {
          url
          altText
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

/** @typedef {import('./+types/[sitemap-images.xml]').Route} Route */
