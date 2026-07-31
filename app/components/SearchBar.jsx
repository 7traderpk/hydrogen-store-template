import {useState} from 'react';
import {Form, useSearchParams} from 'react-router';

/**
 * Search bar: a category select fused with a text input and submit button.
 * Submits to `/search?q=...&category=...`, matching the `/search` route's
 * existing param convention (see app/routes/search.jsx).
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

  return (
    <Form method="get" action="/search" className="search-bar" role="search">
      <select
        className="search-bar__select"
        name="category"
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        aria-label="Search category"
      >
        {categories.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="search-bar__divider" aria-hidden="true" />
      <input
        className="search-bar__input"
        type="search"
        name="q"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Search products…"
        aria-label="Search products"
      />
      <button type="submit" className="search-bar__submit" aria-label="Search">
        <svg
          width="18"
          height="18"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
        </svg>
      </button>
    </Form>
  );
}
