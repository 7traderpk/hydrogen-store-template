/**
 * Safely parse a JSON-type Shopify metafield value. Used by product/article
 * routes for the `custom.faqs`/`custom.specs`/`custom.author_bio` metafields
 * (see docs/seo.md) - these are optional, admin-authored, and absent by
 * default, so callers must tolerate `null`.
 *
 * @param {{value?: string} | null | undefined} metafield
 * @returns {unknown | null}
 */
export function parseJsonMetafield(metafield) {
  if (!metafield?.value) return null;
  try {
    return JSON.parse(metafield.value);
  } catch {
    return null;
  }
}
