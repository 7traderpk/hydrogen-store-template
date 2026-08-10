/**
 * @param {Omit<SearchResultsProps, 'error' | 'type'>}
 */
export function SearchResults({term, result, children}) {
  if (!result?.total) {
    return null;
  }

  return children({...result.items, term});
}

SearchResults.Empty = SearchResultsEmpty;

function SearchResultsEmpty({term}) {
  return (
    <div className="google-results-column">
      <p className="google-no-results">
        {term ? (
          <>
            Your search - <strong>{term}</strong> - did not match any
            products.
          </>
        ) : (
          'Enter a search term above to find products.'
        )}
      </p>
      {term && (
        <>
          <ul className="google-no-results-tips">
            <li>Make sure all words are spelled correctly.</li>
            <li>Try different or more general keywords.</li>
            <li>Try fewer keywords.</li>
          </ul>
          <a className="btn google-no-results-browse" href="/collections">
            Browse all products
          </a>
        </>
      )}
    </div>
  );
}

/** @typedef {RegularSearchReturn['result']['items']} SearchItems */
/**
 * @typedef {Pick<
 *   SearchItems,
 *   ItemType
 * > &
 *   Pick<RegularSearchReturn, 'term'>} PartialSearchResult
 * @template {keyof SearchItems} ItemType
 */
/**
 * @typedef {RegularSearchReturn & {
 *   children: (args: SearchItems & {term: string}) => React.ReactNode;
 * }} SearchResultsProps
 */

/** @typedef {import('~/lib/search').RegularSearchReturn} RegularSearchReturn */
