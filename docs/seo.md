# SEO + AEO Guide

How the search/answer-engine layer of `lite.digilog.pk` works, what to configure in Shopify
admin, and the decisions behind it. Code lives in `app/lib/seo/` (metadata: `metadata.js`, text
helpers: `text.js`, `toc.js`, `metafields.js`), schema builders in `app/lib/seo/schema/`,
components in `app/components/` (`Faq`, `DirectAnswer`, `SpecList`, `AuthorBio`, `seo/JsonLd`,
`ArticleItem`) and `app/components/builder/elements/` (`FaqBlock`, `ComparisonTable` -
page-builder-only equivalents, see below).

## Two authoring surfaces - know which one applies

This store has **two separate content systems**, and SEO/AEO features exist on both, wired
differently:

1. **Native Shopify content** (Products, Collections, Blog articles) - metadata comes from
   Shopify's built-in `seo.title`/`seo.description` fields with automatic fallbacks; FAQ/specs/
   direct-answer/author-bio come from `custom.*` **metafields** (see table below). Routes:
   `products.$handle.jsx`, `collections.$handle.jsx`, `blogs.$blogHandle.$articleHandle.jsx`.
2. **Page-builder pages** (`/pages/:handle`, authored at `/admin/builder`) - a from-scratch
   drag-and-drop CMS (`app/lib/pageBuilderDb.server.js`, SQLite-backed). FAQ and comparison
   tables here are page-builder **elements** (`FaqBlock`, `ComparisonTable`), authored visually,
   not metafields - there's no Shopify Product/Article behind a page-builder page for a
   metafield to attach to.

Branding (brand name, logo, colors, homepage hero/feature copy) is **not** a static config file
- it's `app/lib/designConfig.js`, a Shop-metafield-backed config editable live at `/admin/design`
(no rebuild needed to change). Don't add a `brand.config.js`-style static file; extend
`designConfig` instead if a new brand-identity field is needed (see `socialLinks` for the
pattern - added for the Organization schema's `sameAs`).

## Architecture notes that will bite you if ignored

- **React Router 7 does not merge route `meta()` across the match tree.** The deepest matched
  route exporting `meta()` owns the entire `<head>` tag set; every indexable route must call
  `buildMeta()` completely rather than relying on a parent's output. The sitewide Organization +
  WebSite JSON-LD sidesteps this differently - it's rendered directly in `root.jsx`'s `Layout()`
  React component (not via `meta()`), so it appears on every page regardless of what that page's
  own `meta()` does.
- `buildMeta()` (`app/lib/seo/metadata.js`) truncates titles to 60 chars **including** a
  `| Digilog` suffix (pass `titleSuffix: false` for titles that already read as a complete
  brand-inclusive string, e.g. the homepage) and descriptions to 160 chars. Checked real
  `seo.title` values in this store before adding the suffix - none already include the brand
  name, so no double-branding risk today; re-check if that ever changes.
- All SEO content is SSR'd. FAQ blocks (both the metafield-driven `Faq` component and the
  page-builder `FaqBlock`) are plain `<h3>/<p>`, never JS accordions - crawlers and answer
  engines that don't execute JS still see the full Q&A text.
- `JsonLd` (`app/components/seo/JsonLd.jsx`) escapes `<` in its JSON output so a literal
  `</script>` inside merchant content (a product description, article body) can't break out of
  the `<script type="application/ld+json">` tag.

## Environment variables

| Var | Purpose |
|---|---|
| `INDEXNOW_KEY` | Server-only (no `PUBLIC_` prefix). Served at `/indexnow.txt`, authenticates `POST /api/indexnow`. Generated with `openssl rand -hex 16`; add to `.env` and `server.hostinger.js`'s env passthrough if rotated. |

Search Console / Bing verification tokens aren't wired yet - see "Still needs your input" below.

## Shopify admin setup

### Metafield definitions (Settings → Custom data)

Create these as **Products** metafields:

| Namespace.key | Type | Used for |
|---|---|---|
| `custom.short_answer` | Multi-line text | AEO direct-answer block on the PDP. Fallback chain: `seo.description`, then first sentence of the description - the metafield only overrides, never blocks the fallback. |
| `custom.faqs` | JSON | `[{"question": "...", "answer": "..."}]` → semantic FAQ section + FAQPage JSON-LD. |
| `custom.specs` | JSON | `[{"name": "...", "value": "..."}]` → `<dl>` spec sheet. |

And these as **Blog posts** (articles) metafields:

| Namespace.key | Type | Used for |
|---|---|---|
| `custom.faqs` | JSON | Same shape as product FAQs. |
| `custom.author_bio` | JSON | `{"name": "...", "bio": "..."}` (a plain string also works) → E-E-A-T author box. |

Everything degrades gracefully: unset metafields render nothing and emit no schema - the
Storefront API returns `null` for undefined metafield identifiers rather than erroring, so this
whole layer ships safely even before any metafield definition exists.

### Social links

`/admin/design` → Social links section → feeds the Organization schema's `sameAs`. Empty by
default; omitted from the schema entirely while empty (never a fabricated placeholder URL).

