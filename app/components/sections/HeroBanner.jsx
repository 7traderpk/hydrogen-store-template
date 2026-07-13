import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';

/**
 * Full-width hero banner, equivalent to Dawn's `image-banner.liquid` section.
 * Content is authored as props here rather than through a theme customizer,
 * since Hydrogen has no built-in section/block editor.
 * @param {{
 *   image?: {url: string; altText?: string | null; width?: number | null; height?: number | null} | null;
 *   heading: string;
 *   subheading?: string;
 *   buttonText?: string;
 *   buttonLink?: string;
 * }}
 */
export function HeroBanner({image, heading, subheading, buttonText, buttonLink}) {
  return (
    <section className="hero-banner">
      {image && (
        <Image
          className="hero-banner-image"
          data={image}
          sizes="100vw"
          alt={image.altText || heading}
        />
      )}
      <div className="hero-banner-overlay" />
      <div className="hero-banner-content">
        <h1>{heading}</h1>
        {subheading && <p>{subheading}</p>}
        {buttonText &&
          buttonLink &&
          (buttonLink.startsWith('#') ? (
            <a className="btn hero-banner-button" href={buttonLink}>
              {buttonText}
            </a>
          ) : (
            <Link className="btn hero-banner-button" to={buttonLink}>
              {buttonText}
            </Link>
          ))}
      </div>
    </section>
  );
}
