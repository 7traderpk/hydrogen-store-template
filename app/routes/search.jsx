import {useState} from 'react';
import {useLoaderData, useNavigation, useSearchParams} from 'react-router';
import {getPaginationVariables, Analytics, Pagination} from '@shopify/hydrogen';
import {SearchForm} from '~/components/SearchForm';
import {SearchResults} from '~/components/SearchResults';
import {FilterSidebar} from '~/components/FilterSidebar';
import {SearchToolbar} from '~/components/SearchToolbar';
import {SearchProductCard} from '~/components/SearchProductCard';
import {getEmptyPredictiveSearchResult} from '~/lib/search';
import {
  getProductFiltersFromParams,
  getSortFromParams,
  getViewFromParams,
} from '~/lib/searchFilters';
import {buildMeta} from '~/lib/seo/metadata';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  const term = data?.term;
  // Search results are transient/parameterized, not content pages -
  // noindex avoids thin/duplicate-content pages competing with real
  // product/collection pages in search results.
  return buildMeta({
    title: term ? `Search results for "${term}"` : 'Search',
    description: term
      ? `Browse search results for "${term}" at Digilog.`
      : 'Search products at Digilog.',
    robots: 'noindex,nofollow',
  });
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({request, context}) {
  const url = new URL(request.url);
  const isPredictive = url.searchParams.has('predictive');
  const searchPromise = isPredictive
    ? predictiveSearch({request, context})
    : regularSearch({request, context});

  searchPromise.catch((error) => {
    console.error(error);
    return {term: '', result: null, error: error.message};
  });

  return await searchPromise;
}

/**
 * Renders the /search route
 */
export default function SearchPage() {
  /** @type {LoaderReturnData} */
  const {type, term, result, error} = useLoaderData();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const [filtersOpen, setFiltersOpen] = useState(false);

  if (type === 'predictive') return null;

  // Any navigation that keeps us on /search (a filter toggle, sort change,
  // page change) counts as "loading new results" - dim the current grid
  // instead of blanking it, so the layout doesn't jump.
  const isRefetching =
    navigation.state !== 'idle' &&
    navigation.location?.pathname === '/search';

  const productFilters = result?.items?.products?.productFilters || [];
  const totalProductCount = result?.items?.products?.totalCount ?? 0;
  const activeFilterCount = searchParams.getAll('filter').length;
  const sort = getSortFromParams(searchParams);
  const view = getViewFromParams(searchParams);
  const currencyCode =
    result?.items?.products?.nodes?.[0]?.selectedOrFirstAvailableVariant?.price
      ?.currencyCode;

  return (
    <div className="search-page">
      <div className="search-page-header">
        <nav className="search-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a> / Search results
          {term && (
            <>
              {' '}
              for &ldquo;<strong>{term}</strong>&rdquo;
            </>
          )}
        </nav>
        <SearchForm>
          {({inputRef}) => (
            <div className="google-search-box">
              <svg
                className="google-search-icon"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"
                />
              </svg>
              <input
                defaultValue={term}
                name="q"
                placeholder="Search products…"
                ref={inputRef}
                type="search"
                autoComplete="off"
              />
              <button type="submit" className="google-search-submit">
                Search
              </button>
            </div>
          )}
        </SearchForm>
      </div>

      {error && <p style={{color: 'red'}}>{error}</p>}

      {!term || !result?.total ? (
        <SearchResults.Empty term={term} />
      ) : (
        <SearchResults result={result} term={term}>
          {({articles, pages, products, term}) => (
            <div className="search-page-layout">
              <FilterSidebar
                filters={productFilters}
                searchParams={searchParams}
                currencyCode={currencyCode}
                isOpen={filtersOpen}
                onClose={() => setFiltersOpen(false)}
              />

              <div className="search-page-main">
                <SearchToolbar
                  searchParams={searchParams}
                  sort={sort}
                  view={view}
                  activeFilterCount={activeFilterCount}
                  onOpenFilters={() => setFiltersOpen(true)}
                />

                <div
                  className={`search-results-area${
                    isRefetching ? ' search-results-loading' : ''
                  }`}
                >
                  <ProductResultsGrid
                    products={products}
                    term={term}
                    view={view}
                    totalCount={totalProductCount}
                  />
                </div>

                <SearchResults.Pages pages={pages} term={term} />
                <SearchResults.Articles articles={articles} term={term} />
              </div>
            </div>
          )}
        </SearchResults>
      )}
      <Analytics.SearchView data={{searchTerm: term, searchResults: result}} />
    </div>
  );
}

