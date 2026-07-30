import {redirect} from 'react-router';

// Catch-all for any /apps/tracking/<sub-path> the tracking app itself
// generates (order lookup pages, asset paths, etc.) - forward the whole
// thing to the same app proxy on the main digilog.pk domain.
//
// Uses react-router's `redirect()` rather than the raw `Response.redirect()`
// - see apps.tracking._index.jsx for why.
export async function loader({request, params}) {
  const {search} = new URL(request.url);
  const suffix = params['*'] ? `/${params['*']}` : '';
  return redirect(`https://digilog.pk/apps/tracking${suffix}${search}`);
}
