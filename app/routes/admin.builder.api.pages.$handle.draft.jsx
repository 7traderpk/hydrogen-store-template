import {saveDraft} from '~/lib/pageBuilderDb.server';

export async function action({request, params, context}) {
  if (!context.session.get('isAdmin')) {
    return Response.json({error: 'Not authenticated'}, {status: 401});
  }
  if (request.method !== 'PATCH') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }
  const body = await request.json();
  const page = saveDraft(params.handle, body.tree, body.seo);
  if (!page) return Response.json({error: 'Not found'}, {status: 404});
  return Response.json(page);
}
