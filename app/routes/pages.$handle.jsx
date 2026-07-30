import {useLoaderData} from 'react-router';
import {getPublished} from '~/lib/pageBuilderDb.server';
import {ElementRenderer} from '~/components/builder/ElementRenderer';
import {buildMeta, SITE_URL} from '~/lib/seo/metadata';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  if (!data) return buildMeta({title: 'Page not found', robots: 'noindex,nofollow'});
  const {seo, handle} = data;
  return buildMeta({
    title: seo?.title || 'Digilog',
    description: seo?.description,
    url: `${SITE_URL}/pages/${handle}`,
    // Bare brand-name fallback (no page title set) would double up with the
    // suffix ("Digilog | Digilog") - only suffix when there's a real title.
    titleSuffix: Boolean(seo?.title),
  });
};

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader({params, context}) {
  const {handle} = params;
  const layout = getPublished(handle);
  if (!layout) {
    throw new Response('Not found', {status: 404});
  }

  const productsByNodeId = await resolveProductGridData(layout.tree, context);

  return {handle: layout.handle, seo: layout.seo, tree: layout.tree, productsByNodeId};
}

/**
 * Walks the tree for every ProductGrid node and batch-resolves its
 * collection's products via the Storefront API in parallel - keeps the
 * page fully server-rendered with no client-side data waterfall.
 */
async function resolveProductGridData(tree, context) {
  const productGridNodes = [];
  const visit = (nodes) => {
    for (const node of nodes || []) {
      if (node.type === 'ProductGrid' && node.props?.collectionHandle) {
        productGridNodes.push(node);
      }
      if (node.children?.length) visit(node.children);
    }
  };
  visit(tree);

  if (!productGridNodes.length) return {};

  const results = await Promise.all(
    productGridNodes.map((node) =>
      context.storefront
        .query(PAGE_BUILDER_COLLECTION_PRODUCTS_QUERY, {
          variables: {
            handle: node.props.collectionHandle,
            first: Math.max(1, Math.min(24, node.props.limit || 8)),
          },
        })
        .then((data) => data?.collection?.products?.nodes || [])
        .catch((error) => {
          console.error(
            `Failed to load collection "${node.props.collectionHandle}" for ProductGrid node ${node.id}:`,
            error,
          );
          return [];
        }),
    ),
  );

  return Object.fromEntries(productGridNodes.map((node, i) => [node.id, results[i]]));
}

export default function BuilderPage() {
  /** @type {LoaderReturnData} */
  const {tree, productsByNodeId} = useLoaderData();

  return (
    <div className="pb-page">
      {tree.map((node) => (
        <ElementRenderer key={node.id} node={node} productsByNodeId={productsByNodeId} />
      ))}
    </div>
  );
}

const PAGE_BUILDER_COLLECTION_PRODUCTS_QUERY = `#graphql
  query PageBuilderCollectionProducts(
    $handle: String!
    $first: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: $first) {
        nodes {
          id
          title
          handle
          featuredImage {
            id
            url
            altText
            width
            height
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

/** @typedef {import('./+types/pages.$handle').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
