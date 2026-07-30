import {ProductItem} from '~/components/ProductItem';
import {visibilityClass} from './visibility';

/**
 * Products are pre-fetched server-side by the pages.$handle.jsx loader
 * (one batched Storefront API query per ProductGrid node in the tree) and
 * threaded down through ElementRenderer as `productsByNodeId` - this
 * component never fetches on its own, so the whole page stays server-
 * rendered with no client-side data waterfall.
 */
export function ProductGrid({node, products}) {
  const {style, visibility} = node;
  const columnsDesktop = style.columnsDesktop || 4;
  const columnsMobile = style.columnsMobile || 2;

  if (!products?.length) {
    return (
      <div className={`pb-product-grid-empty ${visibilityClass(visibility)}`.trim()}>
        No products found for collection "{node.props.collectionHandle}".
      </div>
    );
  }

  return (
    <div
      className={`pb-product-grid ${style.customClass || ''} ${visibilityClass(visibility)}`.trim()}
      style={{
        '--pb-columns-desktop': columnsDesktop,
        '--pb-columns-mobile': columnsMobile,
      }}
    >
      {products.map((product) => (
        <ProductItem key={product.id} product={product} />
      ))}
    </div>
  );
}
