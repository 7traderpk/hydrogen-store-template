/**
 * https://datatracker.ietf.org/doc/html/rfc9116 - lets security researchers
 * find how to report a vulnerability instead of guessing or going public.
 * @param {Route.LoaderArgs}
 */
export function loader({request}) {
  const origin = new URL(request.url).origin;
  const body = `Contact: mailto:security@digilog.pk
Expires: 2027-08-08T00:00:00.000Z
Preferred-Languages: en
Canonical: ${origin}/.well-known/security.txt
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}

/** @typedef {import('./+types/[.well-known].[security.txt]').Route} Route */
