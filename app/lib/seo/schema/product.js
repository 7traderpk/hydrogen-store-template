/**
 * No aggregateRating/review - no reviews app installed, omitted rather than
 * fabricated. `gtin` comes from the variant's `barcode` field (a real
 * Storefront API field many merchants use for GTIN/UPC/EAN - not a
 * metafield), when set.
 *
 * @param {{
 *   title: string; description?: string; images?: string[]; vendor?: string;
 *   sku?: string; gtin?: string; url: string; price: string;
 *   priceCurrency: string; availableForSale: boolean;
 * }}
 */
export function product({
  title,
  description,
  images,
  vendor,
  sku,
  gtin,
  url,
  price,
  priceCurrency,
  availableForSale,
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    ...(description ? {description} : {}),
    ...(images?.length ? {image: images} : {}),
    ...(sku ? {sku} : {}),
    ...(gtin ? {gtin} : {}),
    ...(vendor ? {brand: {'@type': 'Brand', name: vendor}} : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency,
      price,
      availability: availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };
}
