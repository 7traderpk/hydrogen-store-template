// Small text helpers shared by the metadata builder and JSON-LD schema
// builders (app/lib/seo/metadata.js, app/lib/seo/schema/*.js). Isomorphic -
// no `.server` suffix, since both meta() and route components run on the
// client during navigations, not just on the initial SSR pass.

export function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncate(str, max) {
  if (!str) return str;
  const clean = str.trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + '…';
}

export function wordCount(html) {
  const text = stripHtml(html);
  return text ? text.split(' ').filter(Boolean).length : 0;
}

/**
 * First sentence of already-stripped plain text, capped at maxLen - used
 * for AEO "direct answer" opening blocks (see products.$handle.jsx,
 * blogs.$blogHandle.$articleHandle.jsx). Falls back to a plain truncate if
 * no sentence boundary is found within a reasonable window.
 */
export function firstSentence(text, maxLen = 200) {
  if (!text) return '';
  const match = text.match(/^.*?[.!?](?:\s|$)/);
  const sentence = match ? match[0].trim() : text;
  return truncate(sentence, maxLen);
}

export function estimateReadingTime(html, wpm = 200) {
  const words = wordCount(html);
  return Math.max(1, Math.round(words / wpm));
}
