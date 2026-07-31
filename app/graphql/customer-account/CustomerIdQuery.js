// NOTE: https://shopify.dev/docs/api/customer/latest/queries/customer
// Minimal id-only lookup used wherever a route only needs to key data (e.g.
// the wishlist) against the logged-in customer, not their full profile.
export const CUSTOMER_ID_QUERY = `#graphql
  query CustomerId {
    customer {
      id
    }
  }
`;
