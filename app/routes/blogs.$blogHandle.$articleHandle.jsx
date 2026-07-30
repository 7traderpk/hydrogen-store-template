import {Await, useLoaderData} from 'react-router';
import {Suspense} from 'react';
import {Image} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {buildMeta, SITE_URL, SITE_NAME} from '~/lib/seo/metadata';
import {stripHtml, truncate, firstSentence, estimateReadingTime} from '~/lib/seo/text';
import {injectHeadingIds} from '~/lib/seo/toc';
import {JsonLd} from '~/components/seo/JsonLd';
import {blogPosting} from '~/lib/seo/schema/blogPosting';
import {breadcrumbList} from '~/lib/seo/schema/breadcrumbList';
import {ArticleItem} from '~/components/ArticleItem';
import {Faq} from '~/components/Faq';
import {AuthorBio} from '~/components/AuthorBio';
import {parseJsonMetafield} from '~/lib/seo/metafields';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  const article = data?.article;
  if (!article) return buildMeta({title: 'Article not found', robots: 'noindex,nofollow'});

  return buildMeta({
    title: article.seo?.title || article.title,
    description:
      article.seo?.description ||
      truncate(article.excerpt || stripHtml(article.contentHtml), 160),
    url: `${SITE_URL}/blogs/${data.blogHandle}/${article.handle}`,
    image: article.image?.url,
    type: 'article',
  });
};

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {Route.LoaderArgs}
 */
