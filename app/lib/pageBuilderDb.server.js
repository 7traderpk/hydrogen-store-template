// Page-builder storage - SQLite file on a mounted Docker volume (see
// docker-compose.yml's `pagebuilder-data` volume at /app/data), NOT a
// Shopify metafield. This mirrors the storage decision made for the
// standalone version of this tool: layout JSON lives on this VPS, only
// ProductGrid's live product data comes from Shopify (via the Storefront
// API, in pages.$handle.jsx).
//
// Uses Node's built-in `node:sqlite` (experimental, Node 22+) to avoid any
// native-module compilation step in the Docker build - same rationale as
// choosing bcryptjs (pure JS) over native bcrypt elsewhere in this app.

import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';

const DB_PATH = process.env.PAGEBUILDER_DB_PATH || '/app/data/pagebuilder.sqlite';
mkdirSync(dirname(DB_PATH), {recursive: true});

const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    handle TEXT UNIQUE NOT NULL,
    seo TEXT NOT NULL DEFAULT '{}',
    draft_tree TEXT NOT NULL DEFAULT '[]',
    published_version_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS versions (
    id TEXT PRIMARY KEY,
    page_id TEXT NOT NULL,
    tree TEXT NOT NULL,
    seo TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (page_id) REFERENCES pages(id)
  );
`);

function rowToPage(row, publishedVersion) {
  if (!row) return null;
  return {
    id: row.id,
    handle: row.handle,
    seo: JSON.parse(row.seo),
    draftTree: JSON.parse(row.draft_tree),
    publishedVersionId: row.published_version_id,
    publishedTree: publishedVersion ? JSON.parse(publishedVersion.tree) : null,
    publishedSeo: publishedVersion ? JSON.parse(publishedVersion.seo) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getPageRow(handle) {
  return db.prepare('SELECT * FROM pages WHERE handle = ?').get(handle);
}

function getVersionRow(id) {
  return db.prepare('SELECT * FROM versions WHERE id = ?').get(id);
}

export function listPages() {
  const rows = db
    .prepare(
      'SELECT id, handle, published_version_id, updated_at FROM pages ORDER BY updated_at DESC',
    )
    .all();
  return rows.map((row) => ({
    id: row.id,
    handle: row.handle,
    isPublished: Boolean(row.published_version_id),
    updatedAt: row.updated_at,
  }));
}

export function createPage(handle, seo) {
  const existing = getPageRow(handle);
  if (existing) {
    throw new Error(`A page with handle "${handle}" already exists`);
  }
  const id = randomUUID();
  db.prepare(
    'INSERT INTO pages (id, handle, seo, draft_tree) VALUES (?, ?, ?, ?)',
  ).run(id, handle, JSON.stringify(seo || {}), JSON.stringify([]));
  return rowToPage(getPageRow(handle));
}

export function getPage(handle) {
  const row = getPageRow(handle);
  if (!row) return null;
  const publishedVersion = row.published_version_id
    ? getVersionRow(row.published_version_id)
    : null;
  return rowToPage(row, publishedVersion);
}

export function saveDraft(handle, tree, seo) {
  const row = getPageRow(handle);
  if (!row) return null;
  db.prepare(
    `UPDATE pages SET draft_tree = ?, seo = ?, updated_at = datetime('now') WHERE handle = ?`,
  ).run(JSON.stringify(tree ?? []), JSON.stringify(seo ?? {}), handle);
  return getPage(handle);
}

export function publishPage(handle) {
  const row = getPageRow(handle);
  if (!row) return null;
  const versionId = randomUUID();
  db.prepare(
    'INSERT INTO versions (id, page_id, tree, seo) VALUES (?, ?, ?, ?)',
  ).run(versionId, row.id, row.draft_tree, row.seo);
  db.prepare(
    `UPDATE pages SET published_version_id = ?, updated_at = datetime('now') WHERE handle = ?`,
  ).run(versionId, handle);
  return getPage(handle);
}

export function listVersions(handle) {
  const row = getPageRow(handle);
  if (!row) return [];
  const versions = db
    .prepare(
      'SELECT id, created_at FROM versions WHERE page_id = ? ORDER BY created_at DESC',
    )
    .all(row.id);
  return versions.map((v) => ({
    id: v.id,
    createdAt: v.created_at,
    isCurrent: v.id === row.published_version_id,
  }));
}

/**
 * Rollback re-publishes an old version's content as a brand new version
 * (rather than rewriting history) - keeps the version log append-only.
 */
export function rollbackToVersion(handle, versionId) {
  const row = getPageRow(handle);
  if (!row) return null;
  const version = getVersionRow(versionId);
  if (!version || version.page_id !== row.id) return null;

  const newVersionId = randomUUID();
  db.prepare(
    'INSERT INTO versions (id, page_id, tree, seo) VALUES (?, ?, ?, ?)',
  ).run(newVersionId, row.id, version.tree, version.seo);
  db.prepare(
    `UPDATE pages SET draft_tree = ?, seo = ?, published_version_id = ?, updated_at = datetime('now') WHERE handle = ?`,
  ).run(version.tree, version.seo, newVersionId, handle);
  return getPage(handle);
}

export function deletePage(handle) {
  const row = getPageRow(handle);
  if (!row) return;
  db.prepare('DELETE FROM versions WHERE page_id = ?').run(row.id);
  db.prepare('DELETE FROM pages WHERE id = ?').run(row.id);
}

/**
 * Public read used by the storefront route (pages.$handle.jsx) - only ever
 * returns the *published* snapshot, never the draft.
 */
export function getPublished(handle) {
  const row = getPageRow(handle);
  if (!row || !row.published_version_id) return null;
  const version = getVersionRow(row.published_version_id);
  if (!version) return null;
  return {
    handle: row.handle,
    seo: JSON.parse(version.seo),
    tree: JSON.parse(version.tree),
  };
}
