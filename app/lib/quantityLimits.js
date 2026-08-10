// Per-product min/max/multiple purchase-quantity rules, backed by a Shop
// metafield (lite_storefront.quantity_limits, type json, Storefront-API-
// readable) - mirrors app/lib/designConfig.js's pattern so rules can be
// updated from Shopify Admin (Settings -> Custom data -> Shop ->
// Metafields) without a code deploy.
//
// Originally configured through the MinMaxify app, which turned out not to
// work at all on this storefront - it enforces limits by injecting a script
// into a Shopify Liquid theme, and this is a headless Hydrogen storefront
// that never loads Shopify's theme assets. The same rule data lives here
// instead, enforced directly in this codebase (see app/lib/cartLimits.js
// for the validation logic and app/routes/cart.jsx for where it's applied).
//
// Shape: {[productHandle]: {min?: number, max?: number, multiple?: number}}
// Any of the three fields may be absent - absent means "no rule" for that
// dimension.

export const QUANTITY_LIMITS_METAFIELD_QUERY = `#graphql
  query QuantityLimits {
    shop {
      metafield(namespace: "lite_storefront", key: "quantity_limits") {
        value
      }
    }
  }
`;

/**
 * @param {{query: (q: string, opts?: object) => Promise<any>; CacheLong?: () => any}} storefront
 * @returns {Promise<Record<string, {min?: number; max?: number; multiple?: number}>>}
 */
export async function getQuantityLimits(storefront) {
  try {
    const {shop} = await storefront.query(QUANTITY_LIMITS_METAFIELD_QUERY, {
      cache: storefront.CacheLong(),
    });
    const raw = shop?.metafield?.value;
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to load quantity limits, treating as none set:', error);
    return {};
  }
}
