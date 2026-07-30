import {useEffect, useRef, useState} from 'react';
import {useBuilderStore} from './store';
import {api} from './api';
import {Toolbar} from './Toolbar';
import {Canvas} from './Canvas';
import {SettingsPanel} from './SettingsPanel';
import {VersionHistory} from './VersionHistory';
import {SeoModal} from './SeoModal';

const AUTOSAVE_DELAY_MS = 1500;

export function Editor({handle}) {
  const loadPage = useBuilderStore((s) => s.loadPage);
  const tree = useBuilderStore((s) => s.tree);
  const seo = useBuilderStore((s) => s.seo);
  const dirty = useBuilderStore((s) => s.dirty);
  const setSaving = useBuilderStore((s) => s.setSaving);
  const markSaved = useBuilderStore((s) => s.markSaved);
  const select = useBuilderStore((s) => s.select);

  const [loaded, setLoaded] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const autosaveTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api.getPage(handle).then((page) => {
      if (cancelled) return;
      loadPage(page.handle, page.draftTree, page.seo);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [handle]);

  // Debounced autosave draft whenever the tree/seo changes.
  useEffect(() => {
    if (!loaded || !dirty) return;
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await api.saveDraft(handle, tree, seo);
      } finally {
        markSaved();
      }
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(autosaveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, seo, dirty, loaded]);

  // Keyboard shortcuts: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z redo.
  useEffect(() => {
    function onKeyDown(e) {
      const isMeta = e.ctrlKey || e.metaKey;
      if (!isMeta || e.key.toLowerCase() !== 'z') return;
      e.preventDefault();
      if (e.shiftKey) {
        useBuilderStore.getState().redo();
      } else {
        useBuilderStore.getState().undo();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!loaded) return <p className="loading-page">Loading page…</p>;

  return (
    <div className="editor" onClick={() => select(null)}>
      <Toolbar onShowVersions={() => setShowVersions(true)} onShowSeo={() => setShowSeo(true)} />
      <div className="editor-body" onClick={(e) => e.stopPropagation()}>
        <Canvas />
        <SettingsPanel />
      </div>
      {showVersions && <VersionHistory onClose={() => setShowVersions(false)} />}
      {showSeo && <SeoModal onClose={() => setShowSeo(false)} />}
    </div>
  );
}
