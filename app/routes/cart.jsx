import {useLoaderData, data} from 'react-router';
import {CartForm} from '@shopify/hydrogen';
import {CartMain} from '~/components/CartMain';
import {buildMeta} from '~/lib/seo/metadata';
import {isSafeRedirectPath} from '~/lib/redirect';
import {getQuantityLimits} from '~/lib/quantityLimits';
import {validateQuantityAgainstRule} from '~/lib/cartLimits';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => buildMeta({title: 'Cart', robots: 'noindex,nofollow'});

/**
 * @type {HeadersFunction}
 */
export const headers = ({actionHeaders}) => actionHeaders;

/**
 * Product-level min/max/multiple purchase limits (see
 * app/lib/quantityLimits.js) aren't enforced by Shopify itself - they only
 * exist as this storefront's own rule data, so they have to be checked
 * here before a line mutation is allowed through, not just reflected in
 * the quantity selector's UI. `quantity` passed to the validator is always
 * the *resulting* total for that line (existing + requested for an add,
 * since cartLinesAdd merges into an existing line rather than creating a
 * second one; the requested value directly for an update, since that sets
 * the absolute quantity).
 *
 * A cart line (CartLine) has no top-level merchandiseId/handle - only a
 * nested `merchandise { ... on ProductVariant { id product { handle } } }` -
 * and this codebase's LinesUpdate submissions (see CartLineItem) send only
 * `{id, quantity}`, no merchandiseId at all. So the handle for an update is
 * resolved from the *existing* cart line by its line id; the handle for an
 * add is resolved the same way when that merchandiseId is already in the
 * cart (a quantity bump), falling back to a direct variant lookup only for
 * a genuinely new line.
 * @param {{
 *   context: Route.ActionArgs['context'];
 *   cartAction: string;
 *   lines: Array<{id?: string; merchandiseId?: string; quantity: number}>;
 * }}
 * @returns {Promise<{message: string}[]>}
 */
async function findQuantityLimitErrors({context, cartAction, lines}) {
  if (
    (cartAction !== CartForm.ACTIONS.LinesAdd &&
      cartAction !== CartForm.ACTIONS.LinesUpdate) ||
    !lines?.length
  ) {
    return [];
  }

  const limits = await getQuantityLimits(context.storefront);
  if (!Object.keys(limits).length) return [];

  const existingCart = await context.cart.get();
  const existingLines = existingCart?.lines?.nodes ?? [];

  const handleByLineId = new Map(
    existingLines.map((line) => [line.id, line.merchandise?.product?.handle]),
  );
  const handleByMerchandiseId = new Map(
    existingLines.map((line) => [
      line.merchandise?.id,
      line.merchandise?.product?.handle,
    ]),
  );
  const qtyByMerchandiseId = new Map(
    existingLines.map((line) => [line.merchandise?.id, line.quantity]),
  );

  // Only genuinely new lines (add-to-cart for a product not already in the
  // cart) need an extra lookup - everything else is resolvable from the
  // cart we already fetched above.
  const unresolvedMerchandiseIds = lines
    .filter(
      (line) =>
        cartAction === CartForm.ACTIONS.LinesAdd &&
        line.merchandiseId &&
        !handleByMerchandiseId.has(line.merchandiseId),
    )
    .map((line) => line.merchandiseId);

  if (unresolvedMerchandiseIds.length) {
    const {nodes} = await context.storefront.query(
      VARIANT_PRODUCT_HANDLES_QUERY,
      {variables: {ids: unresolvedMerchandiseIds}},
    );
    for (const node of nodes) {
      if (node?.product?.handle) handleByMerchandiseId.set(node.id, node.product.handle);
    }
  }

  const errors = [];
  for (const line of lines) {
    const handle =
      cartAction === CartForm.ACTIONS.LinesUpdate
        ? handleByLineId.get(line.id)
        : handleByMerchandiseId.get(line.merchandiseId);
    const rule = handle && limits[handle];
    if (!rule) continue;

    const resultingQuantity =
      cartAction === CartForm.ACTIONS.LinesAdd
        ? (qtyByMerchandiseId.get(line.merchandiseId) ?? 0) + line.quantity
        : line.quantity;

    const check = validateQuantityAgainstRule(resultingQuantity, rule);
    if (!check.valid) errors.push({message: check.message});
  }
  return errors;
}

