import {redirect} from 'react-router';

/**
 * True only for a plain same-origin relative path - no scheme, no
 * protocol-relative `//host`, and no backslashes. Browsers treat `\` the
 * same as `/` when resolving a URL for `http(s)` schemes (WHATWG URL spec),
 * so a naive `.includes('//')` check alone can be bypassed with `/\host` -
 * that string never contains `//` but still resolves as an external
 * redirect to `host`. Used to validate any redirect target that came from
 * user input (a query param, form field) before handing it to `redirect()`
 * or a `Location` header.
 * @param {unknown} path
 * @returns {boolean}
 */
export function isSafeRedirectPath(path) {
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.includes('\\')
  );
}

/**
 * @param {Request} request
 * @param {...Array<{
 *     handle: string;
 *     data: {handle: string} & unknown;
 *   }>} [localizedResources]
 */
export function redirectIfHandleIsLocalized(request, ...localizedResources) {
  const url = new URL(request.url);
  let shouldRedirect = false;

  localizedResources.forEach(({handle, data}) => {
    if (handle !== data.handle) {
      url.pathname = url.pathname.replace(handle, data.handle);
      shouldRedirect = true;
    }
  });

  if (shouldRedirect) {
    throw redirect(url.toString());
  }
}
