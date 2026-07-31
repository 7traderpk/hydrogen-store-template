import {Await, useLoaderData} from 'react-router';
import {Suspense} from 'react';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductGallery} from '~/components/ProductGallery';
import {ProductForm} from '~/components/ProductForm';
import {ProductItem} from '~/components/ProductItem';
import {WishlistButton} from '~/components/WishlistButton';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {hasMultipleVariants} from '~/lib/variants';
import {isInWishlist} from '~/lib/wishlistDb.server';
import {CUSTOMER_ID_QUERY} from '~/graphql/customer-account/CustomerIdQuery';
import {buildMeta, SITE_URL} from '~/lib/seo/metadata';
import {stripHtml, truncate, firstSentence} from '~/lib/seo/text';
import {JsonLd} from '~/components/seo/JsonLd';
import {product as productSchema} from '~/lib/seo/schema/product';
import {breadcrumbList} from '~/lib/seo/schema/breadcrumbList';
import {DirectAnswer} from '~/components/DirectAnswer';
import {SpecList} from '~/components/SpecList';
import {Faq} from '~/components/Faq';
import {parseJsonMetafield} from '~/lib/seo/metafields';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  const product = data?.product;
  if (!product) return buildMeta({title: 'Product not found', robots: 'noindex,nofollow'});

  const url = `${SITE_URL}/products/${product.handle}`;
  return buildMeta({
    title: product.seo?.title || product.title,
    description:
      product.seo?.description || truncate(stripHtml(product.description), 160),
    url,
    image: product.images?.nodes?.[0]?.url,
    type: 'product',
  });
};

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {Route.LoaderArgs}
 */
async function loadCriticalData({context, params, request}) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  // Multi-variant products aren't sold on this storefront - treat their
  // product page as not found so they're unreachable even by direct URL.
  if (hasMultipleVariants(product)) {
    throw new Response(null, {status: 404});
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: product});

  // Skip the extra Customer Account API round trip for the common case
  // (anonymous visitor) - isLoggedIn() is a fast local check.
  const {customerAccount} = context;
  let initialWishlisted = false;
  if (await customerAccount.isLoggedIn()) {
    const {data} = await customerAccount.query(CUSTOMER_ID_QUERY);
    initialWishlisted = isInWishlist(data?.customer?.id, handle);
  }

  return {
    product,
    initialWishlisted,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {Route.LoaderArgs}
 */
function loadDeferredData({context, params}) {
  const relatedProducts = context.storefront
    .query(RELATED_PRODUCTS_QUERY, {
      variables: {handle: params.handle},
    })
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    relatedProducts,
  };
}

export default function Product() {
  /** @type {LoaderReturnData} */
  const {product, relatedProducts, initialWishlisted} = useLoaderData();

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, descriptionHtml} = product;

  // Metafields arrive in PRODUCT_FRAGMENT identifier order:
  // [short_answer, faqs, specs] (null when unset in Shopify admin).
  const [shortAnswerMetafield, faqsMetafield, specsMetafield] = product.metafields ?? [];
  const directAnswerText =
    shortAnswerMetafield?.value ||
    product.seo?.description ||
    firstSentence(stripHtml(product.description));

  const productUrl = `${SITE_URL}/products/${product.handle}`;
  const jsonLd = [
    productSchema({
      title: product.title,
      description: product.seo?.description || truncate(stripHtml(product.description), 300),
      images: product.images?.nodes?.map((img) => img.url),
      vendor: product.vendor,
      sku: selectedVariant?.sku,
      gtin: selectedVariant?.barcode,
      url: productUrl,
      price: selectedVariant?.price?.amount,
      priceCurrency: selectedVariant?.price?.currencyCode,
      availableForSale: Boolean(selectedVariant?.availableForSale),
    }),
    breadcrumbList([
      {name: 'Home', url: SITE_URL},
      {name: product.title, url: productUrl},
    ]),
  ];

  return (
    <div className="product-page">
      <JsonLd data={jsonLd} />
      <div className="product">
        <ProductGallery
          images={product.images?.nodes}
          selectedImage={selectedVariant?.image}
          productTitle={product.title}
        />
        <div className="product-main">
          <div className="product-title-row">
            <h1>{title}</h1>
            <WishlistButton
              handle={product.handle}
              initialWishlisted={initialWishlisted}
            />
          </div>
          <DirectAnswer text={directAnswerText} />
          <dl className="product-meta">
            <dt>Availability</dt>
            <dd
              className={`product-meta-availability${
                selectedVariant?.availableForSale ? ' in-stock' : ' out-of-stock'
              }`}
            >
              {selectedVariant?.availableForSale
                ? 'In stock'
                : 'Out of stock'}
            </dd>
            {selectedVariant?.sku && (
              <>
                <dt>SKU</dt>
                <dd className="product-sku">{selectedVariant.sku}</dd>
              </>
            )}
          </dl>
          <ProductPrice
            price={selectedVariant?.price}
            compareAtPrice={selectedVariant?.compareAtPrice}
          />
          <ProductForm
            productOptions={productOptions}
            selectedVariant={selectedVariant}
          />
        </div>
      </div>

      <div className="product-description">
        <h2>Description</h2>
        <div dangerouslySetInnerHTML={{__html: descriptionHtml}} />
      </div>

      <SpecList specs={parseJsonMetafield(specsMetafield)} />
      <Faq items={parseJsonMetafield(faqsMetafield)} />

      <RelatedProducts products={relatedProducts} />

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

/**
 * @param {{
 *   products: Promise<RelatedProductsQuery | null>;
 * }}
 */
function RelatedProducts({products}) {
  return (
    <section
      className="related-products"
      aria-labelledby="related-products-heading"
    >
      <h2 id="related-products-heading">You may also like</h2>
      <Suspense fallback={null}>
        <Await resolve={products}>
          {(response) => {
            const items = (
              response?.productRecommendations?.length
                ? response.productRecommendations
                : response?.fallback?.nodes
            )?.filter((product) => !hasMultipleVariants(product));
            if (!items?.length) return null;
            return (
              <div className="recommended-products-grid">
                {items.slice(0, 4).map((product) => (
                  <ProductItem key={product.id} product={product} />
                ))}
              </div>
            );
          }}
        </Await>
      </Suspense>
    </section>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    barcode
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
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
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    variants(first: 2) {
      nodes {
        id
      }
    }
    images(first: 10) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
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
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
    metafields(
      identifiers: [
        {namespace: "custom", key: "short_answer"}
        {namespace: "custom", key: "faqs"}
        {namespace: "custom", key: "specs"}
      ]
    ) {
      value
      type
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
`;

// Native Shopify recommendations ("customers also bought" style), with a
// same-handle products fallback for stores/products too new to have
// recommendation data yet - keeps the section from just being empty.
const RELATED_PRODUCTS_QUERY = `#graphql
  fragment RelatedProduct on Product {
    id
    title
    handle
    featuredImage {
      id
      url
      altText
      width
      height
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 2) {
      nodes {
        id
      }
    }
  }
  query RelatedProducts($handle: String!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
    }
    productRecommendations(productHandle: $handle) {
      ...RelatedProduct
    }
    fallback: products(first: 4, sortKey: BEST_SELLING) {
      nodes {
        ...RelatedProduct
      }
    }
  }
`;

/** @typedef {import('./+types/products.$handle').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
/** @typedef {import('storefrontapi.generated').RelatedProductsQuery} RelatedProductsQuery */
