/**
 * @param {Array<{url: string; name: string; image?: string}>} items - order preserved as-is
 */
export function itemList(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: item.url,
      name: item.name,
      ...(item.image ? {image: item.image} : {}),
    })),
  };
}
