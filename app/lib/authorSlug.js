/**
 * Normalizes an article author's display name into a stable URL slug -
 * needed because this store's real author bylines have inconsistent
 * casing for the same person ("Irfan Ahmad" / "IRFAN AHMAD" / "irfan ahmad"
 * all appear on real articles). Grouping by this slug (rather than the raw
 * name) treats them correctly as one person instead of three.
 */
export function authorSlug(name) {
  return (name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
