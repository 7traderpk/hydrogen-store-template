import {useBuilderStore} from './store';

export function SeoModal({onClose}) {
  const handle = useBuilderStore((s) => s.handle);
  const seo = useBuilderStore((s) => s.seo);
  const setSeo = useBuilderStore((s) => s.setSeo);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Page settings</h3>
          <button onClick={onClose}>×</button>
        </div>
        <label className="field-row">
          <span>URL handle</span>
          <input type="text" value={handle} disabled />
        </label>
        <p className="field-hint">
          Live at: lite.digilog.pk/pages/{handle}
        </p>
        <label className="field-row">
          <span>SEO title</span>
          <input
            type="text"
            value={seo.title || ''}
            onChange={(e) => setSeo({...seo, title: e.target.value})}
          />
        </label>
        <label className="field-row">
          <span>Meta description</span>
          <textarea
            rows={3}
            value={seo.description || ''}
            onChange={(e) => setSeo({...seo, description: e.target.value})}
          />
        </label>
      </div>
    </div>
  );
}
