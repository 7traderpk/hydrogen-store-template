import {useState, useMemo, useEffect} from 'react';
import {Link, useNavigate} from 'react-router';
import {Money} from '@shopify/hydrogen';
import {
  toggleFilterParam,
  setPriceFilterParam,
  clearAllFiltersParam,
} from '~/lib/searchFilters';

const VISIBLE_VALUES_LIMIT = 8;

/**
 * Renders whatever facets the Storefront API returns for the current
 * search (`search.productFilters`) - nothing about the filter groups is
 * hardcoded, so this works for any store's actual filterable
 * attributes (product type, vendor, tags, variant options like color/size
 * if the catalog has them, custom metafields, etc.) with no per-store code.
 *
 * @param {{
 *   filters: Array<{id: string; label: string; type: string; values: Array<{id: string; label: string; count: number; input: string; swatch?: {color?: string|null; image?: {previewImage?: {url: string}}|null}|null}>}>;
 *   searchParams: URLSearchParams;
 *   currencyCode?: string;
 *   isOpen: boolean;
 *   onClose: () => void;
 * }}
 */
export function FilterSidebar({filters, searchParams, currencyCode, isOpen, onClose}) {
  const navigate = useNavigate();
  const activeInputs = useMemo(
    () => new Set(searchParams.getAll('filter')),
    [searchParams],
  );
  const activeCount = activeInputs.size;

  // Build a lookup so the "active filter chips" row can show a readable
  // label for each selected value without re-deriving it from raw JSON.
  const labelByInput = useMemo(() => {
    const map = new Map();
    for (const filter of filters) {
      if (filter.type === 'PRICE_RANGE') continue;
      for (const value of filter.values) {
        map.set(value.input, {groupLabel: filter.label, valueLabel: value.label});
      }
    }
    return map;
  }, [filters]);

  const priceFilterRaw = [...activeInputs].find((input) => {
    try {
      return 'price' in JSON.parse(input);
    } catch {
      return false;
    }
  });
  const activePrice = priceFilterRaw ? JSON.parse(priceFilterRaw).price : null;

  function go(nextParams) {
    navigate(`?${nextParams.toString()}`, {preventScrollReset: true});
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="filter-drawer-backdrop"
          aria-label="Close filters"
          onClick={onClose}
        />
      )}
      <aside
        className={`filter-sidebar${isOpen ? ' filter-sidebar-open' : ''}`}
        aria-label="Filters"
      >
        <div className="filter-sidebar-header">
          <h2>Filters</h2>
          <button
            type="button"
            className="filter-sidebar-close"
            onClick={onClose}
            aria-label="Close filters"
          >
            ×
          </button>
        </div>

        {activeCount > 0 && (
          <div className="filter-chips">
            {[...activeInputs].map((input) => {
              const isPrice = input === priceFilterRaw;
              const label = isPrice
                ? `${activePrice.min ?? 0} - ${activePrice.max ?? '∞'}`
                : labelByInput.get(input)?.valueLabel || 'Filter';
              return (
                <button
                  key={input}
                  type="button"
                  className="filter-chip"
                  onClick={() => go(toggleFilterParam(searchParams, input))}
                >
                  {label} <span aria-hidden="true">×</span>
                </button>
              );
            })}
            <button
              type="button"
              className="filter-chip filter-chip-clear"
              onClick={() => go(clearAllFiltersParam(searchParams))}
            >
              Clear all
            </button>
          </div>
        )}

        <div className="filter-groups">
          {filters.map((filter) =>
            filter.type === 'PRICE_RANGE' ? (
              <PriceFilterGroup
                key={filter.id}
                filter={filter}
                activePrice={activePrice}
                currencyCode={currencyCode}
                onApply={(range) => go(setPriceFilterParam(searchParams, range))}
              />
            ) : (
              <ListFilterGroup
                key={filter.id}
                filter={filter}
                activeInputs={activeInputs}
                onToggle={(input) => go(toggleFilterParam(searchParams, input))}
              />
            ),
          )}
        </div>
      </aside>
    </>
  );
}

