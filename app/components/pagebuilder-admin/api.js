const BASE = '/admin/builder/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  listPages: () => request('/pages'),
  createPage: (handle, seo) =>
    request('/pages', {method: 'POST', body: JSON.stringify({handle, seo})}),
  getPage: (handle) => request(`/pages/${handle}`),
  saveDraft: (handle, tree, seo) =>
    request(`/pages/${handle}/draft`, {
      method: 'PATCH',
      body: JSON.stringify({tree, seo}),
    }),
  publishPage: (handle) => request(`/pages/${handle}/publish`, {method: 'POST'}),
  listVersions: (handle) => request(`/pages/${handle}/versions`),
  rollback: (handle, versionId) =>
    request(`/pages/${handle}/rollback/${versionId}`, {method: 'POST'}),
  deletePage: (handle) => request(`/pages/${handle}`, {method: 'DELETE'}),
};
