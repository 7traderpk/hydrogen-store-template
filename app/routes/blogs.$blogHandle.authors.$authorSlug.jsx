import {useLoaderData} from 'react-router';
import {ArticleItem} from '~/components/ArticleItem';
import {authorSlug} from '~/lib/authorSlug';
import {buildMeta, SITE_URL} from '~/lib/seo/metadata';
import {JsonLd} from '~/components/seo/JsonLd';
import {breadcrumbList} from '~/lib/seo/schema/breadcrumbList';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  if (!data) return buildMeta({title: 'Author not found', robots: 'noindex,nofollow'});
  const {authorName, blogTitle, blogHandle, params} = data;
  return buildMeta({
    title: `Articles by ${authorName}`,
    description: `Browse all articles by ${authorName} on the ${blogTitle} blog.`,
    url: `${SITE_URL}/blogs/${blogHandle}/authors/${params.authorSlug}`,
  });
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({params, context}) {
  const {blogHandle, authorSlug: slug} = params;
  if (!blogHandle || !slug) throw new Response('Not found', {status: 404});

  const {blog} = await context.storefront.query(AUTHOR_ARCHIVE_QUERY, {
    variables: {blogHandle, first: 50},
  });

  if (!blog) throw new Response('Not found', {status: 404});

  // Match by normalized slug, not raw name - this store's real bylines have
  // inconsistent casing for the same person (see lib/authorSlug.js).
  const articles = (blog.articles?.nodes || []).filter(
    (article) => authorSlug(article.author?.name) === slug,
  );

  if (!articles.length) throw new Response('Not found', {status: 404});

  return {
    blogHandle,
    blogTitle: blog.title,
    authorName: articles[0].author.name,
    articles,
    params: {authorSlug: slug},
  };
}

export default function AuthorArchive() {
  /** @type {LoaderReturnData} */
  const {blogHandle, blogTitle, authorName, articles} = useLoaderData();

  const jsonLd = breadcrumbList([
    {name: 'Home', url: SITE_URL},
    {name: blogTitle, url: `${SITE_URL}/blogs/${blogHandle}`},
    {name: `Articles by ${authorName}`, url: `${SITE_URL}/blogs/${blogHandle}/authors`},
  ]);

  return (
    <div className="blog">
      <JsonLd data={jsonLd} />
      <h1>Articles by {authorName}</h1>
      <div className="blog-grid">
        {articles.map((article, i) => (
          <ArticleItem article={article} key={article.id} loading={i < 2 ? 'eager' : 'lazy'} />
        ))}
      </div>
    </div>
  );
}

const AUTHOR_ARCHIVE_QUERY = `#graphql
  query BlogAuthorArchive($blogHandle: String!, $first: Int!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    blog(handle: $blogHandle) {
      title
      articles(first: $first, sortKey: UPDATED_AT, reverse: true) {
        nodes {
          id
          handle
          title
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
          blog {
            handle
          }
        }
      }
    }
  }
`;

/** @typedef {import('./+types/blogs.$blogHandle.authors.$authorSlug').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
