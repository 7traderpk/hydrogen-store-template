import {SITE_URL, SITE_NAME} from '~/lib/seo/metadata';
import {stripHtml, truncate} from '~/lib/seo/text';

/**
 * RSS 2.0 feed for a single blog - /blogs/:blogHandle/rss.xml (this store
 * uses the plural /blogs/ URL structure throughout, so the feed lives under
 * the same blog-scoped path rather than a single site-wide /blog/rss.xml).
 *
 * @param {Route.LoaderArgs}
 */
export async function loader({params, context}) {
  const {blogHandle} = params;
  if (!blogHandle) throw new Response('Not found', {status: 404});

  const {blog} = await context.storefront.query(RSS_QUERY, {
    variables: {blogHandle, first: 20},
  });

  if (!blog) throw new Response('Not found', {status: 404});

  const body = buildRss({blog, blogHandle});

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': `max-age=${60 * 60}`,
    },
  });
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildRss({blog, blogHandle}) {
  const blogUrl = `${SITE_URL}/blogs/${blogHandle}`;
  const items = (blog.articles?.nodes || [])
    .map((article) => {
      const url = `${blogUrl}/${article.handle}`;
      const description =
        article.excerpt || truncate(stripHtml(article.contentHtml), 500);
      return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      ${article.author?.name ? `<author>${escapeXml(article.author.name)}</author>` : ''}
      <description><![CDATA[${description}]]></description>
    </item>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(blog.title)} - ${escapeXml(SITE_NAME)}</title>
    <link>${blogUrl}</link>
    <description>${escapeXml(`Latest articles from the ${blog.title} blog.`)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;
}

const RSS_QUERY = `#graphql
  query BlogRss($blogHandle: String!, $first: Int!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    blog(handle: $blogHandle) {
      title
      articles(first: $first, sortKey: UPDATED_AT, reverse: true) {
        nodes {
          handle
          title
          contentHtml
          excerpt
          publishedAt
          author: authorV2 {
            name
          }
        }
      }
    }
  }
`;

/** @typedef {import('./+types/blogs.$blogHandle.rss[.xml]').Route} Route */