async function loadCriticalData({context, request, params}) {
  const {blogHandle, articleHandle} = params;

  if (!articleHandle || !blogHandle) {
    throw new Response('Not found', {status: 404});
  }

  const [{blog}] = await Promise.all([
    context.storefront.query(ARTICLE_QUERY, {
      variables: {blogHandle, articleHandle},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!blog?.articleByHandle) {
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(
    request,
    {
      handle: articleHandle,
      data: blog.articleByHandle,
    },
    {
      handle: blogHandle,
      data: blog,
    },
  );

  const article = blog.articleByHandle;

  // TOC only renders for 2+ headings (see component) - a single-heading nav
  // is useless. readingTimeMinutes is computed from the original content,
  // before the id-injection pass rewrites the HTML.
  const readingTimeMinutes = estimateReadingTime(article.contentHtml);
  const {html: contentHtml, headings: tocHeadings} = injectHeadingIds(
    article.contentHtml,
  );

  return {
    article: {...article, contentHtml},
    blogHandle,
    blogTitle: blog.title,
    tocHeadings,
    readingTimeMinutes,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {Route.LoaderArgs}
 */
function loadDeferredData({context, params}) {
  const relatedArticles = context.storefront
    .query(RELATED_ARTICLES_QUERY, {
      variables: {blogHandle: params.blogHandle, first: 20},
    })
    .then((data) => data?.blog?.articles?.nodes || [])
    .catch((error) => {
      console.error(error);
      return [];
    });

  return {relatedArticles};
}

/**
 * Same-blog articles, ranked by shared tags then recency. When nothing
 * shares a tag (common on this store - many articles have no tags at all),
 * every candidate ties at 0 overlap and the sort falls back to pure
 * recency, so the section still shows something reasonable.
 */
function pickRelatedArticles(all, {excludeHandle, tags = [], limit = 3}) {
  const currentTags = new Set(tags.map((t) => t.toLowerCase()));
  const scored = all
    .filter((a) => a.handle !== excludeHandle)
    .map((a) => ({
      article: a,
      overlap: (a.tags || []).filter((t) => currentTags.has(t.toLowerCase())).length,
    }));
  scored.sort((a, b) => {
    if (b.overlap !== a.overlap) return b.overlap - a.overlap;
    return new Date(b.article.publishedAt) - new Date(a.article.publishedAt);
  });
  return scored.slice(0, limit).map((s) => s.article);
}

export default function Article() {
  /** @type {LoaderReturnData} */
  const {article, blogHandle, blogTitle, tocHeadings, readingTimeMinutes, relatedArticles} =
    useLoaderData();
  const {title, image, contentHtml, author} = article;
  const directAnswer = article.excerpt || firstSentence(stripHtml(contentHtml));

  // Metafields arrive in ARTICLE_QUERY identifier order: [faqs, author_bio]
  // (null when unset in Shopify admin).
  const [faqsMetafield, authorBioMetafield] = article.metafields ?? [];

  const publishedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt));

  const articleUrl = `${SITE_URL}/blogs/${blogHandle}/${article.handle}`;
  const jsonLd = [
    blogPosting({
      title: article.title,
      description: article.seo?.description || article.excerpt || undefined,
      image: image?.url,
      url: articleUrl,
      origin: SITE_URL,
      datePublished: article.publishedAt,
      authorName: author?.name || SITE_NAME,
      contentHtml,
      keywords: article.tags,
    }),
    breadcrumbList([
      {name: 'Home', url: SITE_URL},
      {name: blogTitle || 'Blog', url: `${SITE_URL}/blogs/${blogHandle}`},
      {name: article.title, url: articleUrl},
    ]),
  ];

  return (
    <div className="article">
      <JsonLd data={jsonLd} />
      <h1>
        {title}
        <div>
          <time dateTime={article.publishedAt}>{publishedDate}</time> &middot;{' '}
          <address>{author?.name}</address> &middot;{' '}
          <span className="article-reading-time">{readingTimeMinutes} min read</span>
        </div>
      </h1>

      {directAnswer && <p className="pb-direct-answer">{directAnswer}</p>}

      {image && (
        <Image
          data={image}
          alt={image.altText || article.title}
          sizes="90vw"
          loading="eager"
        />
      )}

      {tocHeadings.length >= 2 && (
        <nav className="article-toc" aria-label="Table of contents">
          <p className="article-toc-heading">In this article</p>
          <ol>
            {tocHeadings.map((h) => (
              <li key={h.id}>
                <a href={`#${h.id}`}>{h.text}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div
        dangerouslySetInnerHTML={{__html: contentHtml}}
        className="article"
      />

      <AuthorBio bio={parseJsonMetafield(authorBioMetafield)} fallbackName={author?.name} />
      <Faq items={parseJsonMetafield(faqsMetafield)} />

      <RelatedArticles
        articles={relatedArticles}
        excludeHandle={article.handle}
        tags={article.tags}
      />
    </div>
  );
}

function RelatedArticles({articles, excludeHandle, tags}) {
  return (
    <section className="related-articles" aria-labelledby="related-articles-heading">
      <h2 id="related-articles-heading">Related articles</h2>
      <Suspense fallback={null}>
        <Await resolve={articles}>
          {(resolved) => {
            const picked = pickRelatedArticles(resolved || [], {excludeHandle, tags});
            if (!picked.length) return null;
            return (
              <div className="blog-grid">
                {picked.map((a) => (
                  <ArticleItem article={a} key={a.id} loading="lazy" />
                ))}
              </div>
            );
          }}
        </Await>
      </Suspense>
    </section>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog#field-blog-articlebyhandle
const ARTICLE_QUERY = `#graphql
  query Article(
    $articleHandle: String!
    $blogHandle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    blog(handle: $blogHandle) {
      handle
      title
      articleByHandle(handle: $articleHandle) {
        handle
        title
        contentHtml
        excerpt
        tags
        publishedAt
        author: authorV2 {
          name
        }
        image {
          id
          altText
          url
          width
          height
        }
        seo {
          description
          title
        }
        metafields(
          identifiers: [
            {namespace: "custom", key: "faqs"}
            {namespace: "custom", key: "author_bio"}
          ]
        ) {
          value
          type
        }
      }
    }
  }
`;

const RELATED_ARTICLES_QUERY = `#graphql
  query RelatedArticles($blogHandle: String!, $first: Int!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    blog(handle: $blogHandle) {
      articles(first: $first, sortKey: UPDATED_AT, reverse: true) {
        nodes {
          id
          handle
          title
          publishedAt
          tags
          author: authorV2 {
            name
          }
          image {
            id
            altText
            url
            width
            height
          }
          blog {
            handle
          }
        }
      }
    }
  }
`;

/** @typedef {import('./+types/blogs.$blogHandle.$articleHandle').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
