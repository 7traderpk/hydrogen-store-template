/**
 * AEO: a short, self-contained lead paragraph that directly answers the
 * page's core question, written so AI answer engines can lift it verbatim.
 * Sourced from the `custom.short_answer` metafield when the merchant has set
 * one; callers fall back to an auto-generated first-sentence extract when
 * absent (see products.$handle.jsx / blogs.$blogHandle.$articleHandle.jsx).
 *
 * @param {{text: string | null | undefined}}
 */
export function DirectAnswer({text}) {
  if (!text) return null;
  return <p className="pb-direct-answer">{text}</p>;
}
