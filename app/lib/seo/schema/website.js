/**
 * Sitewide WebSite schema with a SearchAction (sitelinks search box) -
 * rendered once in root.jsx's Layout(). Search param confirmed against
 * app/routes/search.jsx: `?q=` is the term param.
 *
 * @param {{name: string; url: string}}
 */
export function website({name, url}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url.replace(/\/$/, '')}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
