import {useState, useEffect} from 'react';
import {Image} from '@shopify/hydrogen';

/**
 * @param {{
 *   images: Array<{id: string; url: string; altText: string | null; width: number; height: number}>;
 *   selectedImage?: {id: string} | null;
 *   productTitle?: string;
 * }}
 */
export function ProductGallery({images, selectedImage, productTitle}) {
  const allImages = images?.length ? images : selectedImage ? [selectedImage] : [];
  const [activeId, setActiveId] = useState(selectedImage?.id || allImages[0]?.id);

  // Follow the selected variant's image (e.g. picking a color swatch), but
  // still let the shopper browse other angles via thumbnails afterward.
  useEffect(() => {
    if (selectedImage?.id) setActiveId(selectedImage.id);
  }, [selectedImage?.id]);

  const activeImage =
    allImages.find((img) => img.id === activeId) || allImages[0];

  if (!activeImage) {
    return <div className="product-gallery product-gallery-empty" />;
  }

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        <Image
          alt={activeImage.altText || productTitle || 'Product Image'}
          aspectRatio="1/1"
          data={activeImage}
          key={activeImage.id}
          sizes="(min-width: 45em) 50vw, 100vw"
        />
      </div>
      {allImages.length > 1 && (
        <div className="product-gallery-thumbs">
          {allImages.map((img) => (
            <button
              key={img.id}
              type="button"
              className={`product-gallery-thumb${
                img.id === activeImage.id ? ' active' : ''
              }`}
              onClick={() => setActiveId(img.id)}
              aria-label={img.altText || `${productTitle || 'Product'} thumbnail`}
              aria-current={img.id === activeImage.id}
            >
              <Image
                alt={img.altText || `${productTitle || 'Product'} thumbnail`}
                aspectRatio="1/1"
                data={img}
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