function ProductResultsGrid({products, term, view, totalCount}) {
  if (!products?.nodes.length) {
    return (
      <p className="search-no-product-results">
        No products matched your filters.{' '}
        <span className="search-no-product-results-hint">
          Try removing a filter to see more results.
        </span>
      </p>
    );
  }

  return (
    <Pagination connection={products}>
      {({nodes, isLoading, NextLink, PreviousLink}) => (
        <div>
          <p className="search-results-count">
            Showing {nodes.length} of {totalCount} result
            {totalCount === 1 ? '' : 's'}
          </p>
          <div className="search-load-previous">
            <PreviousLink>
              {isLoading ? 'Loading…' : <span>↑ Load previous</span>}
            </PreviousLink>
          </div>
          <div
            className="search-products-grid"
            data-cols={view}
          >
            {nodes.map((product) => (
              <SearchProductCard key={product.id} product={product} term={term} />
            ))}
          </div>
          <div className="search-load-more">
            <NextLink className="btn">
              {isLoading ? 'Loading…' : 'Load more products'}
            </NextLink>
          </div>
        </div>
      )}
    </Pagination>
  );
}

/**
 * Regular search query and fragments
 * (adjust as needed)
 */
const SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment SearchProduct on Product {
    __typename
    handle
    id
    publishedAt
    title
    description
    trackingParameters
    vendor
    options {
      name
    }
    images(first: 2) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      availableForSale
      image {
        id
        url
        altText
        width
        height
      }
      price {
        amount
        currencyCode
      }
      compareAtPrice {
        amount
        currencyCode
      }
      selectedOptions {
        name
        value
      }
      product {
        handle
        title
      }
    }
  }
`;

const SEARCH_PAGE_FRAGMENT = `#graphql
  fragment SearchPage on Page {
     __typename
     handle
    id
    title
    trackingParameters
  }
`;

const SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment SearchArticle on Article {
    __typename
    handle
    id
    title
    trackingParameters
  }
`;

const PAGE_INFO_FRAGMENT = `#graphql
  fragment PageInfoFragment on PageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/search
export const SEARCH_QUERY = `#graphql
  query RegularSearch(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $term: String!
    $startCursor: String
    $productFilters: [ProductFilter!]
    $sortKey: SearchSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    articles: search(
      query: $term,
      types: [ARTICLE],
      first: 5,
    ) {
      nodes {
        ...on Article {
          ...SearchArticle
        }
      }
    }
    pages: search(
      query: $term,
      types: [PAGE],
      first: 5,
    ) {
      nodes {
        ...on Page {
          ...SearchPage
        }
      }
    }
    products: search(
      after: $endCursor,
      before: $startCursor,
      first: $first,
      last: $last,
      query: $term,
      sortKey: $sortKey,
      reverse: $reverse,
      types: [PRODUCT],
      unavailableProducts: HIDE,
      productFilters: $productFilters,
    ) {
      nodes {
        ...on Product {
          ...SearchProduct
        }
      }
      pageInfo {
        ...PageInfoFragment
      }
      totalCount
      productFilters {
        id
        label
        type
        values {
          id
          label
          count
          input
          swatch {
            color
            image {
              previewImage {
                url
              }
            }
          }
        }
      }
    }
  }
  ${SEARCH_PRODUCT_FRAGMENT}
  ${SEARCH_PAGE_FRAGMENT}
  ${SEARCH_ARTICLE_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
`;

/**
 * Regular search fetcher
 * @param {Pick<
 *   Route.LoaderArgs,
 *   'request' | 'context'
 * >}
 * @return {Promise<RegularSearchReturn>}
 */
async function regularSearch({request, context}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const variables = getPaginationVariables(request, {pageBy: 12});
  const term = String(url.searchParams.get('q') || '');
  const searchParams = url.searchParams;
  const productFilters = getProductFiltersFromParams(searchParams);
  const sort = getSortFromParams(searchParams);

  // Search articles, pages, and products for the `q` term
  const {errors, ...items} = await storefront.query(SEARCH_QUERY, {
    variables: {
      ...variables,
      term,
      productFilters: productFilters.length ? productFilters : undefined,
      sortKey: sort.sortKey,
      reverse: sort.reverse,
    },
  });

  if (!items) {
    throw new Error('No search data returned from Shopify API');
  }

  const total = Object.values(items).reduce(
    (acc, {nodes}) => acc + nodes.length,
    0,
  );

  const error = errors
    ? errors.map(({message}) => message).join(', ')
    : undefined;

  return {type: 'regular', term, error, result: {total, items}};
}

/**
 * Predictive search query and fragments
 * (adjust as needed)
 */
const PREDICTIVE_SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment PredictiveArticle on Article {
    __typename
    id
    title
    handle
    blog {
      handle
    }
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
`;

const PREDICTIVE_SEARCH_COLLECTION_FRAGMENT = `#graphql
  fragment PredictiveCollection on Collection {
    __typename
    id
    title
    handle
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
`;

const PREDICTIVE_SEARCH_PAGE_FRAGMENT = `#graphql
  fragment PredictivePage on Page {
    __typename
    id
    title
    handle
    trackingParameters
  }
`;

const PREDICTIVE_SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment PredictiveProduct on Product {
    __typename
    id
    title
    handle
    trackingParameters
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      image {
        url
        altText
        width
        height
      }
      price {
        amount
        currencyCode
      }
    }
  }
