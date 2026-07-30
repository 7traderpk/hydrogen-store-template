import {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router';
import {api} from './api';

export function Dashboard() {
  const navigate = useNavigate();
  const [pages, setPages] = useState(null);
  const [newHandle, setNewHandle] = useState('');
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    api.listPages().then(setPages).catch((err) => setError(err.message));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const page = await api.createPage(newHandle.trim(), {title: newHandle.trim()});
      navigate(`/admin/builder/${page.handle}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(handle) {
    if (!confirm(`Delete page "${handle}"? This cannot be undone.`)) return;
    await api.deletePage(handle);
    refresh();
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Pages</h1>
        <form method="post" action="/admin/logout">
          <button type="submit" className="btn-secondary">
            Log out
          </button>
        </form>
      </header>

      <form className="create-page-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="new-page-handle (lowercase, hyphens)"
          value={newHandle}
          onChange={(e) => setNewHandle(e.target.value)}
          pattern="[a-z0-9-]+"
          required
        />
        <button type="submit" disabled={creating}>
          + New page
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}

      {pages === null ? (
        <p>Loading…</p>
      ) : pages.length === 0 ? (
        <p>No pages yet — create one above.</p>
      ) : (
        <table className="pages-table">
          <thead>
            <tr>
              <th>Handle</th>
              <th>Status</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id}>
                <td>
                  <Link to={`/admin/builder/${page.handle}`}>{page.handle}</Link>
                </td>
                <td>
                  <span
                    className={`status-badge ${page.isPublished ? 'published' : 'draft'}`}
                  >
                    {page.isPublished ? 'Published' : 'Draft only'}
                  </span>
                </td>
                <td>{new Date(page.updatedAt).toLocaleString()}</td>
                <td>
                  <button className="btn-danger" onClick={() => handleDelete(page.handle)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