const VARIANT_PRODUCT_HANDLES_QUERY = `#graphql
  query VariantProductHandles($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        product { handle }
      }
    }
  }
`;

/**
 * @param {Route.ActionArgs}
 */
export async function action({request, context}) {
  const {cart} = context;

  const formData = await request.formData();

  const {action, inputs} = CartForm.getFormInput(formData);

  if (!action) {
    throw new Error('No action provided');
  }

  let status = 200;
  let result;

  const quantityLimitErrors = await findQuantityLimitErrors({
    context,
    cartAction: action,
    lines: inputs.lines,
  });
  if (quantityLimitErrors.length) {
    const currentCart = await cart.get();
    return data(
      {
        cart: currentCart,
        errors: quantityLimitErrors,
        warnings: [],
        analytics: {cartId: currentCart?.id},
      },
      {status: 200},
    );
  }

  switch (action) {
    case CartForm.ACTIONS.LinesAdd:
      result = await cart.addLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate: {
      const formDiscountCode = inputs.discountCode;

      // User inputted discount code
      const discountCodes = formDiscountCode ? [formDiscountCode] : [];

      // Combine discount codes already applied on cart
      discountCodes.push(...inputs.discountCodes);

      result = await cart.updateDiscountCodes(discountCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesAdd: {
      const formGiftCardCode = inputs.giftCardCode;

      const giftCardCodes = formGiftCardCode ? [formGiftCardCode] : [];

      result = await cart.addGiftCardCodes(giftCardCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesRemove: {
      const appliedGiftCardIds = inputs.giftCardCodes;
      result = await cart.removeGiftCardCodes(appliedGiftCardIds);
      break;
    }
    case CartForm.ACTIONS.BuyerIdentityUpdate: {
      result = await cart.updateBuyerIdentity({
        ...inputs.buyerIdentity,
      });
      break;
    }
    default:
      throw new Error(`${action} cart action is not defined`);
  }

  const cartId = result?.cart?.id;
  const headers = cartId ? cart.setCartId(result.cart.id) : new Headers();
  const {cart: cartResult, errors, warnings} = result;

  const redirectTo = formData.get('redirectTo') ?? null;
  // `redirectTo` is a hidden form field the client sets to "stay on the
  // current page" after a cart mutation - a POST from anywhere else
  // (e.g. a form on an attacker's own page targeting this endpoint) could
  // set it to an external URL, phishing via a trusted lite.digilog.pk
  // redirect. Only same-origin relative paths are honored.
  if (isSafeRedirectPath(redirectTo)) {
    status = 303;
    headers.set('Location', redirectTo);
  }

  return data(
    {
      cart: cartResult,
      errors,
      warnings,
      analytics: {
        cartId,
      },
    },
    {status, headers},
  );
}

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  const {cart} = context;
  return await cart.get();
}

export default function Cart() {
  /** @type {LoaderReturnData} */
  const cart = useLoaderData();

  return (
    <div className="cart-page">
      <h1>
        Your Cart
        {cart?.totalQuantity ? (
          <span className="cart-page-count"> ({cart.totalQuantity})</span>
        ) : null}
      </h1>
      <CartMain layout="page" cart={cart} />
    </div>
  );
}

/** @typedef {import('react-router').HeadersFunction} HeadersFunction */
/** @typedef {import('./+types/cart').Route} Route */
/** @typedef {import('@shopify/hydrogen').CartQueryDataReturn} CartQueryDataReturn */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
/** @typedef {ReturnType<typeof useActionData<typeof action>>} ActionReturnData */
