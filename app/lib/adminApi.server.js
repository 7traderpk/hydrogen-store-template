// Server-side-only helper for writing the design config back to Shopify via
// the Admin API. Never import this from a component that could render in
// the browser - SHOPIFY_ADMIN_API_TOKEN must stay server-side.

/**
 * @param {{
 *   storeDomain: string;
 *   adminApiToken: string;
 *   shopGid: string;
 *   config: object;
 * }}
 */
export async function saveDesignConfig({storeDomain, adminApiToken, shopGid, config}) {
  const response = await fetch(
    `https://${storeDomain}/admin/api/2026-01/graphql.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': adminApiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Deliberately NOT tagged with a `#graphql` comment - this is an
        // Admin API mutation (metafieldsSet), but Hydrogen's build-time
        // codegen scans every `#graphql`-tagged template literal in the
        // project and validates it against the Storefront API schema,
        // where this mutation doesn't exist and the build would fail.
        query: `
          mutation SetDesignConfig($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              metafields { id }
              userErrors { field message }
            }
          }
        `,
        variables: {
          metafields: [
            {
              ownerId: shopGid,
              namespace: 'lite_storefront',
              key: 'design_config',
              type: 'json',
              value: JSON.stringify(config),
            },
          ],
        },
      }),
    },
  );

  const json = await response.json();
  const userErrors = json?.data?.metafieldsSet?.userErrors;
  if (userErrors?.length) {
    throw new Error(userErrors.map((e) => e.message).join(', '));
  }
  if (json.errors) {
    throw new Error(json.errors.map((e) => e.message).join(', '));
  }
  return json?.data?.metafieldsSet?.metafields?.[0];
}
