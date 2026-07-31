// Wishlist storage - SQLite file on the same mounted Docker volume as the
// page builder (see pageBuilderDb.server.js / docker-compose.yml's
// `pagebuilder-data` volume), keyed by the Shopify Customer Account API
// customer id. Not a Shopify metafield - mirrors the storage decision
// already made for the page builder, and keeps wishlist writes independent
// of Customer Account API metafield read/write permissions.

import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';

const DB_PATH =
  process.env.PAGEBUILDER_DB_PATH || '/app/data/pagebuilder.sqlite';
mkdirSync(dirname(DB_PATH), {recursive: true});

const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS wishlist_items (
    customer_id TEXT NOT NULL,
    product_handle TEXT NOT NULL,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (customer_id, product_handle)
  );
`);

export function isInWishlist(customerId, handle) {
  if (!customerId || !handle) return false;
  const row = db
    .prepare(
      'SELECT 1 FROM wishlist_items WHERE customer_id = ? AND product_handle = ?',
    )
    .get(customerId, handle);
  return Boolean(row);
}

export function addToWishlist(customerId, handle) {
  db.prepare(
    'INSERT OR IGNORE INTO wishlist_items (customer_id, product_handle) VALUES (?, ?)',
  ).run(customerId, handle);
}

export function removeFromWishlist(customerId, handle) {
  db.prepare(
    'DELETE FROM wishlist_items WHERE customer_id = ? AND product_handle = ?',
  ).run(customerId, handle);
}

/** @returns {boolean} the new membership state after toggling */
export function toggleWishlist(customerId, handle) {
  if (isInWishlist(customerId, handle)) {
    removeFromWishlist(customerId, handle);
    return false;
  }
  addToWishlist(customerId, handle);
  return true;
}

export function listWishlistHandles(customerId) {
  if (!customerId) return [];
  const rows = db
    .prepare(
      "SELECT product_handle FROM wishlist_items WHERE customer_id = ? ORDER BY added_at DESC",
    )
    .all(customerId);
  return rows.map((row) => row.product_handle);
}