`;

const PREDICTIVE_SEARCH_QUERY_FRAGMENT = `#graphql
  fragment PredictiveQuery on SearchQuerySuggestion {
    __typename
    text
    styledText
    trackingParameters
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/predictiveSearch
const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch(
    $country: CountryCode
    $language: LanguageCode
    $limit: Int!
    $limitScope: PredictiveSearchLimitScope!
    $term: String!
    $types: [PredictiveSearchType!]
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      limit: $limit,
      limitScope: $limitScope,
      query: $term,
      types: $types,
    ) {
      articles {
        ...PredictiveArticle
      }
      collections {
        ...PredictiveCollection
      }
      pages {
        ...PredictivePage
      }
      products {
        ...PredictiveProduct
      }
      queries {
        ...PredictiveQuery
      }
    }
  }
  ${PREDICTIVE_SEARCH_ARTICLE_FRAGMENT}
  ${PREDICTIVE_SEARCH_COLLECTION_FRAGMENT}
  ${PREDICTIVE_SEARCH_PAGE_FRAGMENT}
  ${PREDICTIVE_SEARCH_PRODUCT_FRAGMENT}
  ${PREDICTIVE_SEARCH_QUERY_FRAGMENT}
`;

/**
 * Predictive search fetcher
 * @param {Pick<
 *   Route.ActionArgs,
 *   'request' | 'context'
 * >}
 * @return {Promise<PredictiveSearchReturn>}
 */
async function predictiveSearch({request, context}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') || '').trim();
  const limit = Number(url.searchParams.get('limit') || 10);
  const type = 'predictive';

  if (!term) return {type, term, result: getEmptyPredictiveSearchResult()};

  // Predictively search articles, collections, pages, products, and queries (suggestions)
  const {predictiveSearch: items, errors} = await storefront.query(
    PREDICTIVE_SEARCH_QUERY,
    {
      variables: {
        // customize search options as needed
        limit,
        limitScope: 'EACH',
        term,
      },
    },
  );

  if (errors) {
    throw new Error(
      `Shopify API errors: ${errors.map(({message}) => message).join(', ')}`,
    );
  }

  if (!items) {
    throw new Error('No predictive search data returned from Shopify API');
  }

  const total = Object.values(items).reduce(
    (acc, item) => acc + item.length,
    0,
  );

  return {type, term, result: {items, total}};
}

/** @typedef {import('./+types/search').Route} Route */
/** @typedef {import('~/lib/search').RegularSearchReturn} RegularSearchReturn */
/** @typedef {import('~/lib/search').PredictiveSearchReturn} PredictiveSearchReturn */
/** @typedef {import('storefrontapi.generated').RegularSearchQuery} RegularSearchQuery */
/** @typedef {import('storefrontapi.generated').PredictiveSearchQuery} PredictiveSearchQuery */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
