import {data as remixData} from 'react-router';
import {toggleWishlist} from '~/lib/wishlistDb.server';
import {CUSTOMER_ID_QUERY} from '~/graphql/customer-account/CustomerIdQuery';

/**
 * Toggles a product on/off the logged-in customer's wishlist.
 * POST body: handle=<product handle>. Returns {wishlisted, handle} on
 * success, or {error: 'not_logged_in', loginUrl} when signed out so the
 * client can redirect to login.
 * @param {Route.ActionArgs}
 */
export async function action({request, context}) {
  if (request.method !== 'POST') {
    return remixData({error: 'Method not allowed'}, {status: 405});
  }

  const {customerAccount} = context;
  const isLoggedIn = await customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return remixData(
      {error: 'not_logged_in', loginUrl: '/account/login'},
      {status: 401},
    );
  }

  const form = await request.formData();
  const handle = String(form.get('handle') || '').trim();
  if (!handle) {
    return remixData({error: 'Missing product handle'}, {status: 400});
  }

  const {data, errors} = await customerAccount.query(CUSTOMER_ID_QUERY);
  if (errors?.length || !data?.customer?.id) {
    return remixData({error: 'Could not resolve customer'}, {status: 500});
  }

  const wishlisted = toggleWishlist(data.customer.id, handle);
  return remixData({wishlisted, handle});
}

/** No GET/HEAD behavior - this route is action-only. */
export function loader() {
  return remixData({error: 'Method not allowed'}, {status: 405});
}

/** @typedef {import('./+types/api.wishlist').Route} Route */
