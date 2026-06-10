import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = join(import.meta.dirname, '../apps/druck-app/dist');
const PAGES = ['index.html', 'articles/quiet-revolution-small-language-models/index.html'];
const failures = [];

for (const pagePath of PAGES) {
  const html = await readFile(join(DIST, pagePath), 'utf8');
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  for (const href of new Set(hrefs)) {
    if (href.startsWith('mailto:') || href.startsWith('#')) continue;
    if (href.startsWith('http')) {
      try {
        const res = await fetch(href, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(8000) });
        const ok = res.ok || (res.status === 405 && (await fetch(href, { signal: AbortSignal.timeout(8000) })).ok);
        if (!ok) failures.push(`${pagePath}: ${href} -> HTTP ${res.status}`);
      } catch (error) {
        failures.push(`${pagePath}: ${href} -> ${error.message}`);
      }
    } else {
      const clean = href.split('?')[0].replace(/\/$/, '/index.html').replace(/^\//, '');
      try { await access(join(DIST, clean)); }
      catch { failures.push(`${pagePath}: ${href} -> missing in dist`); }
    }
  }
}

if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('check-links: all links resolve');
