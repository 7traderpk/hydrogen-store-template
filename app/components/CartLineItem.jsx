import {CartForm, Image} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link, useFetcher} from 'react-router';
import {useEffect, useState} from 'react';
import {ProductPrice} from './ProductPrice';
import {useAside} from './Aside';

/**
 * A single line item in the cart. It displays the product image, title, price.
 * It also provides controls to update the quantity or remove the line item.
 * If the line is a parent line that has child components (like warranties or gift wrapping), they are
 * rendered nested below the parent line.
 * @param {{
 *   layout: CartLayout;
 *   line: CartLine;
 *   childrenMap: LineItemChildrenMap;
 * }}
 */
export function CartLineItem({layout, line, childrenMap}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();
  const lineItemChildren = childrenMap[id];
  const childrenLabelId = `cart-line-children-${id}`;

  return (
    <li key={id} className="cart-line">
      <div className="cart-line-inner">
        <div className="cart-line-image">
          {image ? (
            <Image
              alt={title}
              aspectRatio="1/1"
              data={image}
              height={110}
              loading="lazy"
              width={110}
            />
          ) : (
            <div className="cart-line-image-placeholder" />
          )}
        </div>

        <div className="cart-line-details">
          <Link
            className="cart-line-title"
            prefetch="intent"
            to={lineItemUrl}
            onClick={() => {
              if (layout === 'aside') {
                close();
              }
            }}
          >
            {product.title}
          </Link>
          {selectedOptions.length > 0 && (
            <ul className="cart-line-options">
              {selectedOptions.map((option) => (
                <li key={option.name}>
                  {option.name}: {option.value}
                </li>
              ))}
            </ul>
          )}
          <div className="cart-line-price">
            <ProductPrice price={line?.cost?.totalAmount} />
          </div>
          <CartLineQuantity line={line} />
        </div>
      </div>

      {lineItemChildren ? (
        <div>
          <p id={childrenLabelId} className="sr-only">
            Line items with {product.title}
          </p>
          <ul aria-labelledby={childrenLabelId} className="cart-line-children">
            {lineItemChildren.map((childLine) => (
              <CartLineItem
                childrenMap={childrenMap}
                key={childLine.id}
                line={childLine}
                layout={layout}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

/**
 * Provides the controls to update the quantity of a line item in the cart.
 * These controls are disabled when the line item is new, and the server
 * hasn't yet responded that it was successfully added to the cart.
 * @param {{line: CartLine}}
 */
function CartLineQuantity({line}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity, isOptimistic} = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    <div className="cart-line-quantity">
      <div className="quantity-selector">
        <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
          <button
            type="submit"
            className="quantity-selector-btn"
            aria-label="Decrease quantity"
            disabled={quantity <= 1 || !!isOptimistic}
            name="decrease-quantity"
            value={prevQuantity}
          >
            &#8722;
          </button>
        </CartLineUpdateButton>
        <CartLineQuantityInput
          lineId={lineId}
          quantity={quantity}
          disabled={!!isOptimistic}
        />
        <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
          <button
            type="submit"
            className="quantity-selector-btn"
            aria-label="Increase quantity"
            name="increase-quantity"
            value={nextQuantity}
            disabled={!!isOptimistic}
          >
            &#43;
          </button>
        </CartLineUpdateButton>
      </div>
      <CartLineQuantityError lineId={lineId} />
      <CartLineRemoveButton lineIds={[lineId]} disabled={!!isOptimistic} />
    </div>
  );
}

/**
 * Surfaces a quantity-limit rejection from the server for this specific
 * line - the +/- buttons and the typed quantity input all share one
 * fetcher (see getUpdateKey), so whichever control the shopper used, its
 * result shows up here.
 * @param {{lineId: string}}
 */
function CartLineQuantityError({lineId}) {
  const fetcher = useFetcher({key: getUpdateKey([lineId])});
  const errors = fetcher.data?.errors;
  if (!errors?.length) return null;

  return (
    <p className="cart-line-quantity-error" role="alert">
      {errors.map((error) => error.message).join(' ')}
    </p>
  );
}

/**
 * A number input for the line's quantity - typing a value and blurring (or
 * pressing Enter) submits it directly, instead of only allowing +/- one at a
 * time. Uses the same fetcher key as the +/- buttons so rapid edits from
 * either control cancel-and-replace each other rather than racing.
 * @param {{lineId: string; quantity: number; disabled: boolean}}
 */
function CartLineQuantityInput({lineId, quantity, disabled}) {
  const fetcher = useFetcher({key: getUpdateKey([lineId])});
  const [value, setValue] = useState(String(quantity));

  // Stay in sync with the server-confirmed quantity (e.g. after the +/-
  // buttons run, or once this input's own submission resolves).
  useEffect(() => {
    setValue(String(quantity));
  }, [quantity]);

  function commit() {
    const parsed = Math.round(Number(value));
    if (!Number.isFinite(parsed) || parsed < 1) {
      setValue(String(quantity));
      return;
    }
    if (parsed === quantity) return;

    fetcher.submit(
      {
        [CartForm.INPUT_NAME]: JSON.stringify({
          action: CartForm.ACTIONS.LinesUpdate,
          inputs: {lines: [{id: lineId, quantity: parsed}]},
        }),
      },
      {method: 'post', action: '/cart'},
    );
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      min="1"
      className="quantity-selector-value quantity-selector-input"
      aria-label="Quantity"
      value={value}
      disabled={disabled}
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit();
          event.currentTarget.blur();
        }
      }}
    />
  );
}

/**
 * A button that removes a line item from the cart. It is disabled
 * when the line item is new, and the server hasn't yet responded
 * that it was successfully added to the cart.
 * @param {{
 *   lineIds: string[];
 *   disabled: boolean;
 * }}
 */
function CartLineRemoveButton({lineIds, disabled}) {
  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      <button className="cart-line-remove-btn" disabled={disabled} type="submit">
        Remove
      </button>
    </CartForm>
  );
}

/**
 * @param {{
 *   children: React.ReactNode;
 *   lines: CartLineUpdateInput[];
 * }}
 */
function CartLineUpdateButton({children, lines}) {
  const lineIds = lines.map((line) => line.id);

  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

/**
 * Returns a unique key for the update action. This is used to make sure actions modifying the same line
 * items are not run concurrently, but cancel each other. For example, if the user clicks "Increase quantity"
 * and "Decrease quantity" in rapid succession, the actions will cancel each other and only the last one will run.
 * @returns
 * @param {string[]} lineIds - line ids affected by the update
 */
function getUpdateKey(lineIds) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}

/** @typedef {OptimisticCartLine<CartApiQueryFragment>} CartLine */

/** @typedef {import('@shopify/hydrogen/storefront-api-types').CartLineUpdateInput} CartLineUpdateInput */
/** @typedef {import('~/components/CartMain').CartLayout} CartLayout */
/** @typedef {import('~/components/CartMain').LineItemChildrenMap} LineItemChildrenMap */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLine} OptimisticCartLine */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
/** @typedef {import('storefrontapi.generated').CartLineFragment} CartLineFragment */
