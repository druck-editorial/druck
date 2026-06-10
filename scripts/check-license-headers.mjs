#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>

import { readFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const root = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();

const tracked = execSync('git ls-files', { cwd: root, encoding: 'utf8' })
  .trim()
  .split('\n');

const inScope = tracked.filter((f) => {
  if (f.includes('/dist/')) return false;
  if (f.endsWith('.json') || f.endsWith('.md')) return false;
  if (f.endsWith('.ts') || f.endsWith('.mjs') || f.endsWith('.css') || f.endsWith('.html')) {
    return /^packages\/|^apps\/|^scripts\//.test(f);
  }
  return false;
});

const tsPattern = /^\/\/ SPDX-License-Identifier: MIT\r?\n\/\/ Copyright \(c\) 2026 Artem Iagovdik <artyom\.yagovdik@gmail\.com>/;
const cssPattern = /^\/\* SPDX-License-Identifier: MIT \| Copyright \(c\) 2026 Artem Iagovdik <artyom\.yagovdik@gmail\.com> \*\//;
const htmlPattern = /^<!-- SPDX-License-Identifier: MIT \| Copyright \(c\) 2026 Artem Iagovdik <artyom\.yagovdik@gmail\.com> -->/;

const failures = [];

for (const rel of inScope) {
  const raw = await readFile(join(root, rel), 'utf8');
  const content = raw.startsWith('#!') ? raw.slice(raw.indexOf('\n') + 1) : raw;
  let ok = false;
  if (rel.endsWith('.css')) ok = cssPattern.test(content);
  else if (rel.endsWith('.html')) ok = htmlPattern.test(content);
  else ok = tsPattern.test(content);
  if (!ok) failures.push(rel);
}

if (failures.length) {
  console.error(`License header check failed: ${failures.length} file(s) missing SPDX header`);
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}

console.log(`License header check passed: ${inScope.length} file(s)`);
