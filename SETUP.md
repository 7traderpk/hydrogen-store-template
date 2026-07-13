# Deploying this template for a new store

This is a Shopify Hydrogen storefront with a small custom section library
(hero banner, featured products, image-with-text) modeled on Shopify's Dawn
theme, plus a Node.js adapter (`server.hostinger.js`) so it can run on any
plain Docker/Node host instead of requiring Shopify Oxygen.

## 1. Storefront API credentials

In the new store's Shopify admin: **Settings → Apps and sales channels →
Develop apps → [create an app] → API credentials → Storefront API**. Create
a `.env` (copy `.env` from this repo if present, or see `env.d.ts` for the
full variable list) with at minimum:

```
SESSION_SECRET=<generate a new random value - do not reuse another store's>
PUBLIC_STORE_DOMAIN=<new-store>.myshopify.com
PUBLIC_STOREFRONT_API_TOKEN=<public token>
PRIVATE_STOREFRONT_API_TOKEN=<private token>
```

`.env` is gitignored — never commit real credentials.

## 2. Customization checklist

| What | File | Notes |
|---|---|---|
| Brand name, hero copy, feature highlights, extra CSP image domains, font URL | `app/brand.config.js` | The main content customization point |
| Brand colors | `app/styles/app.css` `:root` (`--color-primary` etc.) | Plain CSS custom properties, no build step |
| Logo | `app/assets/logo.png` | Replace the file directly (used in header + favicon) |
| Google Font | `app/brand.config.js` `FONT_GOOGLE_URL` + `app.css` `--font-body-family` | Both must reference the same font name |

Everything else (`app/routes/`, `app/lib/`, `app/components/` other than
homepage section *content*) is generic Storefront-API code and should not
need changes for a standard store.

## 3. Local verification

```
npm install
npm run dev
```

Confirm: homepage renders real products, a product page loads, add-to-cart
works, and the cart's checkout link redirects to the store's real Shopify
checkout. Don't skip this — it's the actual "customers can buy" path.

## 4. Deploy

This has been proven on a plain Ubuntu VPS running Docker + Traefik
(reverse proxy with automatic Let's Encrypt certs). On the deployment host:

1. `mkdir -p /docker/<store-name>/app`
2. Copy the repo into `app/` (excluding `node_modules`, `dist`, `.git`, `.env`)
3. Write a real `.env` next to `docker-compose.yml` (not inside `app/`) with
   the credentials from step 1
4. Copy `docker-compose.yml.example` to `docker-compose.yml`, replace the
   `<STORE_NAME>`/`<STORE_DOMAIN>` placeholders
5. `docker compose up -d --build`
6. Point the store's domain DNS A record at the host's IP

If deploying somewhere other than a Traefik-fronted Docker host, the
`Dockerfile` alone is enough — it builds and runs the app on port 3000
(`server.hostinger.js`) with no Traefik dependency.

## Keeping this store in sync with the template

If this store's repo has the template repo added as a remote (see the
template repo's own README), pull core updates with:

```
git pull template main
```

Expect small conflicts in `app/brand.config.js` and `app/styles/app.css`
`:root` — that's by design, since those are exactly the files each store
customizes. Everything else should merge cleanly.
