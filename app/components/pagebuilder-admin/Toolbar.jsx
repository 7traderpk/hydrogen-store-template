import {useRef, useState} from 'react';
import {Link} from 'react-router';
import {useBuilderStore} from './store';
import {api} from './api';

export function Toolbar({onShowVersions, onShowSeo}) {
  const handle = useBuilderStore((s) => s.handle);
  const tree = useBuilderStore((s) => s.tree);
  const seo = useBuilderStore((s) => s.seo);
  const device = useBuilderStore((s) => s.device);
  const setDevice = useBuilderStore((s) => s.setDevice);
  const history = useBuilderStore((s) => s.history);
  const future = useBuilderStore((s) => s.future);
  const undo = useBuilderStore((s) => s.undo);
  const redo = useBuilderStore((s) => s.redo);
  const dirty = useBuilderStore((s) => s.dirty);
  const saving = useBuilderStore((s) => s.saving);
  const lastSavedAt = useBuilderStore((s) => s.lastSavedAt);
  const importTree = useBuilderStore((s) => s.importTree);

  const [publishing, setPublishing] = useState(false);
  const [publishedMsg, setPublishedMsg] = useState(null);
  const fileInputRef = useRef(null);

  async function handlePublish() {
    setPublishing(true);
    setPublishedMsg(null);
    try {
      await api.saveDraft(handle, tree, seo);
      await api.publishPage(handle);
      setPublishedMsg('Published! Live on the storefront now.');
    } catch (err) {
      setPublishedMsg(`Failed: ${err.message}`);
    } finally {
      setPublishing(false);
      setTimeout(() => setPublishedMsg(null), 4000);
    }
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify({handle, seo, tree}, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${handle}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        importTree(data.tree || []);
      } catch {
        alert('Invalid layout JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="toolbar">
      <Link to="/admin/builder" className="toolbar-back">
        ← Pages
      </Link>
      <span className="toolbar-handle">/{handle}</span>

      <div className="toolbar-group">
        <button onClick={undo} disabled={!history.length} title="Undo">
          ↶
        </button>
        <button onClick={redo} disabled={!future.length} title="Redo">
          ↷
        </button>
      </div>

      <div className="toolbar-group device-toggle">
        {['desktop', 'tablet', 'mobile'].map((d) => (
          <button key={d} className={device === d ? 'active' : ''} onClick={() => setDevice(d)}>
            {d}
          </button>
        ))}
      </div>

      <div className="toolbar-group">
        <button onClick={onShowSeo}>Page settings</button>
        <button onClick={onShowVersions}>Versions</button>
        <button onClick={handleExport}>Export</button>
        <button onClick={() => fileInputRef.current?.click()}>Import</button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{display: 'none'}}
          onChange={handleImportFile}
        />
      </div>

      <div className="toolbar-status">
        {saving
          ? 'Saving…'
          : dirty
            ? 'Unsaved changes'
            : lastSavedAt
              ? `Saved ${lastSavedAt.toLocaleTimeString()}`
              : ''}
      </div>

      <button className="btn-primary" onClick={handlePublish} disabled={publishing}>
        {publishing ? 'Publishing…' : 'Publish'}
      </button>
      {publishedMsg && <span className="publish-msg">{publishedMsg}</span>}
    </div>
  );
}
