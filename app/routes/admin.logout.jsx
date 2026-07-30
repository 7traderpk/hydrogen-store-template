import {redirect} from 'react-router';

/**
 * @param {Route.ActionArgs}
 */
export async function action({context}) {
  context.session.unset('isAdmin');
  throw redirect('/admin/login');
}

export async function loader() {
  throw redirect('/admin/login');
}

/** @typedef {import('./+types/admin.logout').Route} Route */
