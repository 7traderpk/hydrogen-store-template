import {componentRegistry} from './componentRegistry';

/**
 * Recursively renders a page-builder layout tree. `productsByNodeId` is a
 * {nodeId: Product[]} map the route loader batch-resolved server-side for
 * every ProductGrid node - see app/routes/pages.$handle.jsx.
 *
 * @param {{node: object; productsByNodeId?: Record<string, any[]>}}
 */
export function ElementRenderer({node, productsByNodeId = {}}) {
  const Component = componentRegistry[node.type];
  if (!Component) return null;

  const children = node.children?.length
    ? node.children.map((child) => (
        <ElementRenderer key={child.id} node={child} productsByNodeId={productsByNodeId} />
      ))
    : null;

  const extraProps =
    node.type === 'ProductGrid' ? {products: productsByNodeId[node.id] || []} : {};

  return (
    <Component node={node} {...extraProps}>
      {children}
    </Component>
  );
}
