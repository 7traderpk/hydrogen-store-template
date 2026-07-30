#!/usr/bin/env node
/**
 * Lighthouse pass against key storefront pages with CWV budgets
 * (lighthouse-budget.json). Prints performance score + LCP/CLS/TBT per page.
 *
 * Skips cleanly (exit 0) when Chrome or lighthouse isn't available in this
 * environment — run `npx lighthouse <url> --budget-path=lighthouse-budget.json`
 * in CI instead (see docs/seo.md).
 */
import {execFileSync, spawnSync} from 'node:child_process';

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');

function which(binary) {
  const result = spawnSync('which', [binary], {encoding: 'utf8'});
  return result.status === 0 ? result.stdout.trim() : null;
}

const chrome = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']
  .map(which)
  .find(Boolean);

let lighthouseAvailable = false;
if (chrome) {
  const probe = spawnSync('npx', ['--no-install', 'lighthouse', '--version'], {
    encoding: 'utf8',
    stdio: 'pipe',
    shell: true,
  });
  lighthouseAvailable = probe.status === 0;
}

if (!chrome || !lighthouseAvailable) {
  console.log(
    'SKIP: Chrome/lighthouse not available here - run `npx lighthouse <url> --budget-path=lighthouse-budget.json` in CI (see docs/seo.md).',
  );
  process.exit(0);
}

// Discover one product page for a representative PDP measurement.
let productPath = null;
try {
  const res = await fetch(`${BASE}/collections/all`);
  const html = await res.text();
  productPath = html.match(/href="(\/products\/[^"?#/]+)"/)?.[1] ?? null;
} catch {
  /* non-fatal */
}

const paths = ['/', '/collections/all', productPath].filter(Boolean);
let failed = false;

for (const path of paths) {
  const url = `${BASE}${path}`;
  const out = `./lighthouse-report${path.replace(/\//g, '_')}.json`;
  const result = spawnSync(
    'npx',
    [
      '--no-install',
      'lighthouse',
      url,
      '--budget-path=lighthouse-budget.json',
      '--output=json',
      `--output-path=${out}`,
      '--chrome-flags=--headless --no-sandbox',
      '--quiet',
    ],
    {encoding: 'utf8', shell: true, env: {...process.env, CHROME_PATH: chrome}},
  );
  if (result.status !== 0) {
    failed = true;
    console.log(`FAIL ${url}\n${result.stderr?.slice(-500)}`);
    continue;
  }
  try {
    const report = JSON.parse(
      execFileSync('cat', [out], {encoding: 'utf8'}),
    );
    const {audits, categories} = report;
    console.log(
      `${url}\n  performance: ${Math.round(
        (categories.performance.score ?? 0) * 100,
      )}  LCP: ${audits['largest-contentful-paint']?.displayValue}  CLS: ${
        audits['cumulative-layout-shift']?.displayValue
      }  TBT: ${audits['total-blocking-time']?.displayValue}`,
    );
  } catch (err) {
    failed = true;
    console.log(`FAIL ${url} — could not parse report: ${err.message}`);
  }
}

process.exit(failed ? 1 : 0);
