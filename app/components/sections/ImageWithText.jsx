import {Image} from '@shopify/hydrogen';

/**
 * Alternating image/text feature block, equivalent to Dawn's
 * `image-with-text.liquid` / `multicolumn.liquid` sections.
 * @param {{
 *   heading: string;
 *   items: Array<{
 *     image?: {url: string; altText?: string | null} | null;
 *     title: string;
 *     text: string;
 *   }>;
 * }}
 */
export function ImageWithText({heading, items}) {
  return (
    <section className="image-with-text" aria-labelledby="image-with-text-heading">
      <h2 id="image-with-text-heading">{heading}</h2>
      <div className="image-with-text-grid">
        {items.map((item) => (
          <div className="image-with-text-item" key={item.title}>
            {item.image && (
              <Image
                data={item.image}
                alt={item.image.altText || item.title}
                width={40}
                height={40}
              />
            )}
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
