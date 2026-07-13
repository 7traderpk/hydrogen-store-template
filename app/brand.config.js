/**
 * Per-store customization surface.
 *
 * This is the file a new store deployed from this template edits to re-brand
 * the storefront's text content and third-party domains. It does NOT cover
 * brand colors (see app/styles/app.css `:root`) or the logo image (see
 * app/assets/logo.png) - see SETUP.md for the full customization checklist.
 */

export const BRAND_NAME = 'My Store';

/** Google Fonts stylesheet URL loaded in app/root.jsx. */
export const FONT_GOOGLE_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap';

/**
 * Extra domains the storefront's Content-Security-Policy `img-src` directive
 * must allow, beyond 'self' and cdn.shopify.com - e.g. if product
 * descriptions embed images hosted elsewhere. See app/entry.server.jsx.
 * Leave empty if all images come from Shopify's CDN.
 */
export const ADDITIONAL_CSP_IMAGE_DOMAINS = [];

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
 * to render the block as text-only.
 */
export const FEATURE_HIGHLIGHTS_HEADING = 'Why Shop With Us';

export const FEATURE_HIGHLIGHTS = [
  {
    title: 'Feature One',
    text: 'Replace with real copy about this store\'s products or service.',
  },
  {
    title: 'Feature Two',
    text: 'Replace with real copy about this store\'s products or service.',
  },
  {
    title: 'Feature Three',
    text: 'Replace with real copy about this store\'s products or service.',
  },
  {
    title: 'Feature Four',
    text: 'Replace with real copy about this store\'s products or service.',
  },
];
