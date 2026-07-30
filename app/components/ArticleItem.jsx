import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';

/**
 * Shared article card - used by the blog listing page, the author archive
 * page, and the related-posts section on the article page itself. Extracted
 * from a local component previously duplicated only in the blog listing.
 *
 * @param {{
 *   article: {
 *     id: string; handle: string; title: string; publishedAt: string;
 *     image?: {altText?: string; url: string} | null;
 *     blog: {handle: string};
 *   };
 *   loading?: HTMLImageElement['loading'];
 * }}
 */
export function ArticleItem({article, loading}) {
  const publishedAt = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt));
  return (
    <div className="blog-article" key={article.id}>
      <Link to={`/blogs/${article.blog.handle}/${article.handle}`}>
        {article.image && (
          <div className="blog-article-image">
            <Image
              alt={article.image.altText || article.title}
              aspectRatio="3/2"
              data={article.image}
              loading={loading}
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>
        )}
        <h3>{article.title}</h3>
        <small>{publishedAt}</small>
      </Link>
    </div>
  );
}
