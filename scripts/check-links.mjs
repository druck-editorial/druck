import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = join(import.meta.dirname, '../apps/druck-app/dist');
const PAGES = ['index.html', 'articles/quiet-revolution-small-language-models/index.html'];
const FETCH_OPTS = { redirect: 'follow', signal: AbortSignal.timeout(8000) };

async function checkExternal(href) {
  const res = await fetch(href, { ...FETCH_OPTS, method: 'HEAD' });
  if (res.ok) return null;
  if (res.status === 405 && (await fetch(href, FETCH_OPTS)).ok) return null;
  return `HTTP ${res.status}`;
}

async function checkLink(pagePath, href) {
  if (href.startsWith('http')) {
    try {
      const problem = await checkExternal(href);
      return problem ? `${pagePath}: ${href} -> ${problem}` : null;
    } catch (error) {
      return `${pagePath}: ${href} -> ${error.message}`;
    }
  }
  const clean = href.split('?')[0].replace(/\/$/, '/index.html').replace(/^\//, '');
  try {
    await access(join(DIST, clean));
    return null;
  } catch {
    return `${pagePath}: ${href} -> missing in dist`;
  }
}

const checks = [];
for (const pagePath of PAGES) {
  const html = await readFile(join(DIST, pagePath), 'utf8');
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replaceAll('&amp;', '&'));
  for (const href of new Set(hrefs)) {
    if (href.startsWith('mailto:') || href.startsWith('#')) continue;
    checks.push(checkLink(pagePath, href));
  }
}

const failures = (await Promise.all(checks)).filter(Boolean);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('check-links: all links resolve');
