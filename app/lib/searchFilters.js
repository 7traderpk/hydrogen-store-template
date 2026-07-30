// URL-state helpers for the faceted search page.
//
// Each selected filter is stored as one `filter` query param whose value is
// the exact JSON the Storefront API's `ProductFilter` input expects - the
// same JSON Shopify already hands back as `FilterValue.input` on every
// facet. That means no separate encode/decode table is needed: selecting a
// facet just copies its `input` string straight into the URL, and building
// the GraphQL `productFilters` argument is just `JSON.parse` on each one.

const FILTER_PARAM = 'filter';
const SORT_PARAM = 'sort';
const VIEW_PARAM = 'view';

export const SORT_OPTIONS = [
  {value: 'relevance', label: 'Relevance', sortKey: 'RELEVANCE', reverse: false},
  {value: 'price-asc', label: 'Price: Low to High', sortKey: 'PRICE', reverse: false},
  {value: 'price-desc', label: 'Price: High to Low', sortKey: 'PRICE', reverse: true},
  // Shopify's `search` query only exposes RELEVANCE and PRICE as sort keys -
  // Newest / Best Selling / Alphabetical aren't available for search results
  // (only for plain collection/product listings), so they're intentionally
  // left out rather than faking them with an inaccurate client-side sort.
];

export function getSortFromParams(searchParams) {
  const value = searchParams.get(SORT_PARAM) || 'relevance';
  return SORT_OPTIONS.find((option) => option.value === value) || SORT_OPTIONS[0];
}

export function getViewFromParams(searchParams) {
  const value = parseInt(searchParams.get(VIEW_PARAM), 10);
  return [2, 3, 4].includes(value) ? value : 4;
}

/**
 * @param {URLSearchParams} searchParams
 * @returns {object[]} parsed ProductFilter input objects
 */
export function getProductFiltersFromParams(searchParams) {
  return searchParams
    .getAll(FILTER_PARAM)
    .map((raw) => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function isFilterActive(searchParams, inputJson) {
  return searchParams.getAll(FILTER_PARAM).includes(inputJson);
}

function resetPagination(params) {
  params.delete('cursor');
  params.delete('direction');
}

/**
 * Toggle a single LIST-type filter value on/off (multi-select within a
 * group, AND across groups - standard faceted search behavior).
 */
export function toggleFilterParam(searchParams, inputJson) {
  const next = new URLSearchParams(searchParams);
  const current = next.getAll(FILTER_PARAM);
  next.delete(FILTER_PARAM);
  const isActive = current.includes(inputJson);
  const updated = isActive
    ? current.filter((value) => value !== inputJson)
    : [...current, inputJson];
  updated.forEach((value) => next.append(FILTER_PARAM, value));
  resetPagination(next);
  return next;
}

/**
 * Price is a range, not a multi-select - setting a new range always
 * replaces any previously-set price filter rather than appending.
 */
export function setPriceFilterParam(searchParams, {min, max}) {
  const next = new URLSearchParams(searchParams);
  const current = next.getAll(FILTER_PARAM);
  next.delete(FILTER_PARAM);
  const withoutPrice = current.filter((value) => {
    try {
      return !('price' in JSON.parse(value));
    } catch {
      return true;
    }
  });
  withoutPrice.push(JSON.stringify({price: {min, max}}));
  withoutPrice.forEach((value) => next.append(FILTER_PARAM, value));
  resetPagination(next);
  return next;
}

export function clearAllFiltersParam(searchParams) {
  const next = new URLSearchParams(searchParams);
  next.delete(FILTER_PARAM);
  resetPagination(next);
  return next;
}

export function setSortParam(searchParams, sortValue) {
  const next = new URLSearchParams(searchParams);
  if (sortValue === 'relevance') {
    next.delete(SORT_PARAM);
  } else {
    next.set(SORT_PARAM, sortValue);
  }
  resetPagination(next);
  return next;
}

export function setViewParam(searchParams, view) {
  const next = new URLSearchParams(searchParams);
  if (view === 4) {
    next.delete(VIEW_PARAM);
  } else {
    next.set(VIEW_PARAM, String(view));
  }
  return next;
}
