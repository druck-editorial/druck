// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(import.meta.dirname, '..', 'dist');

function normalizeBase(raw) {
  if (!raw || raw === '/') return '/';
  let base = raw.startsWith('/') ? raw : `/${raw}`;
  if (!base.endsWith('/')) base += '/';
  return base;
}

const BASE = normalizeBase(process.env.DRUCK_BASE);
if (BASE === '/') process.exit(0);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const segments = readdirSync(DIST)
  .map((name) => escapeRe(name))
  .sort((a, b) => b.length - a.length)
  .join('|');

const markupRe = new RegExp(`(["'(])/(${segments})(?=[/"')])`, 'g');
const rootRe = /(["'])\/(?=["'])/g;
const scriptRe = new RegExp(`(["'])/(${segments})(?=[/"'])`, 'g');

const ASSET_SEGMENTS = ['img', 'fonts', 'assets', 'sample-data'].filter((name) => existsSync(join(DIST, name)));
const jsonRe = new RegExp(`(")/(${ASSET_SEGMENTS.map(escapeRe).join('|')})(?=/)`, 'g');

function rewriteMarkup(content) {
  return content.replace(markupRe, (_m, delim, seg) => `${delim}${BASE}${seg}`).replace(rootRe, (_m, delim) => `${delim}${BASE}`);
}

function rewriteScript(content) {
  return content.replace(scriptRe, (_m, delim, seg) => `${delim}${BASE}${seg}`);
}

function rewriteJson(content) {
  return content.replace(jsonRe, (_m, delim, seg) => `${delim}${BASE}${seg}`);
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    const rewrite = /\.(html|css)$/.test(entry) ? rewriteMarkup : /\.js$/.test(entry) ? rewriteScript : /\.json$/.test(entry) ? rewriteJson : null;
    if (!rewrite) continue;
    const before = readFileSync(full, 'utf8');
    const after = rewrite(before);
    if (after !== before) writeFileSync(full, after);
  }
}

walk(DIST);
console.log(`apply-base: rewrote dist asset paths under ${BASE}`);
