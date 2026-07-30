import {JsonLd} from '~/components/seo/JsonLd';
import {faqPage} from '~/lib/seo/schema/faqPage';

/**
 * Server-rendered FAQ section for native Product/Article pages (not an
 * accordion - no client JS, so crawlers and answer engines see the full Q&A
 * text in the initial HTML). Sourced from the `custom.faqs` metafield
 * (`[{"question": "...", "answer": "..."}]`). Complements the page-builder
 * `FaqBlock` element, which covers page-builder-authored pages instead -
 * this is the equivalent for native Shopify Product/Article content, which
 * FaqBlock has no reach into.
 *
 * @param {{items: Array<{question: string, answer: string}> | null | undefined; heading?: string}}
 */
export function Faq({items, heading = 'Frequently Asked Questions'}) {
  const valid = Array.isArray(items)
    ? items.filter((item) => item?.question && item?.answer)
    : [];
  if (!valid.length) return null;

  return (
    <section className="pb-faq">
      <h2 className="pb-faq-heading">{heading}</h2>
      {valid.map((item, i) => (
        <div className="pb-faq-item" key={i}>
          <h3>{item.question}</h3>
          {item.answer.split(/\n\s*\n/).map((paragraph, pIndex) => (
            <p key={pIndex}>{paragraph.trim()}</p>
          ))}
        </div>
      ))}
      <JsonLd data={faqPage(valid)} />
    </section>
  );
}
