import {stripHtml, wordCount} from '../text';

/**
 * No dateModified - the Storefront API's Article type has no updatedAt
 * field, so it's omitted rather than fabricated (falling back to
 * datePublished would be misleading, not just incomplete).
 *
 * @param {{
 *   title: string; description?: string; image?: string; url: string;
 *   origin: string; datePublished: string; authorName: string;
 *   contentHtml?: string; keywords?: string[];
 * }}
 */
export function blogPosting({
  title,
  description,
  image,
  url,
  origin,
  datePublished,
  authorName,
  contentHtml,
  keywords,
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    ...(description ? {description} : {}),
    ...(image ? {image} : {}),
    url,
    datePublished,
    author: {'@type': 'Person', name: authorName},
    // References the sitewide Organization schema (root.jsx) by @id rather
    // than repeating it - see lib/seo/schema/organization.js.
    publisher: {'@id': `${origin}/#organization`},
    ...(contentHtml
      ? {articleBody: stripHtml(contentHtml), wordCount: wordCount(contentHtml)}
      : {}),
    ...(keywords?.length ? {keywords: keywords.join(', ')} : {}),
    mainEntityOfPage: {'@type': 'WebPage', '@id': url},
  };
}
