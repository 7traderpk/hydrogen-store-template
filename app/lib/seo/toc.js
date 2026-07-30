import {stripHtml} from './text';

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Walks raw Shopify rich-text HTML (article.contentHtml - merchant-authored,
 * no ids) for <h2> tags, injects a slugified id on each (skipping ones that
 * already have one), and returns the transformed HTML plus a flat list for
 * rendering a table-of-contents nav. Used by
 * blogs.$blogHandle.$articleHandle.jsx - TOC is only rendered when 2+
 * headings are found, so short posts don't get a useless single-link nav.
 *
 * @param {string} html
 * @returns {{html: string; headings: Array<{id: string; text: string}>}}
 */
export function injectHeadingIds(html) {
  if (!html) return {html: html || '', headings: []};

  const headings = [];
  const seenSlugs = new Map();

  const transformed = html.replace(
    /<h2([^>]*)>([\s\S]*?)<\/h2>/gi,
    (match, attrs, inner) => {
      const text = stripHtml(inner);
      if (!text) return match;

      if (/\bid=/.test(attrs)) {
        const existingId = attrs.match(/\bid=["']([^"']+)["']/)?.[1];
        if (existingId) headings.push({id: existingId, text});
        return match;
      }

      let slug = slugify(text) || 'section';
      const count = seenSlugs.get(slug) || 0;
      seenSlugs.set(slug, count + 1);
      if (count > 0) slug = `${slug}-${count + 1}`;

      headings.push({id: slug, text});
      return `<h2${attrs} id="${slug}">${inner}</h2>`;
    },
  );

  return {html: transformed, headings};
}
