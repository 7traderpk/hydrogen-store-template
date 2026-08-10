/**
 * Validates a resulting cart-line quantity against a product's min/max/
 * multiple rule (a per-product metafield, lite_storefront.quantity_limit -
 * see app/routes/products.$handle.jsx and app/routes/cart.jsx for where
 * it's fetched). Pure - no I/O - so it's
 * usable both server-side (app/routes/cart.jsx, the enforcement that
 * actually matters) and client-side (product page quantity selector, for
 * immediate feedback before a request even goes out).
 *
 * `quantity` must be the *resulting* total for that line, not a delta -
 * for an add-to-cart on a product already in the cart, that's existing +
 * requested, since Shopify's cartLinesAdd merges into the existing line
 * rather than creating a second one.
 *
 * @param {number} quantity
 * @param {{min?: number; max?: number; multiple?: number} | undefined | null} rule
 * @returns {{valid: true} | {valid: false; message: string}}
 */
export function validateQuantityAgainstRule(quantity, rule) {
  if (!rule) return {valid: true};

  if (rule.min != null && quantity < rule.min) {
    return {valid: false, message: `Minimum order quantity is ${rule.min}.`};
  }
  if (rule.max != null && quantity > rule.max) {
    return {valid: false, message: `Maximum order quantity is ${rule.max}.`};
  }
  if (rule.multiple != null && quantity % rule.multiple !== 0) {
    return {
      valid: false,
      message: `Must be ordered in multiples of ${rule.multiple}.`,
    };
  }
  return {valid: true};
}
