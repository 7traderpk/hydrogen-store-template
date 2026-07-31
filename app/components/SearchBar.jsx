import {useEffect, useId, useRef, useState} from 'react';
import {Form, useSearchParams} from 'react-router';

/**
 * Amazon-style search bar: a category dropdown fused with a text input and
 * submit button. Submits to `/search?q=...&category=...`, matching the
 * `/search` route's existing param convention (see app/routes/search.jsx).
 * @param {{
 *   categories: Array<{label: string; value: string}>;
 * }}
 */
export function SearchBar({categories}) {
  const [searchParams] = useSearchParams();
  const [term, setTerm] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState(
    searchParams.get('category') ?? categories[0]?.value ?? 'all',
  );
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const listboxId = useId();

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const selected =
    categories.find((option) => option.value === category) ?? categories[0];

  return (
    <div className="search-bar" ref={rootRef}>
      <Form
        method="get"
        action="/search"
        className="search-bar-form"
        role="search"
      >
        <div className="search-bar-category">
          <button
            type="button"
            className="search-bar-category-toggle"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            onClick={() => setIsOpen((open) => !open)}
          >
            {selected?.label ?? 'All'}
            <span aria-hidden="true" className="search-bar-caret">
              ▾
            </span>
          </button>
          {isOpen && (
            <ul
              className="search-bar-dropdown"
              role="listbox"
              id={listboxId}
              tabIndex={-1}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setIsOpen(false);
              }}
            >
              {categories.map((option) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === category}
                >
                  <button
                    type="button"
                    className="search-bar-option"
                    onClick={() => {
                      setCategory(option.value);
                      setIsOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {category !== 'all' && (
          <input type="hidden" name="category" value={category} />
        )}
        <input
          className="search-bar-input"
          type="search"
          name="q"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
        />
        <button type="submit" className="search-bar-submit" aria-label="Search">
          🔍
        </button>
      </Form>
    </div>
  );
}
