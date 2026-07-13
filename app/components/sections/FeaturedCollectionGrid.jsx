import {Link} from 'react-router';
import {ProductItem} from '~/components/ProductItem';

/**
 * Product grid section, equivalent to Dawn's `featured-collection.liquid`
 * section (heading + "View all" + product grid). Takes a plain product list
 * rather than a Shopify collection object, so it works regardless of whether
 * the store's collections are populated.
 * @param {{
 *   title: string;
 *   viewAllLink?: string;
 *   products: Array<import('storefrontapi.generated').ProductItemFragment>;
 * }}
 */
export function FeaturedCollectionGrid({title, viewAllLink, products}) {
  if (!products?.length) return null;

  return (
    <section className="featured-collection-grid" aria-labelledby="featured-collection-heading">
      <div className="featured-collection-grid-header">
        <h2 id="featured-collection-heading">{title}</h2>
        {viewAllLink && <Link to={viewAllLink}>View all &rarr;</Link>}
      </div>
      <div className="recommended-products-grid">
        {products.map((product) => (
          <ProductItem key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
