// Shared metadata builder used by every route's meta() export. Returns a
// React Router meta descriptor array (title/meta/link tags) - not
// `.server.js` since meta() and route components both run on the client
// during navigations, not just the initial SSR pass.

import {truncate} from './text';

// meta() (React Router 7) receives {data, params, location, matches} - no
// protocol/host. Canonical/OG/JSON-LD URLs need to be absolute (Google
// recommends it for canonicals, and AI engines that lift/republish content
// lose all path context if given a relative URL), so the origin is a fixed
// constant rather than derived per-request - this app is single-domain.
export const SITE_URL = 'https://lite.digilog.pk';
export const SITE_NAME = 'Digilog';
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;

/**
 * @param {{
 *   title: string;
 *   description?: string;
 *   url?: string;
 *   image?: string;
 *   type?: 'website' | 'product' | 'article';
 *   robots?: string;
 *   siteName?: string;
 *   titleSuffix?: boolean;
 * }}
 */
export function buildMeta({
  title,
  description,
  url,
  image,
  type = 'website',
  robots = 'index,follow',
  siteName = SITE_NAME,
  titleSuffix = true,
}) {
  // Merchant-authored seo.title values in this store never already include
  // the brand name (checked real data before adding this) - the suffix is
  // budgeted out of TITLE_MAX first so the whole thing still fits ~60 chars.
  // Callers whose title already reads as a complete brand-inclusive string
  // (the homepage) pass titleSuffix: false to skip it.
  const suffix = titleSuffix ? ` | ${siteName}` : '';
  const metaTitle = titleSuffix
    ? `${truncate(title, TITLE_MAX - suffix.length)}${suffix}`
    : truncate(title, TITLE_MAX);
  const metaDescription = description ? truncate(description, DESCRIPTION_MAX) : undefined;

  const tags = [{title: metaTitle}];

  if (metaDescription) {
    tags.push({name: 'description', content: metaDescription});
  }
  if (url) {
    tags.push({tagName: 'link', rel: 'canonical', href: url});
  }
  tags.push({name: 'robots', content: robots});

  // Open Graph
  tags.push({property: 'og:title', content: metaTitle});
  if (metaDescription) tags.push({property: 'og:description', content: metaDescription});
  tags.push({property: 'og:type', content: type});
  tags.push({property: 'og:site_name', content: siteName});
  if (url) tags.push({property: 'og:url', content: url});
  if (image) tags.push({property: 'og:image', content: image});

  // Twitter
  tags.push({name: 'twitter:card', content: image ? 'summary_large_image' : 'summary'});
  tags.push({name: 'twitter:title', content: metaTitle});
  if (metaDescription) tags.push({name: 'twitter:description', content: metaDescription});
  if (image) tags.push({name: 'twitter:image', content: image});

  return tags;
}
