import {useEffect, useState} from 'react';
import {useFetcher} from 'react-router';

/**
 * Heart-icon toggle button that adds/removes a product from the logged-in
 * customer's wishlist via /api/wishlist. Signed-out clicks redirect to
 * login instead of failing silently.
 * @param {{
 *   handle: string;
 *   initialWishlisted?: boolean;
 *   className?: string;
 * }}
 */
export function WishlistButton({handle, initialWishlisted = false, className = ''}) {
  const fetcher = useFetcher();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher.data.error === 'not_logged_in') {
      window.location.href = fetcher.data.loginUrl;
      return;
    }
    if (
      typeof fetcher.data.wishlisted === 'boolean' &&
      fetcher.data.handle === handle
    ) {
      setWishlisted(fetcher.data.wishlisted);
    }
  }, [fetcher.data, handle]);

  return (
    <fetcher.Form
      method="POST"
      action="/api/wishlist"
      className={`wishlist-button-form ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      <input type="hidden" name="handle" value={handle} />
      <button
        type="submit"
        className={`wishlist-button${wishlisted ? ' is-wishlisted' : ''}`}
        aria-pressed={wishlisted}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        disabled={fetcher.state !== 'idle'}
      >
        <span aria-hidden="true">{wishlisted ? '♥' : '♡'}</span>
      </button>
    </fetcher.Form>
  );
}
