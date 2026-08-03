/**
 * Per-store customization surface.
 *
 * This is the file a new store deployed from this template edits to re-brand
 * the storefront's text content and third-party domains. It does NOT cover
 * brand colors (see app/styles/app.css `:root`) or the logo image (see
 * app/assets/logo.png) - see SETUP.md for the full customization checklist.
 */

import demoIcon1 from '~/assets/feature-icon-1.png';
import demoIcon2 from '~/assets/feature-icon-2.png';
import demoIcon3 from '~/assets/feature-icon-3.png';
import demoIcon4 from '~/assets/feature-icon-4.png';

export const BRAND_NAME = 'My Store';

/**
 * If this storefront is a lightweight mirror of a full main site (same
 * Shopify catalog, so the same product handles resolve on both), the main
 * site's base URL - shown as a "Main Store" link next to SKU on the
 * product page, deep-linking to the same product there. Leave null if
 * this storefront has no separate main-site counterpart.
 */
export const MAIN_STORE_URL = 'https://digilog.pk';

/** Google Fonts stylesheet URL loaded in app/root.jsx. */
export const FONT_GOOGLE_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap';

/**
 * Extra domains the storefront's Content-Security-Policy `img-src` directive
 * must allow, beyond 'self' and cdn.shopify.com - e.g. if product
 * descriptions embed images hosted elsewhere. See app/entry.server.jsx.
 * Leave empty if all images come from Shopify's CDN.
 */
export const ADDITIONAL_CSP_IMAGE_DOMAINS = [
  // Product descriptions (imported/copy-pasted content) reference images by
  // the digilog.pk domain rather than cdn.shopify.com, even though they're
  // served from the same Shopify CDN storage - without this, the browser's
  // CSP silently blocks them (broken-image icon), even though the URL is
  // otherwise valid.
  'https://digilog.pk',
];

/** Homepage hero banner content. See app/components/sections/HeroBanner.jsx. */
export const HERO_CONTENT = {
  heading: 'Welcome to My Store',
  subheading: 'Replace this with your own hero copy in app/brand.config.js.',
  buttonText: 'Shop Now',
  buttonLink: '#featured-collection-heading',
};

export const FEATURED_PRODUCTS_HEADING = 'Featured Products';

/**
 * Homepage feature-highlight blocks. See
 * app/components/sections/ImageWithText.jsx. `image` is optional - omit it
 * to render the block as text-only. The four icons here
 * (app/assets/feature-icon-*.png) are placeholder demo shapes generated for
 * this template - swap for real icons/photos, or delete them and drop the
 * `image` key to go text-only.
 */
export const FEATURE_HIGHLIGHTS_HEADING = 'Why Shop With Us';

export const FEATURE_HIGHLIGHTS = [
  {
    title: 'Feature One',
    text: 'Replace with real copy about this store\'s products or service.',
    image: {url: demoIcon1},
  },
  {
    title: 'Feature Two',
    text: 'Replace with real copy about this store\'s products or service.',
    image: {url: demoIcon2},
  },
  {
    title: 'Feature Three',
    text: 'Replace with real copy about this store\'s products or service.',
    image: {url: demoIcon3},
  },
  {
    title: 'Feature Four',
    text: 'Replace with real copy about this store\'s products or service.',
    image: {url: demoIcon4},
  },
];
