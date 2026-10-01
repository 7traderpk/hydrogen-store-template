/**
 * Web app manifest — makes the storefront installable as a PWA. Matches
 * this codebase's own [sitemap.xml].jsx / [robots.txt].jsx convention: a
 * bracket-named route under app/routes/ returning a Response directly,
 * auto-discovered by flatRoutes() in app/routes.js with no extra wiring.
 *
 * @param {Route.LoaderArgs}
 */
export function loader({request}) {
  const {origin} = new URL(request.url);
  const manifest = {
    name: 'Digilog Electronics',
    short_name: 'Digilog',
    description: 'Arduino, ESP32, sensors, and electronics components — Digilog.pk',
    start_url: `${origin}/`,
    scope: `${origin}/`,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {src: `${origin}/pwa-icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any'},
      {src: `${origin}/pwa-icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any'},
      {src: `${origin}/pwa-icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable'},
      {src: `${origin}/pwa-icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable'},
    ],
  };

  return new Response(JSON.stringify(manifest), {
    status: 200,
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}

/** @typedef {import('./+types/[manifest.webmanifest]').Route} Route */
