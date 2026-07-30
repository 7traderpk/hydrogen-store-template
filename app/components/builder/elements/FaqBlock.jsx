import {visibilityClass} from './visibility';
import {JsonLd} from '~/components/seo/JsonLd';
import {faqPage} from '~/lib/seo/schema/faqPage';

/**
 * Literal <h3>/<p> pairs, not an accordion behind JS - AEO requires crawlers
 * and LLM scrapers (which don't execute JS) to be able to read Q&A content
 * directly. The FAQPage JSON-LD is built from the same `items` prop used for
 * the visible markup, co-located here so schema can never drift from what's
 * actually on the page.
 */
export function FaqBlock({node}) {
  const {props, style, visibility} = node;
  const items = (props.items || []).filter((item) => item?.question && item?.answer);
  const schema = faqPage(items);

  if (!items.length) return null;

  return (
    <section
      className={`pb-faq ${style.customClass || ''} ${visibilityClass(visibility)}`.trim()}
    >
      {schema && <JsonLd data={schema} />}
      {props.heading && <h2 className="pb-faq-heading">{props.heading}</h2>}
      {items.map((item, i) => (
        <div className="pb-faq-item" key={i}>
          <h3>{item.question}</h3>
          <p>{item.answer}</p>
        </div>
      ))}
    </section>
  );
}
