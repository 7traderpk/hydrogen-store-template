import {Link} from 'react-router';
import {urlWithTrackingParams} from '~/lib/search';

/**
 * @param {Omit<SearchResultsProps, 'error' | 'type'>}
 */
export function SearchResults({term, result, children}) {
  if (!result?.total) {
    return null;
  }

  return children({...result.items, term});
}

SearchResults.Articles = SearchResultsArticles;
SearchResults.Pages = SearchResultsPages;
SearchResults.Empty = SearchResultsEmpty;

/**
 * @param {PartialSearchResult<'articles'>}
 */
function SearchResultsArticles({term, articles}) {
  if (!articles?.nodes.length) {
    return null;
  }

  return (
    <div className="google-result-group">
      {articles?.nodes?.map((article) => {
        const articleUrl = urlWithTrackingParams({
          baseUrl: `/blogs/${article.handle}`,
          trackingParams: article.trackingParameters,
          term,
        });

        return (
          <div className="google-result" key={article.id}>
            <div className="google-result-url">
              lite.digilog.pk › blogs › {article.handle}
            </div>
            <Link
              className="google-result-title"
              prefetch="intent"
              to={articleUrl}
            >
              {article.title}
            </Link>
          </div>
        );
      })}
    </div>
  );
}

/**
 * @param {PartialSearchResult<'pages'>}
 */
function SearchResultsPages({term, pages}) {
  if (!pages?.nodes.length) {
    return null;
  }

  return (
    <div className="google-result-group">
      {pages?.nodes?.map((page) => {
        const pageUrl = urlWithTrackingParams({
          baseUrl: `/pages/${page.handle}`,
          trackingParams: page.trackingParameters,
          term,
        });

        return (
          <div className="google-result" key={page.id}>
            <div className="google-result-url">
              lite.digilog.pk › pages › {page.handle}
            </div>
            <Link
              className="google-result-title"
              prefetch="intent"
              to={pageUrl}
            >
              {page.title}
            </Link>
          </div>
        );
      })}
    </div>
  );
}

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
