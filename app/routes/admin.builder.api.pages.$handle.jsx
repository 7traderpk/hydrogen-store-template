import {getPage, deletePage} from '~/lib/pageBuilderDb.server';

function requireAdmin(context) {
  if (!context.session.get('isAdmin')) {
    throw Response.json({error: 'Not authenticated'}, {status: 401});
  }
}

export async function loader({params, context}) {
  requireAdmin(context);
  const page = getPage(params.handle);
  if (!page) return Response.json({error: 'Not found'}, {status: 404});
  return Response.json(page);
}

export async function action({request, params, context}) {
  requireAdmin(context);
  if (request.method !== 'DELETE') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }
  deletePage(params.handle);
  return Response.json({ok: true});
}
