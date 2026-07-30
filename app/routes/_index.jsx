import {Await, useLoaderData, useRouteLoaderData} from 'react-router';
import {Suspense} from 'react';
import {ProductItem} from '~/components/ProductItem';
import {MockShopNotice} from '~/components/MockShopNotice';
import {HeroBanner} from '~/components/sections/HeroBanner';
import {FeaturedCollectionGrid} from '~/components/sections/FeaturedCollectionGrid';
import {ImageWithText} from '~/components/sections/ImageWithText';
import {DEFAULT_DESIGN_CONFIG} from '~/lib/designConfig';
import {buildMeta, SITE_URL, SITE_NAME} from '~/lib/seo/metadata';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({matches}) => {
  const rootData = matches.find((m) => m.id === 'root')?.data;
  const shop = rootData?.header?.shop;
  const designConfig = rootData?.designConfig;
  const brandName = designConfig?.brandName || shop?.name || SITE_NAME;

  return buildMeta({
    title: `${brandName} — Online Store`,
    description: shop?.description || `Shop ${brandName} online.`,
    url: SITE_URL,
    image: designConfig?.logoUrl || shop?.brand?.logo?.image?.url,
    // Already a complete brand-inclusive title - skip the "| Digilog" suffix.
    titleSuffix: false,
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
async function loadCriticalData({context}) {
  const [{products}] = await Promise.all([
    // The store's only collection ("frontpage") currently has no products
    // assigned to it, so featured products are queried directly rather than
    // through a collection - this works regardless of the store's
    // collection setup and avoids an empty section.
    context.storefront.query(FEATURED_PRODUCTS_QUERY),
  ]);

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    featuredProducts: products.nodes,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {Route.LoaderArgs}
 */
function loadDeferredData({context}) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  /** @type {LoaderReturnData} */
  const data = useLoaderData();
  const rootData = useRouteLoaderData('root');
  const designConfig = rootData?.designConfig || DEFAULT_DESIGN_CONFIG;
  const heroImage = data.featuredProducts?.[0]?.featuredImage;

  const sectionRenderers = {
    hero: () => <HeroBanner key="hero" image={heroImage} {...designConfig.hero} />,
    featuredCollectionGrid: () => (
      <FeaturedCollectionGrid
        key="featuredCollectionGrid"
        title={designConfig.featuredProductsHeading}
        products={data.featuredProducts}
      />
    ),
    imageWithText: () => (
      <ImageWithText
        key="imageWithText"
        heading={designConfig.featureHighlightsHeading}
        items={designConfig.featureHighlights.map((item) => ({
          title: item.title,
          text: item.text,
          image: item.imageUrl ? {url: item.imageUrl} : undefined,
        }))}
      />
    ),
    recommendedProducts: () => (
      <RecommendedProducts key="recommendedProducts" products={data.recommendedProducts} />
    ),
  };

  const enabledSections = (
    designConfig.homepageSections || DEFAULT_DESIGN_CONFIG.homepageSections
  ).filter((section) => section.enabled && sectionRenderers[section.key]);

  // HeroBanner renders the page's only <h1> - if the merchant disables that
  // section via /admin/design, the homepage would otherwise have zero H1s.
  // This visually-hidden fallback keeps every page at exactly one H1.
  const heroEnabled = enabledSections.some((s) => s.key === 'hero');

  return (
    <div className="home">
      {!heroEnabled && <h1 className="sr-only">{designConfig.brandName}</h1>}
      {data.isShopLinked ? null : <MockShopNotice />}
      {enabledSections.map((section) => sectionRenderers[section.key]())}
    </div>
  );
}

/**
 * @param {{
 *   products: Promise<RecommendedProductsQuery | null>;
 * }}
 */
function RecommendedProducts({products}) {
  return (
    <section
      className="recommended-products"
      aria-labelledby="recommended-products"
    >
      <h2 id="recommended-products">Recommended Products</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {(response) => (
            <div className="recommended-products-grid">
              {response
                ? response.products.nodes.map((product) => (
                    <ProductItem key={product.id} product={product} />
                  ))
                : null}
            </div>
          )}
        </Await>
      </Suspense>
      <br />
    </section>
  );
}

const FEATURED_PRODUCTS_QUERY = `#graphql
  fragment FeaturedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query FeaturedProducts($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: BEST_SELLING) {
      nodes {
        ...FeaturedProduct
      }
    }
  }
`;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
`;

/** @typedef {import('./+types/_index').Route} Route */
/** @typedef {import('storefrontapi.generated').RecommendedProductsQuery} RecommendedProductsQuery */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
