import {useEffect, useState} from 'react';
import {api} from './api';
import {useBuilderStore} from './store';

export function VersionHistory({onClose}) {
  const handle = useBuilderStore((s) => s.handle);
  const loadPage = useBuilderStore((s) => s.loadPage);
  const [versions, setVersions] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.listVersions(handle).then(setVersions).catch((err) => setError(err.message));
  }, [handle]);

  async function handleRollback(versionId) {
    if (!confirm('Roll back to this version? This publishes it immediately.')) return;
    try {
      const page = await api.rollback(handle, versionId);
      loadPage(page.handle, page.draftTree, page.seo);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Version history</h3>
          <button onClick={onClose}>×</button>
        </div>
        {error && <p className="error-text">{error}</p>}
        {versions === null ? (
          <p>Loading…</p>
        ) : versions.length === 0 ? (
          <p>No published versions yet.</p>
        ) : (
          <ul className="version-list">
            {versions.map((v) => (
              <li key={v.id}>
                <span>{new Date(v.createdAt).toLocaleString()}</span>
                {v.isCurrent ? (
                  <span className="status-badge published">Live</span>
                ) : (
                  <button onClick={() => handleRollback(v.id)}>Roll back to this</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
