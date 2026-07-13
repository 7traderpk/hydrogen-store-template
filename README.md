# Hydrogen store template

A Shopify Hydrogen storefront, customized beyond the stock scaffold with:

- A small Dawn-inspired homepage section library (hero banner, featured
  products, image-with-text) — see `app/components/sections/`
- A single per-store customization surface (`app/brand.config.js` + a few
  `:root` CSS variables) instead of hardcoded branding scattered through
  the codebase
- A Node.js adapter (`server.hostinger.js`) so it can run on any plain
  Docker/Node host, not just Shopify Oxygen

**Bootstrapping a new store from this template:** see [SETUP.md](./SETUP.md).

## Keeping a store in sync with this template

Each store built from this template is its own git repo, with this
template repo added as a remote:

```bash
git remote add template <this-repo's-url>
git fetch template
git pull template main
```

Expect small, expected conflicts in `app/brand.config.js` and
`app/styles/app.css` `:root` on each pull — those are exactly the files
each store customizes. Everything else should merge cleanly since it's
generic Storefront-API code shared across all stores.

## Local development

```bash
npm install
npm run dev
```

## Building for production

```bash
npm run build
```

## Underlying stack

- [Hydrogen](https://shopify.dev/custom-storefronts/hydrogen) / React Router
- Vite
- Shopify CLI
- Tailwind CSS v4
