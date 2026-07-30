import {redirect, Form, useActionData} from 'react-router';
import bcrypt from 'bcryptjs';

export const meta = () => [{title: 'Design Dashboard Login'}];

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  if (context.session.get('isAdmin')) {
    throw redirect('/admin/design');
  }
  return null;
}

/**
 * @param {Route.ActionArgs}
 */
export async function action({request, context}) {
  const formData = await request.formData();
  const username = String(formData.get('username') || '');
  const password = String(formData.get('password') || '');

  const {ADMIN_USERNAME, ADMIN_PASSWORD_HASH} = context.env;
  const validUsername = Boolean(ADMIN_USERNAME) && username === ADMIN_USERNAME;
  const validPassword =
    validUsername && ADMIN_PASSWORD_HASH
      ? await bcrypt.compare(password, ADMIN_PASSWORD_HASH)
      : false;

  if (!validUsername || !validPassword) {
    return {error: 'Invalid username or password.'};
  }

  context.session.set('isAdmin', true);
  throw redirect('/admin/design');
}

export default function AdminLogin() {
  const actionData = useActionData();

  return (
    <div className="admin-login-page">
      <h1>Design Dashboard</h1>
      {actionData?.error && (
        <p className="admin-login-error">{actionData.error}</p>
      )}
      <Form method="post" className="admin-login-form">
        <label>
          Username
          <input type="text" name="username" required autoFocus />
        </label>
        <label>
          Password
          <input type="password" name="password" required />
        </label>
        <button type="submit" className="btn">
          Log in
        </button>
      </Form>
    </div>
  );
}

/** @typedef {import('./+types/admin.login').Route} Route */
