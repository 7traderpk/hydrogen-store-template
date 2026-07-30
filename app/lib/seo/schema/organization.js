/**
 * Sitewide Organization schema - rendered once in root.jsx's Layout().
 * `sameAs` is only included when socialLinks has at least one populated URL
 * (designConfig-editable, empty by default) - never fabricate placeholder
 * social URLs.
 *
 * @param {{name: string; description?: string; url: string; logoUrl?: string; socialLinks?: Record<string, string|null>}}
 */
export function organization({name, description, url, logoUrl, socialLinks}) {
  const sameAs = Object.values(socialLinks || {}).filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    // Stable id so other schemas on the page (BlogPosting.publisher) can
    // reference this same Organization object instead of repeating it.
    '@id': `${url}/#organization`,
    name,
    ...(description ? {description} : {}),
    url,
    ...(logoUrl ? {logo: logoUrl} : {}),
    ...(sameAs.length ? {sameAs} : {}),
  };
}
