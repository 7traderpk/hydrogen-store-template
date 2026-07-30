import {SITE_URL, SITE_NAME} from '~/lib/seo/metadata';
import {stripHtml, truncate} from '~/lib/seo/text';

/** Most recent articles included in the feed, across all blogs. */
const MAX_ARTICLES = 50;

/**
 * rss.xml - RSS 2.0 feed of the latest blog articles across ALL blogs,
 * site-wide. Additive alongside the per-blog
 * blogs.$blogHandle.rss[.xml].jsx feed - this one's the single canonical
 * entry point some feed readers/directories expect; the per-blog one stays
 * for readers who only want one blog's posts.
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  const {blogs} = await context.storefront.query(RSS_FEED_QUERY);

  const articles = blogs.nodes
    .flatMap((blog) => blog.articles.nodes)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, MAX_ARTICLES);

  const items = articles
    .map((article) => {
      const link = `${SITE_URL}/blogs/${article.blog.handle}/${article.handle}`;
      const description =
        article.excerpt || truncate(stripHtml(article.contentHtml), 300);
      return `    <item>
      <title>${xmlEscape(article.title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      <description>${xmlEscape(description)}</description>
    </item>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(SITE_NAME)}</title>
    <link>${xmlEscape(SITE_URL)}</link>
    <description>${xmlEscape(`Latest articles from ${SITE_NAME}.`)}</description>
    <atom:link href="${xmlEscape(`${SITE_URL}/rss.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': `max-age=${60 * 60}`,
    },
  });
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

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog
const RSS_FEED_QUERY = `#graphql
  query RssFeed(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    blogs(first: 10) {
      nodes {
        handle
        articles(first: 20, sortKey: UPDATED_AT, reverse: true) {
          nodes {
            title
            handle
            publishedAt
            excerpt
            contentHtml
            authorV2 {
              name
            }
            blog {
              handle
            }
            image {
              url
              altText
            }
          }
        }
      }
    }
  }
`;

/** @typedef {import('./+types/[rss.xml]').Route} Route */
