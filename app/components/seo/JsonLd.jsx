// Renders one or more JSON-LD <script> blocks from schema.org objects built
// by app/lib/seo/schema/*.js. Accepts a single schema object or an array -
// falsy entries are skipped so callers can pass conditionally-built schemas
// (e.g. `[product(...), hasFaq && faqPage(...)]`) without extra filtering.

export function JsonLd({data}) {
  const items = (Array.isArray(data) ? data : [data]).filter(Boolean);
  if (!items.length) return null;

  return items.map((item, i) => (
    <script
      key={i}
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        // Escape `<` so a literal `</script>` inside merchant content (a
        // product description, article body) can't break out of the tag.
        __html: JSON.stringify(item).replace(/</g, '\\u003c'),
      }}
    />
  ));
}
