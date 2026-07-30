import {getDesignConfig, DEFAULT_DESIGN_CONFIG} from '~/lib/designConfig';
import {SITE_URL} from '~/lib/seo/metadata';

/**
 * Plain-markdown summary for AI answer engines (ChatGPT/Perplexity/Gemini
 * etc.) - same loader-only resource-route shape as [robots.txt].jsx. Every
 * fact here is real (shop name/description, actual collection titles/links)
 * - no fabricated brand roster or marketing copy, per the AEO spec's own
 * instruction to keep this short and factual.
 *
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  const {storefront} = context;

  const [designConfig, {collections}] = await Promise.all([
    getDesignConfig(storefront),
    storefront.query(LLMS_COLLECTIONS_QUERY, {cache: storefront.CacheLong()}),
  ]);

  const brandName = designConfig?.brandName || DEFAULT_DESIGN_CONFIG.brandName;
  const description = designConfig?.hero?.subheading || '';

  const body = buildLlmsTxt({brandName, description, collections: collections?.nodes || []});

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}

function buildLlmsTxt({brandName, description, collections}) {
  const categoryLines = collections
    .map((c) => `- [${c.title}](${SITE_URL}/collections/${c.handle})`)
    .join('\n');

  return `# ${brandName}

${description}

## Shop
${SITE_URL}/

## Categories
${categoryLines || `See ${SITE_URL}/collections for the full list.`}

## Blog
${SITE_URL}/blogs

## Sitemap
${SITE_URL}/sitemap.xml
`.trim();
}

const LLMS_COLLECTIONS_QUERY = `#graphql
  query LlmsTxtCollections($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 10) {
      nodes {
        title
        handle
      }
    }
  }
`;

/** @typedef {import('./+types/[llms.txt]').Route} Route */
