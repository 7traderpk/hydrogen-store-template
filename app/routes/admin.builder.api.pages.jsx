import {listPages, createPage} from '~/lib/pageBuilderDb.server';

function requireAdmin(context) {
  if (!context.session.get('isAdmin')) {
    throw Response.json({error: 'Not authenticated'}, {status: 401});
  }
}

export async function loader({context}) {
  requireAdmin(context);
  return Response.json(listPages());
}

export async function action({request, context}) {
  requireAdmin(context);
  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }
  const body = await request.json();
  const handle = String(body.handle || '').trim();
  if (!/^[a-z0-9-]+$/.test(handle)) {
    return Response.json(
      {error: 'Handle must be lowercase letters, numbers, and hyphens only.'},
      {status: 400},
    );
  }
  try {
    const page = createPage(handle, body.seo || {});
    return Response.json(page, {status: 201});
  } catch (error) {
    return Response.json({error: error.message}, {status: 400});
  }
}
