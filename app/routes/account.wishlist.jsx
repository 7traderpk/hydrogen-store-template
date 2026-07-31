import {useLoaderData} from 'react-router';
import {ProductItem} from '~/components/ProductItem';
import {hasMultipleVariants} from '~/lib/variants';
import {listWishlistHandles} from '~/lib/wishlistDb.server';
import {CUSTOMER_ID_QUERY} from '~/graphql/customer-account/CustomerIdQuery';

const WISHLIST_PRODUCT_QUERY = `#graphql
  query WishlistProduct($handle: String!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      handle
      featuredImage {
        id
        altText
        url
        width
        height
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
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
  }
`;

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  await context.customerAccount.handleAuthStatus();

  const {data} = await context.customerAccount.query(CUSTOMER_ID_QUERY);
  const customerId = data?.customer?.id;
  const handles = listWishlistHandles(customerId);

  const products = (
    await Promise.all(
      handles.map((handle) =>
        context.storefront
          .query(WISHLIST_PRODUCT_QUERY, {variables: {handle}})
          .then((res) => res.product)
          .catch(() => null),
      ),
    )
  ).filter((product) => product && !hasMultipleVariants(product));

  return {products};
}

export default function AccountWishlist() {
  /** @type {LoaderReturnData} */
  const {products} = useLoaderData();

  if (!products.length) {
    return (
      <p>
        Your wishlist is empty. Tap the heart icon on any product to save it
        here.
      </p>
    );
  }

  return (
    <div className="products-grid">
      {products.map((product) => (
        <ProductItem key={product.id} product={product} />
      ))}
    </div>
  );
}

/** @typedef {import('./+types/account.wishlist').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
