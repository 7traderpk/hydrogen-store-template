import {useState} from 'react';
import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {urlWithTrackingParams} from '~/lib/search';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * @param {{
 *   product: {
 *     id: string;
 *     handle: string;
 *     title: string;
 *     publishedAt: string;
 *     trackingParameters?: string | null;
 *     options?: Array<{name: string}>;
 *     images?: {nodes: Array<{id: string; url: string; altText: string | null; width: number; height: number}>};
 *     selectedOrFirstAvailableVariant?: {
 *       id: string;
 *       availableForSale: boolean;
 *       image?: {id: string; url: string; altText: string | null; width: number; height: number} | null;
 *       price: {amount: string; currencyCode: string};
 *       compareAtPrice?: {amount: string; currencyCode: string} | null;
 *     };
 *   };
 *   term: string;
 * }}
 */
export function SearchProductCard({product, term}) {
  const [hovering, setHovering] = useState(false);
  const {open} = useAside();

  const variant = product.selectedOrFirstAvailableVariant;
  const images = product.images?.nodes || [];
  const primaryImage = variant?.image || images[0];
  const hoverImage = images.find((img) => img.id !== primaryImage?.id);

  const isSoldOut = variant ? !variant.availableForSale : false;
  const isSale =
    variant?.compareAtPrice &&
    Number(variant.compareAtPrice.amount) > Number(variant.price?.amount || 0);
  const salePercent = isSale
    ? Math.round(
        (1 - Number(variant.price.amount) / Number(variant.compareAtPrice.amount)) * 100,
      )
    : null;
  const isNew =
    product.publishedAt &&
    Date.now() - new Date(product.publishedAt).getTime() < THIRTY_DAYS_MS;

  // A product needs explicit variant selection (size, etc.) before it can
  // be added to cart blind - Shopify auto-creates a single "Title" option
  // for products with no real option choices, so anything else means the
  // shopper needs the PDP to pick a variant.
  const requiresSelection = (product.options || []).some(
    (option) => option.name !== 'Title',
  );

  const productUrl = urlWithTrackingParams({
    baseUrl: `/products/${product.handle}`,
    trackingParams: product.trackingParameters,
    term,
  });

  return (
    <div
      className="search-product-card"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <Link className="search-product-card-link" prefetch="intent" to={productUrl}>
        <div className="search-product-card-image">
          <div className="search-product-badges">
            {isSoldOut ? (
              <span className="pcard-badge pcard-badge-sold-out">Sold out</span>
            ) : isSale ? (
              <span className="pcard-badge pcard-badge-sale">-{salePercent}%</span>
            ) : null}
            {isNew && !isSoldOut && (
              <span className="pcard-badge pcard-badge-new">New</span>
            )}
          </div>
          {primaryImage ? (
            <>
              <Image
                alt={primaryImage.altText || product.title}
                aspectRatio="1/1"
                data={primaryImage}
                sizes="(min-width: 45em) 260px, 45vw"
                className={`pcard-image-primary${
                  hovering && hoverImage ? ' pcard-image-hidden' : ''
                }`}
              />
              {hoverImage && (
                <Image
                  alt={hoverImage.altText || product.title}
                  aspectRatio="1/1"
                  data={hoverImage}
                  sizes="(min-width: 45em) 260px, 45vw"
                  className={`pcard-image-hover${hovering ? ' pcard-image-visible' : ''}`}
                />
              )}
            </>
          ) : (
            <div className="search-product-card-image-placeholder" />
          )}
        </div>
        <h3 className="search-product-card-title">{product.title}</h3>
        <div className="search-product-card-price">
          {variant?.price && <Money data={variant.price} />}
          {isSale && (
            <s className="search-product-card-compare-price">
              <Money data={variant.compareAtPrice} />
            </s>
          )}
        </div>
      </Link>
      {!isSoldOut && !requiresSelection && variant && (
        <AddToCartButton
          className="quick-add-btn"
          lines={[{merchandiseId: variant.id, quantity: 1, selectedVariant: variant}]}
          onClick={() => open('cart')}
        >
          Quick add
        </AddToCartButton>
      )}
    </div>
  );
}
