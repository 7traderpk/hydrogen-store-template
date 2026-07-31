import {useLocation} from 'react-router';
import {useMemo} from 'react';

/**
 * @param {string} handle
 * @param {SelectedOption[]} [selectedOptions]
 */
export function useVariantUrl(handle, selectedOptions) {
  const {pathname} = useLocation();

  return useMemo(() => {
    return getVariantUrl({
      handle,
      pathname,
      searchParams: new URLSearchParams(),
      selectedOptions,
    });
  }, [handle, selectedOptions, pathname]);
}

/**
 * @param {{
 *   handle: string;
 *   pathname: string;
 *   searchParams: URLSearchParams;
 *   selectedOptions?: SelectedOption[];
 * }}
 */
export function getVariantUrl({
  handle,
  pathname,
  searchParams,
  selectedOptions,
}) {
  const match = /(\/[a-zA-Z]{2}-[a-zA-Z]{2}\/)/g.exec(pathname);
  const isLocalePathname = match && match.length > 0;

  const path = isLocalePathname
    ? `${match[0]}products/${handle}`
    : `/products/${handle}`;

  selectedOptions?.forEach((option) => {
    searchParams.set(option.name, option.value);
  });

  const searchString = searchParams.toString();

  return path + (searchString ? '?' + searchParams.toString() : '');
}

/**
 * True when a product has more than one variant (e.g. size/color options),
 * as opposed to a single default variant. Used to hide/block these products
 * storefront-wide - see docs/seo.md or brand.config.js for why.
 * @param {{variants?: {nodes?: Array<unknown>}}} product
 * @returns {boolean}
 */
export function hasMultipleVariants(product) {
  return (product?.variants?.nodes?.length ?? 0) > 1;
}

/** GraphQL fragment field selection to append to any Product fragment so
 * `hasMultipleVariants` has what it needs, without pulling full variant data. */
export const VARIANT_COUNT_FIELD = `#graphql
  variants(first: 2) {
    nodes {
      id
    }
  }
`;

/** @typedef {import('@shopify/hydrogen/storefront-api-types').SelectedOption} SelectedOption */
