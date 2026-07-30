import {Link, useLoaderData} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {buildMeta, SITE_URL} from '~/lib/seo/metadata';
import {ArticleItem} from '~/components/ArticleItem';
import {authorSlug} from '~/lib/authorSlug';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  const blog = data?.blog;
  if (!blog) return buildMeta({title: 'Blog not found', robots: 'noindex,nofollow'});

  const tags = buildMeta({
    title: blog.seo?.title || `${blog.title} Blog`,
    description: blog.seo?.description || `Articles from the ${blog.title} blog.`,
    url: `${SITE_URL}/blogs/${blog.handle}`,
  });
  tags.push({
    tagName: 'link',
    rel: 'alternate',
    type: 'application/rss+xml',
    title: `${blog.title} RSS feed`,
    href: `${SITE_URL}/blogs/${blog.handle}/rss.xml`,
  });
  return tags;
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
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });

  if (!params.blogHandle) {
    throw new Response(`blog not found`, {status: 404});
  }

  const [{blog}, {blog: authorsBlog}] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: {
        blogHandle: params.blogHandle,
        ...paginationVariables,
      },
    }),
    // Lightweight, separate from the paginated fragment above - needs every
    // article's author, not just the current page's 4.
    context.storefront.query(BLOG_AUTHORS_QUERY, {
      variables: {blogHandle: params.blogHandle},
    }),
  ]);

  if (!blog?.articles) {
    throw new Response('Not found', {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle: params.blogHandle, data: blog});

  // Dedupe by normalized slug (see lib/authorSlug.js) - this store's real
  // bylines have inconsistent casing for the same person.
  const seen = new Map();
  for (const article of authorsBlog?.articles?.nodes || []) {
    const name = article.author?.name;
    if (!name) continue;
    const slug = authorSlug(name);
    if (!seen.has(slug)) seen.set(slug, name);
  }
  const authors = [...seen.entries()].map(([slug, name]) => ({slug, name}));

  return {blog, authors};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {Route.LoaderArgs}
 */
function loadDeferredData({context}) {
  return {};
}

export default function Blog() {
  /** @type {LoaderReturnData} */
  const {blog, authors} = useLoaderData();
  const {articles} = blog;

  return (
    <div className="blog">
      <h1>{blog.title}</h1>
      {authors.length > 0 && (
        <nav className="blog-authors" aria-label="Authors">
          <span>Written by:</span>
          {authors.map((author) => (
            <Link key={author.slug} to={`/blogs/${blog.handle}/authors/${author.slug}`}>
              {author.name}
            </Link>
          ))}
        </nav>
      )}
      <div className="blog-grid">
        <PaginatedResourceSection connection={articles}>
          {({node: article, index}) => (
            <ArticleItem
              article={article}
              key={article.id}
              loading={index < 2 ? 'eager' : 'lazy'}
            />
          )}
        </PaginatedResourceSection>
      </div>
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog
const BLOGS_QUERY = `#graphql
  query Blog(
    $language: LanguageCode
    $blogHandle: String!
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      title
      handle
      seo {
        title
        description
      }
      articles(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ArticleItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          hasNextPage
          endCursor
          startCursor
        }

      }
    }
  }
  fragment ArticleItem on Article {
    author: authorV2 {
      name
    }
    contentHtml
    handle
    id
    image {
      id
      altText
      url
      width
      height
    }
    publishedAt
    title
    blog {
      handle
    }
  }
`;

// Separate lightweight query for the "Written by" links - needs every
// article's author, not just the current pagination page's 4.
const BLOG_AUTHORS_QUERY = `#graphql
  query BlogAuthorsList($blogHandle: String!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    blog(handle: $blogHandle) {
      articles(first: 50) {
        nodes {
          author: authorV2 {
            name
          }
        }
      }
    }
  }
`;

/** @typedef {import('./+types/blogs.$blogHandle._index').Route} Route */
/** @typedef {import('storefrontapi.generated').ArticleItemFragment} ArticleItemFragment */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