function ListFilterGroup({filter, activeInputs, onToggle}) {
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState('');

  const hasSwatches = filter.values.some((v) => v.swatch?.color || v.swatch?.image);
  const isSearchable = filter.values.length > VISIBLE_VALUES_LIMIT;

  const matching = query
    ? filter.values.filter((v) =>
        v.label.toLowerCase().includes(query.toLowerCase()),
      )
    : filter.values;
  const visible = showAll ? matching : matching.slice(0, VISIBLE_VALUES_LIMIT);

  return (
    <div className="filter-group">
      <button
        type="button"
        className="filter-group-header"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <span>{filter.label}</span>
        <span className="filter-group-chevron" aria-hidden="true">
          {expanded ? '−' : '+'}
        </span>
      </button>
      {expanded && (
        <div className="filter-group-body">
          {isSearchable && (
            <input
              type="text"
              className="filter-group-search"
              placeholder={`Search ${filter.label.toLowerCase()}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
          {hasSwatches ? (
            <div className="filter-swatch-grid">
              {visible.map((value) => (
                <button
                  key={value.id}
                  type="button"
                  className={`filter-swatch${
                    activeInputs.has(value.input) ? ' active' : ''
                  }${value.count === 0 ? ' zero-count' : ''}`}
                  style={{
                    backgroundColor: value.swatch?.color || undefined,
                    backgroundImage: value.swatch?.image?.previewImage?.url
                      ? `url(${value.swatch.image.previewImage.url})`
                      : undefined,
                  }}
                  title={`${value.label} (${value.count})`}
                  aria-label={value.label}
                  aria-pressed={activeInputs.has(value.input)}
                  onClick={() => onToggle(value.input)}
                />
              ))}
            </div>
          ) : (
            <ul className="filter-value-list">
              {visible.map((value) => (
                <li key={value.id}>
                  <label
                    className={value.count === 0 ? 'zero-count' : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={activeInputs.has(value.input)}
                      onChange={() => onToggle(value.input)}
                    />
                    <span className="filter-value-label">{value.label}</span>
                    <span className="filter-value-count">({value.count})</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {!showAll && matching.length > VISIBLE_VALUES_LIMIT && (
            <button
              type="button"
              className="filter-group-show-more"
              onClick={() => setShowAll(true)}
            >
              Show {matching.length - VISIBLE_VALUES_LIMIT} more
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PriceFilterGroup({filter, activePrice, currencyCode, onApply}) {
  const [expanded, setExpanded] = useState(true);
  const bounds = useMemo(() => {
    try {
      return JSON.parse(filter.values[0]?.input)?.price || {min: 0, max: 0};
    } catch {
      return {min: 0, max: 0};
    }
  }, [filter.values]);

  const [min, setMin] = useState(activePrice?.min ?? bounds.min);
  const [max, setMax] = useState(activePrice?.max ?? bounds.max);

  // Debounce applying the range to the URL/refetch while the shopper is
  // still typing or dragging.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (min !== (activePrice?.min ?? bounds.min) || max !== (activePrice?.max ?? bounds.max)) {
        onApply({min: Number(min), max: Number(max)});
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max]);

  return (
    <div className="filter-group">
      <button
        type="button"
        className="filter-group-header"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <span>{filter.label}</span>
        <span className="filter-group-chevron" aria-hidden="true">
          {expanded ? '−' : '+'}
        </span>
      </button>
      {expanded && (
        <div className="filter-group-body">
          <div className="price-range-slider">
            <input
              type="range"
              min={bounds.min}
              max={bounds.max}
              value={min}
              onChange={(e) => setMin(Math.min(Number(e.target.value), max))}
            />
            <input
              type="range"
              min={bounds.min}
              max={bounds.max}
              value={max}
              onChange={(e) => setMax(Math.max(Number(e.target.value), min))}
            />
          </div>
          <div className="price-range-inputs">
            <label>
              <span>Min</span>
              <input
                type="number"
                min={bounds.min}
                max={max}
                value={min}
                onChange={(e) => setMin(Number(e.target.value) || 0)}
              />
            </label>
            <span className="price-range-sep">–</span>
            <label>
              <span>Max</span>
              <input
                type="number"
                min={min}
                max={bounds.max}
                value={max}
                onChange={(e) => setMax(Number(e.target.value) || bounds.max)}
              />
            </label>
          </div>
          <p className="price-range-bounds">
            {currencyCode ? (
              <>
                <Money data={{amount: String(bounds.min), currencyCode}} /> –{' '}
                <Money data={{amount: String(bounds.max), currencyCode}} />
              </>
            ) : (
              `${bounds.min} - ${bounds.max}`
            )}
          </p>
        </div>
      )}
    </div>
  );
}
