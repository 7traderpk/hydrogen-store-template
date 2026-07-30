/**
 * E-E-A-T author box for blog articles - sourced from the article's
 * `custom.author_bio` metafield (`{"name": "...", "bio": "..."}`, or a plain
 * string). Explicitly skipped in an earlier pass for lack of a data source;
 * a metafield the merchant fills in themselves is a real one, so this
 * renders only when they've actually set it - never a generic/fabricated bio.
 *
 * @param {{bio: {name?: string, bio?: string} | string | null | undefined; fallbackName?: string}}
 */
export function AuthorBio({bio, fallbackName}) {
  if (!bio) return null;
  const name = (typeof bio === 'object' ? bio.name : null) || fallbackName;
  const text = typeof bio === 'object' ? bio.bio : bio;
  if (!text) return null;

  return (
    <aside className="author-bio">
      {name && <p className="author-bio-name">About {name}</p>}
      <p>{text}</p>
    </aside>
  );
}
