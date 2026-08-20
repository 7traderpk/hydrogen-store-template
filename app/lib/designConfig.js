// Live-editable storefront design config, backed by a Shop metafield
// (lite_storefront.design_config, type json, Storefront-API-readable) so the
// admin dashboard at /admin/design can change branding/homepage layout
// without a code edit + rebuild + redeploy cycle.
//
// DEFAULT_DESIGN_CONFIG is the fallback used if the metafield is ever
// missing/unparseable (e.g. a fresh store from this template that hasn't
// been through the dashboard yet), mirroring the original static
// brand.config.js values.

export const DEFAULT_DESIGN_CONFIG = {
  brandName: 'My Store',
  colors: {
    primary: '#e53e3e',
    primaryDark: '#c53030',
    accent: '#f56565',
  },
  fontGoogleUrl:
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
  logoUrl: null,
  // Sitewide Organization JSON-LD's `sameAs` (see app/lib/seo/schema/organization.js) -
  // empty by default, only included in the schema when populated. Never
  // fabricate placeholder social URLs.
  socialLinks: {
    facebook: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    linkedin: null,
  },
  hero: {
    heading: 'Welcome to My Store',
    subheading: 'Replace this with your own hero copy in the design dashboard.',
    buttonText: 'Shop Now',
    buttonLink: '#featured-collection-heading',
  },
  featuredProductsHeading: 'Featured Products',
  featureHighlightsHeading: 'Why Shop With Us',
  featureHighlights: [
    {title: 'Feature One', text: '', imageUrl: null},
    {title: 'Feature Two', text: '', imageUrl: null},
    {title: 'Feature Three', text: '', imageUrl: null},
    {title: 'Feature Four', text: '', imageUrl: null},
  ],
  homepageSections: [
    {key: 'hero', enabled: true},
    {key: 'featuredCollectionGrid', enabled: true},
    {key: 'imageWithText', enabled: true},
    {key: 'recommendedProducts', enabled: true},
  ],
};

export const DESIGN_CONFIG_METAFIELD_QUERY = `#graphql
  query DesignConfig {
    shop {
      metafield(namespace: "lite_storefront", key: "design_config") {
        value
      }
    }
  }
`;

/**
 * Fetch and parse the design config via the Storefront API, falling back to
 * defaults for anything missing (so partially-saved/older configs don't
 * break rendering).
 * @param {{query: (q: string) => Promise<any>}} storefront
 */
export async function getDesignConfig(storefront) {
  try {
    // The whole point of the dashboard is that changes go live immediately,
    // so this one cheap Shop-level query bypasses Hydrogen's default
    // sub-request cache rather than showing stale branding after a save.
    const {shop} = await storefront.query(DESIGN_CONFIG_METAFIELD_QUERY, {
      cache: storefront.CacheNone(),
    });
    const raw = shop?.metafield?.value;
    if (!raw) return DEFAULT_DESIGN_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_DESIGN_CONFIG,
      ...parsed,
      colors: {...DEFAULT_DESIGN_CONFIG.colors, ...parsed.colors},
      socialLinks: {...DEFAULT_DESIGN_CONFIG.socialLinks, ...parsed.socialLinks},
      hero: {...DEFAULT_DESIGN_CONFIG.hero, ...parsed.hero},
      featureHighlights:
        parsed.featureHighlights?.length
          ? parsed.featureHighlights
          : DEFAULT_DESIGN_CONFIG.featureHighlights,
      homepageSections:
        parsed.homepageSections?.length
          ? parsed.homepageSections
          : DEFAULT_DESIGN_CONFIG.homepageSections,
    };
  } catch (error) {
    console.error('Failed to load design config, using defaults:', error);
    return DEFAULT_DESIGN_CONFIG;
  }
}
