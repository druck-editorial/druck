import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const FONTS_DIR = join(import.meta.dirname, '../public/fonts');
const STYLES_DIR = join(import.meta.dirname, '../src/styles');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36';

const CORE_FAMILIES = 'plus-jakarta-sans:800|source-serif-4:400,400i,600';
const THEME_FAMILIES = 'archivo-black:400|bodoni-moda:600,700|space-grotesk:500,700|ibm-plex-mono:400';

const GENERAL_SANS_FACES = `
@font-face {
  font-family: 'General Sans';
  src: url('/fonts/GeneralSans-Variable.woff2') format('woff2');
  font-weight: 200 700;
  font-display: swap;
}
@font-face {
  font-family: 'gs-fallback';
  src: local('Arial');
  font-display: swap;
  size-adjust: 100%;
  ascent-override: 96%;
  descent-override: 24%;
  line-gap-override: 0%;
}
`;

const FALLBACK_METRICS = `
@font-face {
  font-family: 'pjs-fallback';
  src: local('Arial Bold');
  font-display: swap;
  size-adjust: 103%;
  ascent-override: 97%;
  descent-override: 25%;
  line-gap-override: 0%;
}
@font-face {
  font-family: 'ss4-fallback';
  src: local('Georgia');
  font-display: swap;
  size-adjust: 99%;
  ascent-override: 92%;
  descent-override: 26%;
  line-gap-override: 0%;
}
`;

async function fetchCss(families) {
  const res = await fetch(`https://fonts.bunny.net/css?family=${families}&display=swap`, {
    headers: { 'user-agent': UA },
  });
  if (!res.ok) throw new Error(`bunny css ${res.status} for ${families}`);
  return res.text();
}

async function localizeCss(css) {
  const urls = [...new Set([...css.matchAll(/url\(['"]?(https:[^'")]+\.woff2)['"]?\)/g)].map((m) => m[1]))];
  const urlToName = new Map();
  for (const url of urls) {
    const basename = url.split('/').pop();
    let name = basename;
    if ([...urlToName.values()].includes(name)) {
      const pathParts = url.split('/');
      const familySegment = pathParts[pathParts.length - 2] ?? 'font';
      name = `${familySegment}-${basename}`;
    }
    urlToName.set(url, name);
  }
  let out = css;
  for (const [url, name] of urlToName) {
    if (!existsSync(join(FONTS_DIR, name))) {
      const file = await fetch(url, { headers: { 'user-agent': UA } });
      if (!file.ok) throw new Error(`font download ${file.status}: ${url}`);
      writeFileSync(join(FONTS_DIR, name), Buffer.from(await file.arrayBuffer()));
    }
    out = out.replaceAll(url, `/fonts/${name}`);
  }
  out = out.replace(/,\s*url\(https:[^)]+\.woff\)[^;]*/g, '');
  out = out.replace(/ +$/gm, '');
  return out;
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n{3,}/g, '\n\n');
}

mkdirSync(FONTS_DIR, { recursive: true });
const coreCss = stripComments(await localizeCss(await fetchCss(CORE_FAMILIES)));
const themeCss = stripComments(await localizeCss(await fetchCss(THEME_FAMILIES)));
writeFileSync(join(STYLES_DIR, 'fonts.css'), coreCss + GENERAL_SANS_FACES + FALLBACK_METRICS);
writeFileSync(join(STYLES_DIR, 'fonts-themes.css'), themeCss);
const count = [...coreCss.matchAll(/\/fonts\//g)].length + [...themeCss.matchAll(/\/fonts\//g)].length;
console.log(`fonts written: ${count} files referenced`);
