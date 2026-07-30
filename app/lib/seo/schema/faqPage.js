/**
 * @param {Array<{question: string; answer: string}>} items
 * @returns {object|null} null if there's nothing valid to render - callers
 *   should skip the <JsonLd> for this schema entirely in that case.
 */
export function faqPage(items) {
  const valid = (items || []).filter((item) => item?.question && item?.answer);
  if (!valid.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: valid.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {'@type': 'Answer', text: item.answer},
    })),
  };
}
