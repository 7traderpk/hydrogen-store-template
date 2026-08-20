import {useState} from 'react';
import {Link, useNavigate} from 'react-router';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';

/**
 * @param {{
 *   productOptions: MappedProductOptions[];
 *   selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
 *   quantityRule?: {min?: number; max?: number; multiple?: number} | null;
 * }}
 */
export function ProductForm({productOptions, selectedVariant, quantityRule}) {
  const navigate = useNavigate();
  const {open} = useAside();
  const step = quantityRule?.multiple || 1;
  const minQuantity = quantityRule?.min || 1;
  const [quantity, setQuantity] = useState(minQuantity);
  return (
    <div className="product-form">
      {productOptions.map((option) => {
        // If there is only a single value in the option values, don't display the option
        if (option.optionValues.length === 1) return null;

        return (
          <div className="product-options" key={option.name}>
            <h5>{option.name}</h5>
            <div className="product-options-grid">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;

                if (isDifferentProduct) {
                  // SEO
                  // When the variant is a combined listing child product
                  // that leads to a different url, we need to render it
                  // as an anchor tag
                  return (
                    <Link
                      className="product-options-item"
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                      style={{
                        border: selected
                          ? '1px solid var(--color-primary)'
                          : '1px solid transparent',
                        opacity: available ? 1 : 0.3,
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </Link>
                  );
                } else {
                  // SEO
                  // When the variant is an update to the search param,
                  // render it as a button with javascript navigating to
                  // the variant so that SEO bots do not index these as
                  // duplicated links
                  return (
                    <button
                      type="button"
                      className={`product-options-item${exists && !selected ? ' link' : ''}`}
                      key={option.name + name}
                      style={{
                        border: selected
                          ? '1px solid var(--color-primary)'
                          : '1px solid transparent',
                        opacity: available ? 1 : 0.3,
                      }}
                      disabled={!exists}
                      onClick={() => {
                        if (!selected) {
                          void navigate(`?${variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                        }
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </button>
                  );
                }
              })}
            </div>
            <br />
          </div>
        );
      })}
      <div className="product-form-buy-row">
        <div className="quantity-selector" role="group" aria-label="Quantity">
          <button
            type="button"
            className="quantity-selector-btn"
            onClick={() =>
              setQuantity((q) => Math.max(minQuantity, q - step))
            }
            aria-label="Decrease quantity"
          >
            −
          </button>
          <input
            type="number"
            min={minQuantity}
            max={quantityRule?.max || undefined}
            step={step}
            className="quantity-selector-input"
            value={quantity}
            onChange={(e) => {
              const next = parseInt(e.target.value, 10);
              setQuantity(
                Number.isFinite(next) && next > 0 ? next : minQuantity,
              );
            }}
            aria-label="Quantity"
          />
          <button
            type="button"
            className="quantity-selector-btn"
            onClick={() =>
              setQuantity((q) =>
                quantityRule?.max ? Math.min(quantityRule.max, q + step) : q + step,
              )
            }
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        {quantityRule ? (
          <p className="product-quantity-rule-hint">
            {[
              quantityRule.min ? `Min ${quantityRule.min}` : null,
              quantityRule.max ? `Max ${quantityRule.max}` : null,
              quantityRule.multiple
                ? `multiples of ${quantityRule.multiple}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        ) : null}
        <AddToCartButton
          disabled={!selectedVariant || !selectedVariant.availableForSale}
          onClick={() => {
            open('cart');
          }}
          lines={
            selectedVariant
              ? [
                  {
                    merchandiseId: selectedVariant.id,
                    quantity,
                    selectedVariant,
                  },
                ]
              : []
          }
        >
          {selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
        </AddToCartButton>
        {selectedVariant?.availableForSale && (
          // /cart/<variant_id>:<quantity> (routes/cart.$lines.jsx) creates a
          // fresh cart with just this line and redirects straight to
          // checkout - a real Hydrogen skeleton route already in this repo,
          // not new backend logic.
          <a
            className="product-form-buy-now"
            href={`/cart/${selectedVariant.id.split('/').pop()}:${quantity}`}
          >
            Buy Now
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * @param {{
 *   swatch?: Maybe<ProductOptionValueSwatch> | undefined;
 *   name: string;
 * }}
 */
function ProductOptionSwatch({swatch, name}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) return name;

  return (
    <div
      aria-label={name}
      className="product-option-label-swatch"
      style={{
        backgroundColor: color || 'transparent',
      }}
    >
      {!!image && <img src={image} alt={name} />}
    </div>
  );
}

/** @typedef {import('@shopify/hydrogen').MappedProductOptions} MappedProductOptions */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').Maybe} Maybe */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').ProductOptionValueSwatch} ProductOptionValueSwatch */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
