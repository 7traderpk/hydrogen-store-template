import {listVersions} from '~/lib/pageBuilderDb.server';

export async function loader({params, context}) {
  if (!context.session.get('isAdmin')) {
    return Response.json({error: 'Not authenticated'}, {status: 401});
  }
  return Response.json(listVersions(params.handle));
}
