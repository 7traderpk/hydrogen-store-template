import {useState} from 'react';
import {useNavigate} from 'react-router';
import {SORT_OPTIONS, setSortParam, setViewParam} from '~/lib/searchFilters';

/**
 * @param {{
 *   searchParams: URLSearchParams;
 *   sort: {value: string; label: string};
 *   view: number;
 *   onOpenFilters: () => void;
 *   activeFilterCount: number;
 * }}
 */
export function SearchToolbar({searchParams, sort, view, onOpenFilters, activeFilterCount}) {
  const navigate = useNavigate();
  const [sortOpen, setSortOpen] = useState(false);

  function go(nextParams) {
    navigate(`?${nextParams.toString()}`, {preventScrollReset: true});
  }

  return (
    <div className="search-toolbar">
      <button
        type="button"
        className="toolbar-filters-btn"
        onClick={onOpenFilters}
      >
        Filters
        {activeFilterCount > 0 && (
          <span className="toolbar-filters-count">{activeFilterCount}</span>
        )}
      </button>

      <div className="toolbar-right">
        <div className="toolbar-view-toggle" role="group" aria-label="Grid density">
          {[2, 3, 4].map((cols) => (
            <button
              key={cols}
              type="button"
              className={`toolbar-view-btn${view === cols ? ' active' : ''}`}
              aria-pressed={view === cols}
              aria-label={`${cols} columns`}
              onClick={() => go(setViewParam(searchParams, cols))}
            >
              {cols}
            </button>
          ))}
        </div>

        <div className="toolbar-sort">
          <button
            type="button"
            className="toolbar-sort-btn"
            onClick={() => setSortOpen((o) => !o)}
            aria-expanded={sortOpen}
          >
            Sort: {sort.label} <span aria-hidden="true">▾</span>
          </button>
          {sortOpen && (
            <>
              <button
                type="button"
                className="toolbar-sort-backdrop"
                aria-label="Close sort menu"
                onClick={() => setSortOpen(false)}
              />
              <ul className="toolbar-sort-menu">
                {SORT_OPTIONS.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      className={option.value === sort.value ? 'active' : undefined}
                      onClick={() => {
                        setSortOpen(false);
                        go(setSortParam(searchParams, option.value));
                      }}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
