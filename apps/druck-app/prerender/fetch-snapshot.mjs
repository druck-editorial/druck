// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SNAPSHOT_PATH = join(import.meta.dirname, '../public/sample-data/sonto-snapshot.json');
const LIVE_URL = 'https://sonto.tech/data/druck-feed.json';
const MIN_ITEMS = 6;

try {
  const res = await fetch(LIVE_URL, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const items = await res.json();
  if (!Array.isArray(items) || items.length < MIN_ITEMS) {
    throw new Error(`unexpected payload: ${Array.isArray(items) ? items.length : typeof items} items`);
  }
  await writeFile(SNAPSHOT_PATH, JSON.stringify(items));
  console.log(`[snapshot] refreshed from live feed: ${items.length} items`);
} catch (error) {
  console.warn(`[snapshot] keeping committed snapshot (${error.message})`);
}
