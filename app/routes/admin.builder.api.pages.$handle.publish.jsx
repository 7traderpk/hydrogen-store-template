import {publishPage} from '~/lib/pageBuilderDb.server';

export async function action({request, params, context}) {
  if (!context.session.get('isAdmin')) {
    return Response.json({error: 'Not authenticated'}, {status: 401});
  }
  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }
  const page = publishPage(params.handle);
  if (!page) return Response.json({error: 'Not found'}, {status: 404});
  return Response.json(page);
}
