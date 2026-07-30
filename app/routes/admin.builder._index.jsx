import {redirect} from 'react-router';
import {Dashboard} from '~/components/pagebuilder-admin/Dashboard';
import pagebuilderStyles from '~/styles/pagebuilder-admin.css?url';

export const meta = () => [{title: 'Page Builder'}];

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

export default function AdminBuilderIndex() {
  return <Dashboard />;
}

/** @typedef {import('./+types/admin.builder._index').Route} Route */
