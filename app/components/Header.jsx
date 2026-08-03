import {Suspense, useEffect, useRef, useState} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';
import {SearchBar} from '~/components/SearchBar';
import '~/components/SearchBar.css';
import logo from '~/assets/logo.png';

/**
 * @param {HeaderProps}
 */
export function Header({header, isLoggedIn, cart, publicStoreDomain, designConfig}) {
  const {shop, menu} = header;
  const searchCategories = getSearchCategories(menu, {
    publicStoreDomain,
    primaryDomainUrl: header.shop.primaryDomain.url,
  });
  return (
    <header className="header">
      <div className="header-topbar">
        <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
      </div>
      <div className="header-mainbar">
        <NavLink className="header-logo-link" prefetch="intent" to="/" end>
          <img
            className="header-logo"
            src={designConfig?.logoUrl || logo}
            alt={designConfig?.brandName || shop.name}
          />
        </NavLink>
        <SearchBar categories={searchCategories} />
        <HeaderMenu
          menu={menu}
          viewport="desktop"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />
      </div>
    </header>
  );
}

/**
 * @param {{
 *   menu: HeaderProps['header']['menu'];
 *   primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
 *   viewport: Viewport;
 *   publicStoreDomain: HeaderProps['publicStoreDomain'];
 * }}
 */
export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}) {
  const className = `header-menu-${viewport}`;
  const {close} = useAside();

  return (
    <nav className={className} role="navigation">
      {viewport === 'mobile' && (
        <NavLink
          end
          onClick={close}
          prefetch="intent"
          style={activeLinkStyle}
          to="/"
        >
          Home
        </NavLink>
      )}
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;

        const url = resolveMenuUrl(item.url, {
          publicStoreDomain,
          primaryDomainUrl,
        });

        if (item.items?.length) {
          return (
            <HeaderMenuDropdown
              key={item.id}
              title={item.title}
              url={url}
              items={item.items}
              viewport={viewport}
              publicStoreDomain={publicStoreDomain}
              primaryDomainUrl={primaryDomainUrl}
              onNavigate={close}
            />
          );
        }

        return (
          <NavLink
            className="header-menu-item"
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            style={activeLinkStyle}
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

/** Strips the shop's own domain off a menu item's URL so internal links
 * navigate client-side instead of doing a full page load. */
function resolveMenuUrl(url, {publicStoreDomain, primaryDomainUrl}) {
  return url.includes('myshopify.com') ||
    url.includes(publicStoreDomain) ||
    url.includes(primaryDomainUrl)
    ? new URL(url).pathname
    : url;
}

/**
 * Search-bar category options, sourced from the same curated menu item as
 * the "Product Categories" dropdown (see HeaderMenuDropdown) - whichever
 * top-level menu item has sub-items in Shopify Admin -> Online Store ->
 * Navigation. Falls back to just "All" if the menu has no such item yet.
 * @param {HeaderProps['header']['menu']} menu
 * @param {{publicStoreDomain: string; primaryDomainUrl: string}} domains
 */
function getSearchCategories(menu, domains) {
  const categoryMenuItem = (menu || FALLBACK_HEADER_MENU).items.find(
    (item) => item.items?.length,
  );

  const collectionCategories = (categoryMenuItem?.items ?? [])
    .map((item) => {
      const path = resolveMenuUrl(item.url, domains);
      const handle = path.split('/').filter(Boolean).pop();
      return handle ? {label: item.title, value: handle} : null;
    })
    .filter(Boolean);

  return [{label: 'All', value: 'all'}, ...collectionCategories];
}

/**
 * A top-level menu item that has curated sub-items in Shopify Admin ->
 * Online Store -> Navigation (e.g. "Product Categories" listing the store's
 * main collections). Desktop: click-to-open dropdown. Mobile: an always-
 * expanded indented list, since the mobile menu is already a full drawer.
 * @param {{
 *   title: string;
 *   url: string;
 *   items: Array<{id: string; title: string; url: string}>;
 *   viewport: Viewport;
 *   publicStoreDomain: string;
 *   primaryDomainUrl: string;
 *   onNavigate: () => void;
 * }}
 */
function HeaderMenuDropdown({
  title,
  items,
  viewport,
  publicStoreDomain,
  primaryDomainUrl,
  onNavigate,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (viewport !== 'desktop' || !isOpen) return;

    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen, viewport]);

  if (viewport === 'mobile') {
    return (
      <div className="header-menu-item-group">
        <span className="header-menu-item header-menu-item-label">
          {title}
        </span>
        <div className="header-menu-submenu-mobile">
          {items.map((child) => (
            <NavLink
              key={child.id}
              className="header-menu-subitem"
              onClick={onNavigate}
              prefetch="intent"
              style={activeLinkStyle}
              to={resolveMenuUrl(child.url, {publicStoreDomain, primaryDomainUrl})}
            >
              {child.title}
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="header-menu-item-group" ref={rootRef}>
      <button
        type="button"
        className="header-menu-item header-menu-item-toggle reset"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {title}
        <span aria-hidden="true" className="header-menu-caret">
          ▾
        </span>
      </button>
      {isOpen && (
        <ul
          className="header-menu-submenu"
          role="menu"
          onKeyDown={(event) => {
            if (event.key === 'Escape') setIsOpen(false);
          }}
        >
          {items.map((child) => (
            <li key={child.id} role="none">
              <NavLink
                role="menuitem"
                className="header-menu-subitem"
                prefetch="intent"
                onClick={() => setIsOpen(false)}
                to={resolveMenuUrl(child.url, {publicStoreDomain, primaryDomainUrl})}
              >
                {child.title}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * @param {Pick<HeaderProps, 'isLoggedIn' | 'cart'>}
 */
function HeaderCtas({isLoggedIn, cart}) {
  return (
    <nav className="header-ctas" role="navigation">
      <HeaderMenuMobileToggle />
      <NavLink prefetch="intent" to="/account" style={activeLinkStyle}>
        <Suspense fallback="Sign in">
          <Await resolve={isLoggedIn} errorElement="Sign in">
            {(isLoggedIn) => (isLoggedIn ? 'Account' : 'Sign in')}
          </Await>
        </Suspense>
      </NavLink>
      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      className="header-menu-mobile-toggle reset"
      onClick={() => open('mobile')}
    >
      <h3>☰</h3>
    </button>
  );
}

/**
 * @param {{count: number}}
 */
function CartBadge({count}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      href="/cart"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        });
      }}
    >
      Cart <span aria-label={`(items: ${count})`}>{count}</span>
    </a>
  );
}

/**
 * @param {Pick<HeaderProps, 'cart'>}
 */
function CartToggle({cart}) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue();
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};

/**
 * @param {{
 *   isActive: boolean;
 *   isPending: boolean;
 * }}
 */
function activeLinkStyle({isActive, isPending}) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : isActive ? 'var(--color-primary)' : 'black',
  };
}

/** @typedef {'desktop' | 'mobile'} Viewport */
/**
 * @typedef {Object} HeaderProps
 * @property {HeaderQuery} header
 * @property {Promise<CartApiQueryFragment|null>} cart
 * @property {Promise<boolean>} isLoggedIn
 * @property {string} publicStoreDomain
 */

/** @typedef {import('@shopify/hydrogen').CartViewPayload} CartViewPayload */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
