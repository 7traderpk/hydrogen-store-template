import {visibilityClass} from './visibility';

/**
 * Real <table> markup, not a styled-div grid - AI engines favor tabular
 * data for "X vs Y" queries (per the AEO spec), and schema.org has no
 * comparison-table type, so there's no paired JSON-LD here.
 */
export function ComparisonTable({node}) {
  const {props, style, visibility} = node;
  const rows = (props.rows || []).filter((row) => row?.label);

  if (!rows.length) return null;

  return (
    <table
      className={`pb-comparison-table ${style.customClass || ''} ${visibilityClass(visibility)}`.trim()}
    >
      {props.heading && <caption>{props.heading}</caption>}
      <thead>
        <tr>
          <th scope="col"></th>
          <th scope="col">{props.columnALabel || 'Column A'}</th>
          <th scope="col">{props.columnBLabel || 'Column B'}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            <th scope="row">{row.label}</th>
            <td>{row.valueA}</td>
            <td>{row.valueB}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
