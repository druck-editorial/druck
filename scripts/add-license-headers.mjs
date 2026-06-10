#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>

import { readFile, writeFile } from 'node:fs/promises';
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

const tsHeader = `// SPDX-License-Identifier: MIT\n// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>\n`;
const cssHeader = `/* SPDX-License-Identifier: MIT | Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com> */\n`;
const htmlHeader = `<!-- SPDX-License-Identifier: MIT | Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com> -->\n`;

function headerFor(path) {
  if (path.endsWith('.css')) return cssHeader;
  if (path.endsWith('.html')) return htmlHeader;
  return tsHeader;
}

async function processFile(rel) {
  const abs = join(root, rel);
  const content = await readFile(abs, 'utf8');
  if (content.includes('SPDX-License-Identifier')) return { rel, status: 'already' };

  const header = headerFor(rel);
  let newContent;
  if (rel.endsWith('.html')) {
    newContent = content.replace(/^/, header);
  } else {
    newContent = header + content;
  }

  await writeFile(abs, newContent, 'utf8');
  return { rel, status: 'added' };
}

const results = await Promise.all(inScope.map(processFile));
const added = results.filter((r) => r.status === 'added');
const already = results.filter((r) => r.status === 'already');

console.log(`Added headers to ${added.length} files.`);
if (already.length) console.log(`Skipped ${already.length} files that already had headers.`);
if (added.length) {
  console.log('Files updated:');
  for (const r of added) console.log('  ' + r.rel);
}
