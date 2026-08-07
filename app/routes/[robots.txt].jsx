/**
 * @param {Route.LoaderArgs}
 */
export function loader({request}) {
  const url = new URL(request.url);
  const body = robotsTxtData({url: url.origin});

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',

      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}

/**
 * @param {{url?: string}}
 */
function robotsTxtData({url}) {
  const sitemapUrl = url ? `${url}/sitemap.xml` : undefined;
  // Separate from sitemapUrl above - Hydrogen's built-in sitemap generator
  // (see [sitemap.xml].jsx) doesn't support the <image:image> extension, so
  // product images get their own dedicated image sitemap for Google Images
  // discovery. See [sitemap-images.xml].jsx.
  const imageSitemapUrl = url ? `${url}/sitemap-images.xml` : undefined;

  return `
User-agent: *
${generalDisallowRules({sitemapUrl, imageSitemapUrl})}

# AI answer-engine crawlers - explicitly allowed (not just falling under the
# wildcard above) since this site is deliberately optimized for AI answer
# engines (ChatGPT/GPTBot, Perplexity, Google AI Overviews, Gemini). Same
# disallow paths as everyone else - cart/account/search/filter dupes stay
# off-limits, everything else is fair game.
User-agent: GPTBot
${generalDisallowRules({})}

User-agent: ChatGPT-User
${generalDisallowRules({})}

User-agent: PerplexityBot
${generalDisallowRules({})}

User-agent: ClaudeBot
${generalDisallowRules({})}

User-agent: Claude-Web
${generalDisallowRules({})}

User-agent: Google-Extended
${generalDisallowRules({})}

User-agent: CCBot
${generalDisallowRules({})}

User-agent: Applebot-Extended
${generalDisallowRules({})}

# Google adsbot ignores robots.txt unless specifically named!
User-agent: adsbot-google
Disallow: /cart
Disallow: /account
Disallow: /search
Allow: /search/
Disallow: /search/?*

User-agent: Nutch
Disallow: /

User-agent: AhrefsBot
Crawl-delay: 10
${generalDisallowRules({sitemapUrl})}

User-agent: AhrefsSiteAudit
Crawl-delay: 10
${generalDisallowRules({sitemapUrl})}

User-agent: MJ12bot
Crawl-Delay: 10

User-agent: Pinterest
Crawl-delay: 1
`.trim();
}

/**
 * This function generates disallow rules that generally follow what Shopify's
 * Online Store has as defaults for their robots.txt
 * @param {{sitemapUrl?: string; imageSitemapUrl?: string}}
 */
function generalDisallowRules({sitemapUrl, imageSitemapUrl}) {
  return `Disallow: /cart
Disallow: /account
Disallow: /collections/*sort_by*
Disallow: /*/collections/*sort_by*
Disallow: /collections/*+*
Disallow: /collections/*%2B*
Disallow: /collections/*%2b*
Disallow: /*/collections/*+*
Disallow: /*/collections/*%2B*
Disallow: /*/collections/*%2b*
Disallow: /*/collections/*filter*&*filter*
Disallow: /blogs/*+*
Disallow: /blogs/*%2B*
Disallow: /blogs/*%2b*
Disallow: /*/blogs/*+*
Disallow: /*/blogs/*%2B*
Disallow: /*/blogs/*%2b*
Disallow: /policies/
Disallow: /search
Allow: /search/
Disallow: /search/?*
${sitemapUrl ? `Sitemap: ${sitemapUrl}` : ''}
${imageSitemapUrl ? `Sitemap: ${imageSitemapUrl}` : ''}`;
}

/** @typedef {import('./+types/[robots.txt]').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