## Endpoints

| URL | What |
|---|---|
| `/robots.txt` | Shopify defaults + explicit allow blocks for GPTBot, PerplexityBot, ClaudeBot, Google-Extended, CCBot, Applebot-Extended. |
| `/sitemap.xml` | Hydrogen's built-in sitemap index (products/collections/pages/blogs/articles, paginated, `lastmod` included). |
| `/blogs/:blogHandle/rss.xml` | Per-blog RSS 2.0 feed. |
| `/rss.xml` | Site-wide RSS 2.0, latest 50 articles across all blogs - additive alongside the per-blog feeds, not a replacement. |
| `/llms.txt` | Markdown site summary for LLM crawlers - real shop description + real collection list, no fabricated brand roster. |
| `/feeds/google-merchant.xml` | Google Merchant Center feed (RSS 2.0 + `g:` namespace), up to 10k products, 6h cache. Point Merchant Center at it as a scheduled fetch. |
| `/indexnow.txt` | IndexNow key verification file (404 when `INDEXNOW_KEY` unset). |
| `POST /api/indexnow` | IndexNow ping. Body `{"key": "...", "urls": [...]}` or `Authorization: Bearer <key>`. URLs must be on-host. Not wired to any automatic trigger yet - needs a Shopify webhook or cron decision. |
| `/blogs/:blogHandle/authors/:authorSlug` | Author archive pages - see "Author archive pages" below, this works despite what you might assume from the Storefront API's limits. |

## Decisions record

- **Canonicals**: self-referencing, absolute, on every indexable page.
- **robots.txt**: Shopify default disallows (`/cart`, `/account`, `/search` params, faceted
  combos, `/policies/`). AI crawlers are *deliberately allowed* (AEO) - reverse only with a
  business reason.
- **noindex via meta**: `/search`, `/cart`, 404s.
- **Tag taxonomy pages**: not built. One real article has ~200 keyword-stuffing-pattern tags
  (`solar energy for architecture schools`, `solar energy for astronomy schools`, ...) -
  building per-tag pages from real data would generate ~200 thin duplicate pages, a real
  spam-pattern risk. Revisit once that article's tags are cleaned up in Shopify admin.
- **Author archive pages**: `blogs.$blogHandle.authors.$authorSlug.jsx` fetches the blog's
  articles and groups/filters them by a normalized (lowercased, slugified) author name. This
  store's real bylines have inconsistent casing for the same person (`Irfan Ahmad` /
  `IRFAN AHMAD` / `irfan ahmad` all appear) - normalizing the slug is what makes this work at
  all; matching on the raw name would have produced three broken archive pages for one person.
- **Related articles**: same-blog, ranked by shared tags with a recency fallback (most articles
  here have no tags at all, so the fallback carries most of the actual ranking in practice).
- **Review schema**: omitted - no reviews app installed. Add `aggregateRating`/`review[]` to
  `app/lib/seo/schema/product.js` when one exists.
- **`dateModified`**: omitted from `BlogPosting` rather than falling back to `datePublished` -
  the Storefront API exposes no `Article.updatedAt`, and a fallback would imply a real edit
  timestamp that doesn't exist.
- **`gtin`**: sourced from `ProductVariant.barcode` (a real Storefront API field, not a
  metafield) when the merchant has set one.
- **Comparison tables**: two paths depending on where the content lives - the page-builder
  `ComparisonTable` element (guided authoring, `/admin/builder`) for page-builder pages, or a
  real `<table>` typed directly into Shopify's rich-text editor for native product/article
  content (generic `table` CSS styles it either way - no per-table code needed).
- **Multi-brand/hreflang**: out of scope - this deployment is `lite.digilog.pk` only, single
  `en` locale, no cross-domain duplicate catalog today.

## Still needs your input (all of Phase D ships safely without these)

- Define the `custom.*` metafields above in Shopify admin and fill in real values to actually
  see FAQ/specs/direct-answer/author-bio content on native pages.
- Register the Merchant Center feed URL in your Merchant Center account.
- Set/rotate `INDEXNOW_KEY` and decide on a publish-webhook trigger (Shopify webhook or cron)
  to call `POST /api/indexnow` automatically.
- Add Search Console + Bing verification tokens.
- Clean up the ~200-tag article before revisiting tag taxonomy pages.

## Verification checklist

1. `docker compose build && up -d` (VPS deploy flow - see repo root for the actual command).
2. `node scripts/validate-jsonld.mjs https://lite.digilog.pk` - structural JSON-LD check across
   home/catalog/collection/product/blog/article.
3. Run key URLs through Google's Rich Results Test
   (https://search.google.com/test/rich-results): a PDP, a collection, an article.
4. `node scripts/lighthouse.mjs https://lite.digilog.pk` - budgets in `lighthouse-budget.json`
   (LCP < 2.5s, CLS < 0.1, TBT < 300ms). Skips cleanly where Chrome is unavailable.
5. `curl https://lite.digilog.pk/feeds/google-merchant.xml` and `/rss.xml` - confirm valid XML,
   real data.
