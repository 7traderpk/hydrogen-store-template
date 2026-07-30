#!/usr/bin/env node
/**
 * Structural JSON-LD validator for the storefront's SEO output.
 *
 * Usage: node scripts/validate-jsonld.mjs [baseUrl]   (default http://localhost:3000)
 *
 * Fetches a self-discovered set of pages (home, catalog, one collection, one
 * product, blog index, one blog listing, one article, search), extracts every
 * <script type="application/ld+json"> block, asserts it parses, and checks the
 * required fields per schema.org @type. Exits 1 on any failure.
 *
 * This is a sanity gate, not a substitute for Google's Rich Results Test —
 * run key URLs through https://search.google.com/test/rich-results before
 * shipping (see docs/seo.md).
 */

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');

/** @type {Record<string, (data: any) => string[]>} */
const VALIDATORS = {
  Organization: (d) => req(d, ['name', 'url']),
  WebSite: (d) => req(d, ['name', 'url']),
  Product: (d) => [
    ...req(d, ['name', 'image', 'offers']),
    ...(d.offers ? req(d.offers, ['price', 'priceCurrency'], 'offers.') : []),
  ],
  BreadcrumbList: (d) => [
    ...req(d, ['itemListElement']),
    ...(Array.isArray(d.itemListElement) && d.itemListElement.length
      ? d.itemListElement.every(
          (i, idx) => i && i.position === idx + 1,
        )
        ? []
        : ['itemListElement positions must be 1-based and sequential']
      : ['itemListElement must be a non-empty array']),
  ],
  BlogPosting: (d) => req(d, ['headline', 'datePublished', 'author']),
  ItemList: (d) => req(d, ['itemListElement']),
  FAQPage: (d) => [
    ...req(d, ['mainEntity']),
    ...(Array.isArray(d.mainEntity) && d.mainEntity.length
      ? []
      : ['mainEntity must be a non-empty array']),
  ],
};

/** @param {Record<string, any>} data @param {string[]} keys @param {string} [prefix] */
function req(data, keys, prefix = '') {
  return keys
    .filter((key) => data[key] == null || data[key] === '')
    .map((key) => `missing ${prefix}${key}`);
}

async function fetchHtml(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {accept: 'text/html'},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** @returns {string[]} first hrefs matching pattern */
function findHrefs(html, pattern) {
  const re = /href="([^"]+)"/g;
  const found = new Set();
  let match;
  while ((match = re.exec(html))) {
    if (pattern.test(match[1])) found.add(match[1]);
  }
  return [...found];
}

function extractJsonLd(html) {
  const re =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks = [];
  let match;
  while ((match = re.exec(html))) blocks.push(match[1]);
  return blocks;
}

async function discoverPaths() {
  const paths = ['/', '/collections/all', '/blogs', '/search'];
  try {
    const catalog = await fetchHtml('/collections/all');
    const product = findHrefs(catalog, /^\/products\/[^"?#/]+$/)[0];
    if (product) paths.push(product);
    else console.log('  (no product link discovered on /collections/all)');
  } catch (err) {
    console.log(`  (catalog discovery failed: ${err.message})`);
  }
  try {
    const collections = await fetchHtml('/collections');
    const collection = findHrefs(
      collections,
      /^\/collections\/(?!all$)[^"?#/]+$/,
    )[0];
    if (collection) paths.push(collection);
  } catch (err) {
    console.log(`  (collection discovery failed: ${err.message})`);
  }
  try {
    const blogs = await fetchHtml('/blogs');
    const article = findHrefs(blogs, /^\/blogs\/[^"?#/]+\/[^"?#/]+$/)[0];
    const blogListing = findHrefs(blogs, /^\/blogs\/[^"?#/]+$/)[0];
    if (article) {
      paths.push(article);
      paths.push(`/${article.split('/')[1]}/${article.split('/')[2]}`);
    } else if (blogListing) {
      paths.push(blogListing);
    } else {
      console.log('  (no blog/article links discovered on /blogs)');
    }
  } catch (err) {
    console.log(`  (blog discovery failed: ${err.message})`);
  }
  return [...new Set(paths)];
}

let failures = 0;

for (const path of await discoverPaths()) {
  let html;
  try {
    html = await fetchHtml(path);
  } catch (err) {
    failures++;
    console.log(`FAIL ${path} — fetch error: ${err.message}`);
    continue;
  }

  const blocks = extractJsonLd(html);
  const pageErrors = [];
  const typesFound = [];

  for (const block of blocks) {
    let data;
    try {
      data = JSON.parse(block);
    } catch (err) {
      pageErrors.push(`invalid JSON: ${err.message}`);
      continue;
    }
    const items = Array.isArray(data) ? data : [data];
    for (const item of items) {
      const type = item?.['@type'];
      typesFound.push(type ?? '(no @type)');
      const validate = VALIDATORS[type];
      if (validate) {
        for (const error of validate(item)) {
          pageErrors.push(`${type}: ${error}`);
        }
      }
    }
  }

  if (pageErrors.length) {
    failures++;
    console.log(
      `FAIL ${path} — [${typesFound.join(', ') || 'no JSON-LD'}]\n${pageErrors
        .map((e) => `      - ${e}`)
        .join('\n')}`,
    );
  } else {
    console.log(`OK   ${path} — [${typesFound.join(', ') || 'no JSON-LD'}]`);
  }
}

console.log(
  failures
    ? `\n${failures} page(s) with JSON-LD failures.`
    : '\nAll discovered pages passed JSON-LD validation.',
);
process.exit(failures ? 1 : 0);
