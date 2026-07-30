import {redirect, useParams} from 'react-router';
import {Editor} from '~/components/pagebuilder-admin/Editor';
import pagebuilderStyles from '~/styles/pagebuilder-admin.css?url';

export const meta = () => [{title: 'Page Builder — Editor'}];

export function links() {
  return [{rel: 'stylesheet', href: pagebuilderStyles}];
}

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  if (!context.session.get('isAdmin')) {
    throw redirect('/admin/login');
  }
  return null;
}

export default function AdminBuilderEditor() {
  const {handle} = useParams();
  return <Editor handle={handle} />;
}

/** @typedef {import('./+types/admin.builder.$handle').Route} Route */
