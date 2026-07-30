import {useState} from 'react';
import {useBuilderStore, findNode} from './store';
import {ELEMENT_DEFS} from './elementDefs';

export function SettingsPanel() {
  const selectedId = useBuilderStore((s) => s.selectedId);
  const tree = useBuilderStore((s) => s.tree);
  const select = useBuilderStore((s) => s.select);
  const updateNodeProps = useBuilderStore((s) => s.updateNodeProps);
  const updateNodeStyle = useBuilderStore((s) => s.updateNodeStyle);
  const updateNodeVisibility = useBuilderStore((s) => s.updateNodeVisibility);
  const [tab, setTab] = useState('content');

  const node = selectedId ? findNode(tree, selectedId) : null;

  if (!node) {
    return (
      <aside className="settings-panel settings-panel-empty">
        <p>Select an element on the canvas to edit its settings.</p>
      </aside>
    );
  }

  const def = ELEMENT_DEFS[node.type];
  if (!def) return null;

  return (
    <aside className="settings-panel">
      <div className="settings-panel-header">
        <h3>{def.label}</h3>
        <button onClick={() => select(null)}>×</button>
      </div>
      <div className="settings-tabs">
        {['content', 'style', 'advanced'].map((t) => (
          <button
            key={t}
            className={tab === t ? 'active' : ''}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'content' && (
        <FieldList
          fields={def.fields.content}
          values={node.props}
          onChange={(patch) => updateNodeProps(node.id, patch)}
        />
      )}

      {tab === 'style' && (
        <>
          <FieldList
            fields={def.fields.style}
            values={node.style}
            onChange={(patch) => updateNodeStyle(node.id, patch)}
          />
          <label className="field-row">
            <span>Custom CSS class</span>
            <input
              type="text"
              value={node.style.customClass || ''}
              onChange={(e) => updateNodeStyle(node.id, {customClass: e.target.value})}
            />
          </label>
        </>
      )}

      {tab === 'advanced' && (
        <div className="visibility-fields">
          <p className="field-hint">Responsive visibility</p>
          {['desktop', 'tablet', 'mobile'].map((device) => (
            <label key={device} className="field-row checkbox-row">
              <input
                type="checkbox"
                checked={node.visibility[device]}
                onChange={(e) =>
                  updateNodeVisibility(node.id, {[device]: e.target.checked})
                }
              />
              <span>Show on {device}</span>
            </label>
          ))}
        </div>
      )}
    </aside>
  );
}

function FieldList({fields, values, onChange}) {
  if (!fields.length) return <p className="field-hint">No settings for this element.</p>;
  return (
    <div className="field-list">
      {fields.map((field) => (
        <Field
          key={field.key}
          field={field}
          value={values[field.key]}
          onChange={(value) => onChange({[field.key]: value})}
        />
      ))}
    </div>
  );
}

function Field({field, value, onChange}) {
  const {key, label, type, options, placeholder} = field;

  if (type === 'faqItems') {
    const items = Array.isArray(value) ? value : [];
    const updateItem = (i, patch) =>
      onChange(items.map((item, idx) => (idx === i ? {...item, ...patch} : item)));
    const addItem = () => onChange([...items, {question: '', answer: ''}]);
    const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i));

    return (
      <div className="field-row faq-items-field">
        <span>{label}</span>
        {items.map((item, i) => (
          <fieldset key={i} className="faq-item-row">
            <input
              type="text"
              placeholder="Question"
              value={item.question || ''}
              onChange={(e) => updateItem(i, {question: e.target.value})}
            />
            <textarea
              rows={2}
              placeholder="Answer"
              value={item.answer || ''}
              onChange={(e) => updateItem(i, {answer: e.target.value})}
            />
            <button type="button" onClick={() => removeItem(i)}>
              Remove
            </button>
          </fieldset>
        ))}
        <button type="button" onClick={addItem}>
          + Add question
        </button>
      </div>
    );
  }

  if (type === 'comparisonRows') {
    const rows = Array.isArray(value) ? value : [];
    const updateRow = (i, patch) =>
      onChange(rows.map((row, idx) => (idx === i ? {...row, ...patch} : row)));
    const addRow = () => onChange([...rows, {label: '', valueA: '', valueB: ''}]);
    const removeRow = (i) => onChange(rows.filter((_, idx) => idx !== i));

    return (
      <div className="field-row comparison-rows-field">
        <span>{label}</span>
        {rows.map((row, i) => (
          <fieldset key={i} className="comparison-row">
            <input
              type="text"
              placeholder="Spec label (e.g. Price)"
              value={row.label || ''}
              onChange={(e) => updateRow(i, {label: e.target.value})}
            />
            <input
              type="text"
              placeholder="Column A value"
              value={row.valueA || ''}
              onChange={(e) => updateRow(i, {valueA: e.target.value})}
            />
            <input
              type="text"
              placeholder="Column B value"
              value={row.valueB || ''}
              onChange={(e) => updateRow(i, {valueB: e.target.value})}
            />
            <button type="button" onClick={() => removeRow(i)}>
              Remove
            </button>
          </fieldset>
        ))}
        <button type="button" onClick={addRow}>
          + Add row
        </button>
      </div>
    );
  }

  if (type === 'checkbox') {
    return (
      <label className="field-row checkbox-row">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        <span>{label}</span>
      </label>
    );
  }

  if (type === 'select') {
    return (
      <label className="field-row">
        <span>{label}</span>
        <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (type === 'textarea') {
    return (
      <label className="field-row">
        <span>{label}</span>
        <textarea
          rows={6}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  }

  if (type === 'number') {
    return (
      <label className="field-row">
        <span>{label}</span>
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </label>
    );
  }

  if (type === 'color') {
    return (
      <label className="field-row">
        <span>{label}</span>
        <input type="color" value={value || '#ffffff'} onChange={(e) => onChange(e.target.value)} />
      </label>
    );
  }

  // default: text
  return (
    <label className="field-row">
      <span>{label}</span>
      <input
        type="text"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
