# Druck Landing — The Transformation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the druck-app landing into a six-band live demonstration page (JSON-to-magazine hero, format triptych, language specimens, live article + analytics, four widget embed frames, Lighthouse/a11y colophon) that itself scores Lighthouse 100 in all four categories.

**Architecture:** Static-first. A Vite `transformIndexHtml` plugin runs `@druck-editorial/engine` over the fixtures at build and dev time, baking all article HTML into the page. Small vanilla TypeScript islands hydrate interactivity (sequence, switchers, surfaces, embeds, analytics). Preact is removed. Band-5 widgets and theme fonts lazy-load on approach.

**Tech Stack:** Vite 6, TypeScript, @druck-editorial/engine + @druck-editorial/widget + @druck-editorial/analytics (workspace), vitest + happy-dom (unit), @playwright/test + @axe-core/playwright (E2E/a11y), Lighthouse CLI (audit).

**Spec:** `docs/superpowers/specs/2026-06-09-druck-landing-transformation-design.md`

**Rules that bind every task:** no source comments, no emojis, immutability defaults, early returns, named constants, descriptive names, AAA tests with behavior-naming, files under 800 lines, every interactive element keyboard-reachable with visible focus, copyright `Artem Iagovdik <artyom.yagovdik@gmail.com>` in manifests/LICENSE/meta/footer only (never file-header comments).

---

## File structure

```
druck/
├── LICENSE                                      (create: MIT, Artem Iagovdik)
├── package.json                                 (modify: author)
├── apps/druck-app/
│   ├── package.json                             (modify: author, deps, scripts)
│   ├── index.html                               (rewrite: static six-band page + markers)
│   ├── vite.config.ts                           (modify: drop preact, add prerender plugin)
│   ├── tsconfig.json                            (modify: drop jsx options if present)
│   ├── playwright.config.ts                     (create)
│   ├── prerender/render-bands.mjs               (create: marker renderer, pure functions)
│   ├── prerender/render-bands.test.mjs          (create)
│   ├── scripts/fetch-fonts.mjs                  (create: one-shot font acquisition)
│   ├── scripts/audit.mjs                        (create: Lighthouse + budget gate)
│   ├── audit/                                   (created by audit.mjs; summary.json committed)
│   ├── public/
│   │   ├── fonts/*.woff2                        (create: self-hosted fonts)
│   │   ├── img/*.webp                           (create: heroes from Sonto archive)
│   │   ├── favicon.svg                          (create)
│   │   └── sample-data/                         (modify + create fixtures)
│   ├── src/
│   │   ├── main.ts                              (create; replaces main.tsx)
│   │   ├── App.tsx, main.tsx                    (delete)
│   │   ├── styles.css                           (prune dead demo styles)
│   │   ├── styles/fonts.css                     (create: core @font-face + fallback metrics)
│   │   ├── styles/fonts-themes.css              (create: band-5 theme fonts, lazy)
│   │   ├── styles/landing.css                   (create: bands, surfaces, frames, colophon)
│   │   ├── icons/*.svg                          (create: Phosphor light, inlined via ?raw)
│   │   └── islands/
│   │       ├── theme.ts  copy.ts  rail.ts       (create)
│   │       ├── sequence.ts  switcher.ts         (create)
│   │       ├── surfaces.ts  embeds.ts           (create)
│   │       ├── analyticsPanel.ts                (create)
│   │       └── *.test.ts                        (create: happy-dom unit tests)
│   └── tests/
│       ├── landing.spec.ts                      (create: behavioral E2E)
│       ├── a11y.spec.ts  keyboard.spec.ts       (create)
│       └── visual.spec.ts                       (create)
└── packages/
    ├── druck-engine/src/types.ts                (modify: hero alt + dimensions)
    ├── druck-engine/src/render.ts               (modify: emit hero attrs)
    ├── druck-engine/src/render.test.ts          (create)
    └── */package.json                           (modify: author)
```

Build order: engine → widget → app. Verification commands run from `/var/www/druck` unless stated.

---

### Task 1: Workspace hygiene — copyright, license, test infra, fixture guard

**Files:**
- Create: `LICENSE`
- Modify: `package.json`, `apps/druck-app/package.json`, `packages/druck-engine/package.json`, `packages/druck-css/package.json`, `packages/druck-widget/package.json`, `packages/druck-analytics/package.json`
- Create: `apps/druck-app/tests-unit/fixtures.test.ts`

- [ ] **Step 1: Create LICENSE**

```text
MIT License

Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: Add author + license to every package.json**

In each of the six package.json files add (root also gets `"license"`):

```json
"author": "Artem Iagovdik <artyom.yagovdik@gmail.com>",
"license": "MIT"
```

- [ ] **Step 3: Add unit-test infra to druck-app**

In `apps/druck-app/package.json` add devDependencies and scripts (keep existing entries):

```json
"scripts": {
  "dev": "vite",
  "build": "pnpm --filter @druck-editorial/engine build && pnpm --filter @druck-editorial/widget build && tsc && vite build",
  "preview": "vite preview --port 4173 --strictPort",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:coverage": "vitest run --coverage"
},
"devDependencies": {
  "@preact/preset-vite": "^2.10.0",
  "typescript": "^5.8.0",
  "vite": "^6.3.0",
  "vitest": "^3.2.0",
  "@vitest/coverage-v8": "^3.2.0",
  "happy-dom": "^17.0.0"
}
```

Then run: `pnpm install`
Expected: lockfile updates, no errors. (Preact packages are removed later in Task 8 together with the code that imports them.)

- [ ] **Step 4: Write the fixture-validity test (the test that would have caught the shipped parse bug)**

Create `apps/druck-app/tests-unit/fixtures.test.ts`:

```ts
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const FIXTURES_DIR = join(import.meta.dirname, '../public/sample-data');
const REQUIRED_ARTICLE_FIELDS = ['title', 'slug', 'format', 'category', 'heroImage'] as const;

const fixtureFiles = readdirSync(FIXTURES_DIR).filter((name) => name.endsWith('.json'));

describe('sample-data fixtures', () => {
  test('directory contains fixtures', () => {
    expect(fixtureFiles.length).toBeGreaterThan(0);
  });

  for (const name of fixtureFiles) {
    test(`${name} parses as JSON`, () => {
      const raw = readFileSync(join(FIXTURES_DIR, name), 'utf8');
      expect(() => JSON.parse(raw)).not.toThrow();
    });
  }

  for (const name of fixtureFiles.filter((n) => !n.startsWith('specimen.'))) {
    test(`${name} carries required article fields`, () => {
      const data = JSON.parse(readFileSync(join(FIXTURES_DIR, name), 'utf8'));
      for (const field of REQUIRED_ARTICLE_FIELDS) {
        expect(data[field], `${name} missing ${field}`).toBeTruthy();
      }
    });
  }
});
```

Add `"include": ["tests-unit/**/*.test.ts", "prerender/**/*.test.mjs", "src/**/*.test.ts"]` to a new `apps/druck-app/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests-unit/**/*.test.ts', 'prerender/**/*.test.mjs', 'src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/islands/**/*.ts', 'prerender/**/*.mjs'],
      thresholds: { lines: 80, functions: 80 },
    },
  },
});
```

- [ ] **Step 5: Run the test**

Run: `pnpm --filter @druck-editorial/app test`
Expected: PASS (feature.json and wire.json are currently valid; this is the regression net).

- [ ] **Step 6: Commit**

```bash
git add LICENSE package.json apps/druck-app/package.json apps/druck-app/vitest.config.ts apps/druck-app/tests-unit/fixtures.test.ts packages/*/package.json pnpm-lock.yaml
git commit -m "chore: add license, authorship, and fixture validity guard"
```

---

### Task 2: Assets — fonts, icons, favicon, hero images

**Files:**
- Create: `apps/druck-app/scripts/fetch-fonts.mjs`
- Create: `apps/druck-app/src/styles/fonts.css`, `apps/druck-app/src/styles/fonts-themes.css` (generated, then committed)
- Create: `apps/druck-app/public/fonts/*.woff2`, `apps/druck-app/public/img/*.webp`, `apps/druck-app/public/favicon.svg`, `apps/druck-app/src/icons/*.svg`

- [ ] **Step 1: Write the font acquisition script**

Create `apps/druck-app/scripts/fetch-fonts.mjs`. It downloads Bunny CSS per family, rewrites remote URLs to local files, downloads each woff2, and emits the two stylesheets. Core families go to `fonts.css`, band-5 theme families to `fonts-themes.css`.

```js
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const FONTS_DIR = join(import.meta.dirname, '../public/fonts');
const STYLES_DIR = join(import.meta.dirname, '../src/styles');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36';

const CORE_FAMILIES = 'plus-jakarta-sans:800|source-serif-4:400,400i,600';
const THEME_FAMILIES = 'archivo-black:400|bodoni-moda:600,700|space-grotesk:500,700|ibm-plex-mono:400';

const FALLBACK_METRICS = `
@font-face {
  font-family: 'pjs-fallback';
  src: local('Arial Bold');
  size-adjust: 103%;
  ascent-override: 97%;
  descent-override: 25%;
  line-gap-override: 0%;
}
@font-face {
  font-family: 'ss4-fallback';
  src: local('Georgia');
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
  const urls = [...css.matchAll(/url\((https:[^)]+\.woff2)\)/g)].map((m) => m[1]);
  let out = css;
  for (const url of urls) {
    const name = url.split('/').slice(-2).join('-');
    const file = await fetch(url, { headers: { 'user-agent': UA } });
    if (!file.ok) throw new Error(`font download ${file.status}: ${url}`);
    writeFileSync(join(FONTS_DIR, name), Buffer.from(await file.arrayBuffer()));
    out = out.replaceAll(url, `/fonts/${name}`);
  }
  return out;
}

mkdirSync(FONTS_DIR, { recursive: true });
const coreCss = await localizeCss(await fetchCss(CORE_FAMILIES));
const themeCss = await localizeCss(await fetchCss(THEME_FAMILIES));
writeFileSync(join(STYLES_DIR, 'fonts.css'), coreCss + FALLBACK_METRICS);
writeFileSync(join(STYLES_DIR, 'fonts-themes.css'), themeCss);
const count = [...coreCss.matchAll(/\/fonts\//g)].length + [...themeCss.matchAll(/\/fonts\//g)].length;
console.log(`fonts written: ${count} files referenced`);
```

- [ ] **Step 2: Run it, then fetch General Sans from Fontshare**

```bash
mkdir -p apps/druck-app/src/styles
node apps/druck-app/scripts/fetch-fonts.mjs
curl -sL 'https://api.fontshare.com/v2/fonts/download/general-sans' -o /tmp/gs.zip
unzip -o -j /tmp/gs.zip '*GeneralSans-Variable.woff2' -d apps/druck-app/public/fonts/
```

Expected: `fonts written: N files referenced` (N around 10-16 given Bunny subset splitting), and `GeneralSans-Variable.woff2` present. Then append to `src/styles/fonts.css`:

```css
@font-face {
  font-family: 'General Sans';
  src: url('/fonts/GeneralSans-Variable.woff2') format('woff2');
  font-weight: 200 700;
  font-display: swap;
}
@font-face {
  font-family: 'gs-fallback';
  src: local('Arial');
  size-adjust: 100%;
  ascent-override: 96%;
  descent-override: 24%;
  line-gap-override: 0%;
}
```

Verify every file is real woff2: `for f in apps/druck-app/public/fonts/*.woff2; do head -c4 "$f" | grep -q wOF2 || echo "BAD $f"; done`
Expected: no output.

- [ ] **Step 3: Download Phosphor light icons (MIT)**

```bash
mkdir -p apps/druck-app/src/icons
for icon in copy check arrow-counter-clockwise github-logo arrow-up-right sun moon paper-plane-tilt; do
  curl -fsSL "https://unpkg.com/@phosphor-icons/core@2/assets/light/${icon}-light.svg" \
    -o "apps/druck-app/src/icons/${icon}.svg" || echo "MISSING ${icon}"
done
ls apps/druck-app/src/icons/
```

Expected: eight svg files, no MISSING lines. These are inlined at build via Vite `?raw` imports and `aria-hidden` wrappers; they never load at runtime.

- [ ] **Step 4: Favicon**

Create `apps/druck-app/public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#18181b"/>
  <text x="32" y="46" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="40" fill="#f6f4f1">D<tspan fill="#b84a34">.</tspan></text>
</svg>
```

- [ ] **Step 5: Hero images from the Sonto archive**

```bash
SONTO=/var/www/sonto-news/cache/articles
DEST=apps/druck-app/public/img
mkdir -p $DEST
cp "$SONTO/nvidias-ising-models-put-quantum-hype-on-a-leash-hero.webp"       $DEST/slm-hero.webp
cp "$SONTO/zuckerberg-swaps-14000-humans-for-ai-hero.webp"                   $DEST/wire-hero.webp
cp "$SONTO/discords-media-proxy-flaw-proves-your-privacy-is-a-performance-hero.webp" $DEST/frame-music-hero.webp
cp "$SONTO/reed-hastings-exits-the-stage-as-mythos-enters-the-war-room-hero.webp"    $DEST/frame-fashion-hero.webp
cp "$SONTO/catls-new-lfp-battery-charges-10-98-in-under-7-minutes-hero.webp"         $DEST/frame-markets-hero.webp
/var/www/sonto-news/.venv/bin/python -c "
from PIL import Image
import glob
for f in sorted(glob.glob('apps/druck-app/public/img/*.webp')):
    print(f, Image.open(f).size)
"
```

Expected: five files, each prints dimensions (around 1920x1047). Record each printed width/height — Task 4 fixtures must carry exactly these numbers. Taste checkpoint: open the five images; if any reads wrong for its frame (music/fashion/markets), swap it for another archive hero of similar size and re-record dimensions.

- [ ] **Step 6: Commit**

```bash
git add apps/druck-app/scripts/fetch-fonts.mjs apps/druck-app/src/styles/fonts.css apps/druck-app/src/styles/fonts-themes.css apps/druck-app/public/fonts apps/druck-app/public/img apps/druck-app/public/favicon.svg apps/druck-app/src/icons
git commit -m "feat: self-host fonts, icons, favicon, and archive hero images"
```

---

### Task 3: Engine — hero alt text and dimensions

**Files:**
- Modify: `packages/druck-engine/src/types.ts:55` (after `heroImage`)
- Modify: `packages/druck-engine/src/render.ts:174` and `:201`
- Create: `packages/druck-engine/src/render.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/druck-engine/src/render.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { renderArticle } from './render.js';
import type { ArticleData } from './types.js';

function buildArticle(overrides: Partial<ArticleData> = {}): ArticleData {
  return {
    title: 'Test Story',
    subtitle: 'A subtitle',
    metaDescription: 'meta',
    slug: 'test-story',
    format: 'feature',
    category: 'ai',
    publishedAt: '2026-06-09',
    readingTime: '3 min read',
    heroImage: '/img/test.webp',
    chapters: [{ title: 'One', bodyHtml: '<p>Body</p>' }],
    ...overrides,
  };
}

describe('hero image attributes', () => {
  test('emits provided alt text and dimensions on feature heroes', () => {
    const html = renderArticle(
      buildArticle({ heroImageAlt: 'Abstract circuitry', heroImageWidth: 1920, heroImageHeight: 1047 })
    );
    expect(html).toContain('alt="Abstract circuitry"');
    expect(html).toContain('width="1920"');
    expect(html).toContain('height="1047"');
  });

  test('falls back to title alt and template dimensions when fields absent', () => {
    const html = renderArticle(buildArticle());
    expect(html).toContain('alt="Test Story"');
    expect(html).toContain('width="1920"');
    expect(html).toContain('height="1080"');
  });

  test('emits provided dimensions on wire heroes', () => {
    const html = renderArticle(
      buildArticle({ format: 'wire', bodyHtml: '<p>Wire body</p>', heroImageWidth: 1920, heroImageHeight: 1049 })
    );
    expect(html).toContain('width="1920"');
    expect(html).toContain('height="1049"');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @druck-editorial/engine test`
Expected: FAIL — first and third tests (no `heroImageAlt` handling, hardcoded dimensions).

- [ ] **Step 3: Implement**

In `types.ts`, after `heroImage: string;` add:

```ts
heroImageAlt?: string;
heroImageWidth?: number;
heroImageHeight?: number;
```

In `render.ts` replace the feature hero figure line (line 174) with:

```ts
`<figure class="article-hero-img"><img src="${escapeHtml(data.heroImage)}" alt="${escapeHtml(data.heroImageAlt ?? data.title)}" loading="eager" fetchpriority="high" width="${data.heroImageWidth ?? 1920}" height="${data.heroImageHeight ?? 1080}"></figure>` +
```

Replace the wire hero figure line (line 201) with:

```ts
`<figure class="post-simple-img"><img src="${escapeHtml(data.heroImage)}" alt="${escapeHtml(data.heroImageAlt ?? data.title)}" loading="eager" fetchpriority="high" decoding="async" width="${data.heroImageWidth ?? 1600}" height="${data.heroImageHeight ?? 900}"></figure>` +
```

- [ ] **Step 4: Run tests, rebuild dist**

```bash
pnpm --filter @druck-editorial/engine test
pnpm --filter @druck-editorial/engine build
```

Expected: PASS, clean tsc build.

- [ ] **Step 5: Commit**

```bash
git add packages/druck-engine/src/types.ts packages/druck-engine/src/render.ts packages/druck-engine/src/render.test.ts
git commit -m "feat: hero alt text and explicit dimensions in engine output"
```

---

### Task 4: Fixtures — local heroes, band-2 trio, frame stories, specimens

**Files:**
- Modify: `apps/druck-app/public/sample-data/feature.json`, `wire.json`
- Create in `apps/druck-app/public/sample-data/`: `slm-quick-take.json`, `slm-wire.json`, `frame-music.json`, `frame-fashion.json`, `frame-markets.json`, `specimen.en.json`, `specimen.de.json`, `specimen.fr.json`, `specimen.es.json`, `specimen.ja.json`

Use the dimensions recorded in Task 2 Step 5 wherever a width/height appears below (values shown assume 1920x1047; adjust to the printed numbers).

- [ ] **Step 1: Point existing fixtures at local heroes**

In `feature.json` replace the `heroImage` value and add the three new fields after it:

```json
"heroImage": "/img/slm-hero.webp",
"heroImageAlt": "Abstract render of dense circuitry resolving into a small bright core",
"heroImageWidth": 1920,
"heroImageHeight": 1047,
```

In `wire.json` likewise:

```json
"heroImage": "/img/wire-hero.webp",
"heroImageAlt": "Abstract render of parallel data streams in cool light",
"heroImageWidth": 1920,
"heroImageHeight": 1049,
```

- [ ] **Step 2: Band-2 companions — the same story as quick_take and wire**

Create `slm-quick-take.json`:

```json
{
  "title": "The Quiet Revolution in Small Language Models",
  "titleAccentWord": "Revolution",
  "subtitle": "As frontier models chase scale, a counter-movement builds production-grade AI that fits in a backpack",
  "metaDescription": "Small language models are taking over production workloads.",
  "slug": "quiet-revolution-slm-quick-take",
  "format": "quick_take",
  "category": "ai",
  "publishedAt": "2026-06-04",
  "readingTime": "2 min read",
  "heroImage": "/img/slm-hero.webp",
  "heroImageAlt": "Abstract render of dense circuitry resolving into a small bright core",
  "heroImageWidth": 1920,
  "heroImageHeight": 1047,
  "chapters": [
    {
      "title": "Small is the new production-grade",
      "titleAccentWord": "production-grade",
      "bodyHtml": "<p>While frontier labs race past the trillion-parameter mark, the models actually shipping inside products keep shrinking. Sub-10B models now handle classification, extraction, and routing for a fraction of the cost, and they run where the data lives.</p><aside data-stat=\"73%\">of surveyed production inference runs on models under 10B parameters</aside><p>The pattern is consistent: prototype on a frontier model, measure the task, then distill down until quality holds. Teams that skip the third step pay for capability they never invoke.</p>"
    }
  ],
  "keyPoints": [
    { "text": "Most production inference already runs on small models." },
    { "text": "Distillation after prototyping is the cost lever that matters." },
    { "text": "On-device deployment removes the data-residency objection entirely." }
  ]
}
```

Create `slm-wire.json`:

```json
{
  "title": "Small Language Models Take Over Production Workloads",
  "subtitle": "Sub-10B models now carry the bulk of shipped inference",
  "metaDescription": "Production inference is consolidating on small language models.",
  "slug": "quiet-revolution-slm-wire",
  "format": "wire",
  "category": "ai",
  "publishedAt": "2026-06-04",
  "readingTime": "1 min read",
  "heroImage": "/img/slm-hero.webp",
  "heroImageAlt": "Abstract render of dense circuitry resolving into a small bright core",
  "heroImageWidth": 1920,
  "heroImageHeight": 1047,
  "bodyHtml": "<p>Production AI workloads are consolidating on small language models, with sub-10B systems now handling the majority of shipped inference across classification, extraction, and routing tasks. Teams report cost reductions of an order of magnitude against frontier-model baselines with no measurable quality loss on scoped tasks.</p><p>The shift follows a now-standard pattern: prototype on the largest available model, define the task envelope, then distill until the quality curve breaks. Deployment increasingly lands on-device or in-VPC, removing the data-residency objections that stalled enterprise rollouts through 2024.</p>",
  "pullQuote": "Prototype big, measure the task, distill until quality breaks.",
  "whyItMatters": "The economics of shipped AI are being set by small models, not frontier ones, and pricing pressure flows downhill from there."
}
```

- [ ] **Step 3: Frame stories — music, fashion, markets**

Create `frame-music.json`:

```json
{
  "title": "Glass Anatomy Cuts to the Bone on Severance Songs",
  "titleAccentWord": "Severance",
  "subtitle": "The Rotterdam trio trades maximalism for negative space and finds its sharpest record yet",
  "metaDescription": "Review of Severance Songs by Glass Anatomy.",
  "slug": "glass-anatomy-severance-songs-review",
  "format": "quick_take",
  "category": "general",
  "publishedAt": "2026-06-06",
  "readingTime": "3 min read",
  "heroImage": "/img/frame-music-hero.webp",
  "heroImageAlt": "Moody abstract album artwork in deep red and black",
  "heroImageWidth": 1920,
  "heroImageHeight": 1047,
  "chapters": [
    {
      "title": "Less signal, more nerve",
      "bodyHtml": "<p>Where 2024's <em>Full Bloom Static</em> buried every hook under three synth layers, <em>Severance Songs</em> strips the band to drums, one detuned guitar, and Lena Vos's voice recorded so close you hear the room. The restraint reads as confidence, and the confidence is earned.</p><aside data-stat=\"8.4\">PHONOGRAPH rating</aside><p>The record's spine is sequencing: three ballads in the middle stretch that would sag on a lesser album instead build pressure for the title track's release. Nothing here begs for playlist placement, which is precisely why it will get it.</p>"
    }
  ],
  "keyPoints": [
    { "text": "Sparse arrangements foreground the strongest vocal work of the band's run." },
    { "text": "Mid-album ballad sequence is structural, not filler." },
    { "text": "Best entry point for new listeners despite being a fourth album." }
  ]
}
```

Create `frame-fashion.json`:

```json
{
  "title": "The Quiet Authority of the Uniform",
  "titleAccentWord": "Uniform",
  "subtitle": "Why the most photographed people of the season wear the same thing every day",
  "metaDescription": "The uniform dressing movement and what it signals.",
  "slug": "quiet-authority-of-the-uniform",
  "format": "quick_take",
  "category": "general",
  "publishedAt": "2026-06-02",
  "readingTime": "3 min read",
  "heroImage": "/img/frame-fashion-hero.webp",
  "heroImageAlt": "Editorial photograph of draped fabric in muted tones",
  "heroImageWidth": 1920,
  "heroImageHeight": 1047,
  "chapters": [
    {
      "title": "Repetition as signature",
      "bodyHtml": "<p>The uniform was workwear, then it was rebellion, and now it is the most legible status signal on the street: the person who has decided. A single silhouette, repeated daily, photographs like a logo and reads like a manifesto against the algorithmic churn of micro-trends.</p><blockquote data-source=\"Costume historian, Antwerp Academy\">A uniform is not the absence of choice. It is one choice, made permanently.</blockquote><p>The houses have noticed. This season's strongest collections were not collections at all but systems: five pieces, one palette, cut to be worn in any order and photographed from any angle.</p>"
    }
  ],
  "keyPoints": [
    { "text": "Uniform dressing reads as decision, not deprivation." },
    { "text": "Repetition photographs like identity and resists trend churn." },
    { "text": "Collections are becoming systems of interchangeable pieces." }
  ]
}
```

Create `frame-markets.json`:

```json
{
  "title": "Morning Brief: Bitcoin Holds the Line as ETF Flows Turn Positive",
  "subtitle": "Six straight days of inflows put the quarter back in the green",
  "metaDescription": "Daily crypto markets brief.",
  "slug": "morning-brief-btc-etf-flows",
  "format": "wire",
  "category": "business",
  "publishedAt": "2026-06-09",
  "readingTime": "1 min read",
  "heroImage": "/img/frame-markets-hero.webp",
  "heroImageAlt": "Abstract chart-like light trails over a dark field",
  "heroImageWidth": 1920,
  "heroImageHeight": 1047,
  "bodyHtml": "<p>Bitcoin spent the weekend defending the same shelf it has held for three weeks, and the patience is being paid: spot ETF flows turned positive for a sixth consecutive session, the longest streak of the quarter.</p><aside data-stat=\"$2.1B\">net ETF inflows over six sessions</aside><p>Derivatives desks read the move as positioning rather than conviction. Funding rates stay flat, open interest is climbing slowly, and the options surface prices the next month as the calmest since January. Calm, in this market, is usually the part to distrust.</p>",
  "pullQuote": "Calm, in this market, is usually the part to distrust.",
  "whyItMatters": "Sustained ETF inflows with flat funding is the setup that has preceded every durable leg up this cycle."
}
```

This fixture is demo content published from the fictional LEDGERLINE Telegram channel; the channel-post strip in Band 5 quotes its first lines.

- [ ] **Step 4: Specimens (own compact schema: lang, dir, headline, body, quote, rule, ruleLabel)**

Create `specimen.en.json`:

```json
{
  "lang": "en",
  "label": "English",
  "headline": "Typography Is the Voice of the Page",
  "body": "Good typesetting is invisible until you take it away. Hanging punctuation keeps the left edge optically straight, balanced wrapping stops headlines from stranding a single word, and the quotation marks curl the way metal type curled them.",
  "quote": "“The page speaks before a single word is read.”",
  "rule": "hanging-punctuation: first; text-wrap: balance;",
  "ruleLabel": "Hanging punctuation, balanced wrap"
}
```

Create `specimen.de.json`:

```json
{
  "lang": "de",
  "label": "Deutsch",
  "headline": "Die Sicherheitslückenausnutzung und andere Wortungeheuer",
  "body": "Deutsche Komposita wie Datenschutzgrundverordnung oder eben Sicherheitslückenausnutzung sprengen jede Spalte, wenn die Silbentrennung fehlt. Mit sauber eingestellter Trennung brechen sie dort, wo das Auge es erwartet, und der Blocksatz bleibt ruhig.",
  "quote": "„Ein Wort, das nicht brechen darf, bricht die Zeile.“",
  "rule": "hyphens: auto; hyphenate-limit-chars: 10 5 5;",
  "ruleLabel": "Auto-Silbentrennung für Komposita"
}
```

Create `specimen.fr.json`:

```json
{
  "lang": "fr",
  "label": "Français",
  "headline": "La typographie est la voix de la page",
  "body": "La tradition française exige une espace fine insécable à l’intérieur des guillemets et devant la ponctuation haute. Sans elle, le texte perd son rythme ; avec elle, chaque citation respire comme il se doit.",
  "quote": "« La page parle avant même qu’on la lise. »",
  "rule": "quotes: '« ' ' »'; hyphens: manual (headlines);",
  "ruleLabel": "Guillemets avec espace fine insécable"
}
```

Create `specimen.es.json`:

```json
{
  "lang": "es",
  "label": "Español",
  "headline": "La tipografía es la voz de la página",
  "body": "La RAE prefiere las comillas angulares para el primer nivel de cita, y el español pide un interlineado generoso: las ascendentes y los acentos necesitan aire. Un párrafo bien compuesto se reconoce antes de leerlo.",
  "quote": "«La página habla antes de que se lea una sola palabra».",
  "rule": "line-height: 1.78; quotes: '«' '»';",
  "ruleLabel": "Comillas angulares, interlineado 1,78"
}
```

Create `specimen.ja.json`:

```json
{
  "lang": "ja",
  "label": "日本語",
  "headline": "組版はページの声である",
  "body": "日本語の組版では禁則処理が命である。行頭に句読点が来てはならず、括弧の向きも乱れてはならない。イタリックの代わりに太字と色で強調するのが美しい。",
  "quote": "「読まれる前に、ページは語り始めている」",
  "rule": "word-break: keep-all; line-break: strict;",
  "ruleLabel": "禁則処理と字送り"
}
```

- [ ] **Step 5: Run the fixture tests**

Run: `pnpm --filter @druck-editorial/app test`
Expected: PASS — every new file parses, article fixtures carry required fields (specimen files are exempted by the filename filter).

- [ ] **Step 6: Commit**

```bash
git add apps/druck-app/public/sample-data
git commit -m "feat: local hero fixtures, band-2 format trio, frame stories, specimens"
```

---

### Task 5: Prerender module — pure renderers for every marker

**Files:**
- Create: `apps/druck-app/prerender/render-bands.mjs`
- Create: `apps/druck-app/prerender/render-bands.test.mjs`

- [ ] **Step 1: Write the failing tests**

Create `apps/druck-app/prerender/render-bands.test.mjs`:

```js
import { describe, expect, test } from 'vitest';
import { join } from 'node:path';
import {
  tokenizeJsonForPane,
  renderHeroMagazinePane,
  renderSpecimenPanel,
  buildLandingHtml,
} from './render-bands.mjs';

const FIXTURES_DIR = join(import.meta.dirname, '../public/sample-data');

describe('tokenizeJsonForPane', () => {
  test('wraps each line and tags top-level keys', () => {
    const html = tokenizeJsonForPane('{\n  "title": "Hello",\n  "category": "ai"\n}');
    expect(html).toContain('data-key="title"');
    expect(html).toContain('data-key="category"');
    expect(html).toContain('class="jl"');
  });

  test('escapes embedded markup', () => {
    const html = tokenizeJsonForPane('{\n  "bodyHtml": "<script>alert(1)</script>"\n}');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('renderHeroMagazinePane', () => {
  test('produces five stepped slots from article data', () => {
    const data = {
      title: 'A Story',
      titleAccentWord: 'Story',
      subtitle: 'Deck text',
      category: 'ai',
      format: 'feature',
      readingTime: '8 min read',
      heroImage: '/img/slm-hero.webp',
      heroImageAlt: 'alt',
      heroImageWidth: 1920,
      heroImageHeight: 1047,
      chapters: [{ title: 'One', bodyHtml: '<p>First chapter prose.</p>' }],
    };
    const html = renderHeroMagazinePane(data);
    for (const step of [1, 2, 3, 4, 5]) {
      expect(html).toContain(`data-step="${step}"`);
    }
    expect(html).toContain('accent-word');
    expect(html).toContain('width="1920"');
  });
});

describe('renderSpecimenPanel', () => {
  test('scopes language and shows the css rule', () => {
    const html = renderSpecimenPanel({
      lang: 'de',
      label: 'Deutsch',
      headline: 'Kopfzeile',
      body: 'Text',
      quote: 'Zitat',
      rule: 'hyphens: auto;',
      ruleLabel: 'Trennung',
    });
    expect(html).toContain('lang="de"');
    expect(html).toContain('hyphens: auto;');
  });
});

describe('buildLandingHtml', () => {
  test('replaces every marker against real fixtures', async () => {
    const template = [
      '<!--druck:hero-json-->',
      '<!--druck:hero-magazine-->',
      '<!--druck:format-panels-->',
      '<!--druck:specimens-->',
      '<!--druck:band4-article-->',
    ].join('\n');
    const html = await buildLandingHtml(template, FIXTURES_DIR);
    expect(html).not.toContain('<!--druck:');
    expect(html).toContain('article-shell');
    expect(html).toContain('specimen-panel');
  });

  test('throws on a missing fixture directory', async () => {
    await expect(buildLandingHtml('<!--druck:band4-article-->', '/nonexistent')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @druck-editorial/app test`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `render-bands.mjs`**

```js
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { renderArticle } from '@druck-editorial/engine';

const TOP_LEVEL_KEY_PATTERN = /^\s{2}"([a-zA-Z]+)"/;
const TOKEN_PATTERN = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+\.?\d*)|([{}\[\],:])/g;
const HERO_JSON_MAX_LINES = 22;
const FORMAT_SLUGS = ['feature', 'slm-quick-take', 'slm-wire'];
const SPECIMEN_LANGS = ['en', 'de', 'fr', 'es', 'ja'];

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function tokenizeLine(line) {
  return escapeHtml(line).replace(TOKEN_PATTERN, (match, str, colon, num, punct) => {
    if (str) return colon ? `<i class="jk">${str}</i>${colon}` : `<i class="js">${str}</i>`;
    if (num) return `<i class="jn">${num}</i>`;
    if (punct) return `<i class="jp">${punct}</i>`;
    return match;
  });
}

export function tokenizeJsonForPane(source) {
  const lines = source.split('\n').slice(0, HERO_JSON_MAX_LINES);
  return lines
    .map((line) => {
      const keyMatch = TOP_LEVEL_KEY_PATTERN.exec(line);
      const keyAttr = keyMatch ? ` data-key="${keyMatch[1]}"` : '';
      return `<span class="jl"${keyAttr}>${tokenizeLine(line)}</span>`;
    })
    .join('\n');
}

function titleWithAccent(title, accentWord) {
  const safe = escapeHtml(title);
  if (!accentWord) return safe;
  const safeWord = escapeHtml(accentWord);
  if (!safe.includes(safeWord)) return safe;
  return safe.replace(safeWord, `<em class="accent-word">${safeWord}</em>`);
}

function firstChapterExcerpt(data) {
  const body = data.chapters?.[0]?.bodyHtml ?? data.bodyHtml ?? '';
  const firstParagraph = /<p>.*?<\/p>/s.exec(body);
  return firstParagraph ? firstParagraph[0] : '';
}

export function renderHeroMagazinePane(data) {
  return (
    `<div class="hero-mag article-shell cat-${escapeHtml(data.category)}">` +
    `<div class="hx article-kicker" data-step="1">${escapeHtml(data.category)} <span class="sep">&middot;</span> ${data.format === 'feature' ? 'Feature' : ''}</div>` +
    `<h2 class="hx hero-mag-title" data-step="2">${titleWithAccent(data.title, data.titleAccentWord)}</h2>` +
    `<p class="hx article-deck" data-step="3">${escapeHtml(data.subtitle)}</p>` +
    `<figure class="hx hero-mag-img" data-step="4"><img src="${escapeHtml(data.heroImage)}" alt="${escapeHtml(data.heroImageAlt ?? data.title)}" width="${data.heroImageWidth ?? 1920}" height="${data.heroImageHeight ?? 1080}" loading="eager" fetchpriority="high"></figure>` +
    `<div class="hx hero-mag-body" data-step="5">${firstChapterExcerpt(data)}</div>` +
    '</div>'
  );
}

export function renderSpecimenPanel(specimen) {
  return (
    `<article class="specimen-panel" lang="${escapeHtml(specimen.lang)}" data-lang="${escapeHtml(specimen.lang)}" hidden>` +
    `<h3 class="specimen-headline">${escapeHtml(specimen.headline)}</h3>` +
    `<p class="specimen-body">${escapeHtml(specimen.body)}</p>` +
    `<blockquote class="specimen-quote">${escapeHtml(specimen.quote)}</blockquote>` +
    `<p class="specimen-rule-label">${escapeHtml(specimen.ruleLabel)}</p>` +
    `<code class="specimen-rule">${escapeHtml(specimen.rule)}</code>` +
    '</article>'
  );
}

async function readFixture(dir, name) {
  const raw = await readFile(join(dir, name), 'utf8');
  try {
    return { raw, data: JSON.parse(raw) };
  } catch (error) {
    throw new Error(`fixture ${name} is not valid JSON: ${error.message}`);
  }
}

function renderFormatPanel(slug, data, checked) {
  return (
    `<div class="format-panel" id="format-panel-${escapeHtml(data.format)}" data-format="${escapeHtml(data.format)}" role="tabpanel"${checked ? '' : ' hidden'}>` +
    renderArticle(data) +
    '</div>'
  );
}

export async function buildLandingHtml(template, fixturesDir) {
  const feature = await readFixture(fixturesDir, 'feature.json');

  const formatPanels = [];
  for (const [index, slug] of FORMAT_SLUGS.entries()) {
    const fixture = await readFixture(fixturesDir, `${slug}.json`);
    formatPanels.push(renderFormatPanel(slug, fixture.data, index === 0));
  }

  const specimens = [];
  for (const lang of SPECIMEN_LANGS) {
    const fixture = await readFixture(fixturesDir, `specimen.${lang}.json`);
    specimens.push(renderSpecimenPanel(fixture.data));
  }
  const specimensHtml = specimens.join('').replace('hidden>', '>');

  return template
    .replace('<!--druck:hero-json-->', tokenizeJsonForPane(feature.raw))
    .replace('<!--druck:hero-magazine-->', renderHeroMagazinePane(feature.data))
    .replace('<!--druck:format-panels-->', formatPanels.join(''))
    .replace('<!--druck:specimens-->', specimensHtml)
    .replace('<!--druck:band4-article-->', renderArticle(feature.data));
}
```

The single `.replace('hidden>', '>')` unhides exactly the first specimen (English) since `String.replace` without a global flag touches the first match only.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @druck-editorial/app test`
Expected: PASS (engine dist must exist; if not, `pnpm --filter @druck-editorial/engine build` first).

- [ ] **Step 5: Commit**

```bash
git add apps/druck-app/prerender
git commit -m "feat: prerender module renders all landing markers from fixtures"
```

### Task 6: Page skeleton — index.html, prerender plugin, colophon renderer

**Files:**
- Modify: `apps/druck-app/prerender/render-bands.mjs` (+ colophon function), `render-bands.test.mjs`
- Rewrite: `apps/druck-app/index.html`
- Modify: `apps/druck-app/vite.config.ts`, `apps/druck-app/tsconfig.json`

Note: from the end of this task until Task 8 completes, the page is static-only (the module script 404s in dev). That is expected mid-migration state.

- [ ] **Step 1: Failing test for the colophon renderer**

Append to `render-bands.test.mjs`:

```js
import { renderColophonScores } from './render-bands.mjs';

describe('renderColophonScores', () => {
  test('renders four rings with measured values', () => {
    const html = renderColophonScores({
      scores: { performance: 100, accessibility: 100, 'best-practices': 100, seo: 100 },
      totalTransferKB: 212,
      lighthouseVersion: '13.0.0',
      measuredAt: '2026-06-09',
    });
    expect(html.match(/class="ring"/g)).toHaveLength(4);
    expect(html).toContain('212');
    expect(html).toContain('13.0.0');
  });

  test('renders pending state when no summary exists', () => {
    const html = renderColophonScores(null);
    expect(html.match(/class="ring"/g)).toHaveLength(4);
    expect(html).toContain('not yet measured');
  });
});
```

Run: `pnpm --filter @druck-editorial/app test` — Expected: FAIL (function missing).

- [ ] **Step 2: Implement colophon renderer and wire it into buildLandingHtml**

Add to `render-bands.mjs`:

```js
const RING_CATEGORIES = [
  ['performance', 'Performance'],
  ['accessibility', 'Accessibility'],
  ['best-practices', 'Best Practices'],
  ['seo', 'SEO'],
];
const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function renderRing(label, score) {
  const value = score ?? null;
  const dash = value === null ? 0 : (value / 100) * RING_CIRCUMFERENCE;
  const display = value === null ? '&ndash;' : String(value);
  return (
    `<figure class="ring" role="img" aria-label="Lighthouse ${label}: ${value === null ? 'not yet measured' : value}">` +
    `<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">` +
    `<circle cx="32" cy="32" r="${RING_RADIUS}" class="ring-track"/>` +
    `<circle cx="32" cy="32" r="${RING_RADIUS}" class="ring-fill" stroke-dasharray="${dash.toFixed(1)} ${RING_CIRCUMFERENCE.toFixed(1)}"/>` +
    `<text x="32" y="37" text-anchor="middle" class="ring-value">${display}</text>` +
    `</svg>` +
    `<figcaption>${label}</figcaption>` +
    `</figure>`
  );
}

export function renderColophonScores(summary) {
  const rings = RING_CATEGORIES.map(([key, label]) => renderRing(label, summary?.scores?.[key] ?? null)).join('');
  const method = summary
    ? `Measured with Lighthouse ${escapeHtml(summary.lighthouseVersion)}, mobile profile, static production build, ${escapeHtml(summary.measuredAt)}. Initial transfer ${escapeHtml(String(summary.totalTransferKB))} KB.`
    : 'Scores not yet measured for this revision. Run node scripts/audit.mjs.';
  return `<div class="rings">${rings}</div><p class="colophon-method">${method}</p>`;
}
```

In `buildLandingHtml`, accept an optional summary and add one more replacement (update the signature and the test template accordingly — the marker is additive, existing tests stay green):

```js
export async function buildLandingHtml(template, fixturesDir, auditSummary = null) {
  ...existing body...
  return template
    .replace('<!--druck:hero-json-->', tokenizeJsonForPane(feature.raw))
    .replace('<!--druck:hero-magazine-->', renderHeroMagazinePane(feature.data))
    .replace('<!--druck:format-panels-->', formatPanels.join(''))
    .replace('<!--druck:specimens-->', specimensHtml)
    .replace('<!--druck:band4-article-->', renderArticle(feature.data))
    .replace('<!--druck:colophon-scores-->', renderColophonScores(auditSummary));
}
```

Run: `pnpm --filter @druck-editorial/app test` — Expected: PASS.

- [ ] **Step 3: Prerender plugin in vite.config.ts**

Replace `apps/druck-app/vite.config.ts` with:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { buildLandingHtml } from './prerender/render-bands.mjs';

const FIXTURES_DIR = join(import.meta.dirname, 'public/sample-data');
const AUDIT_SUMMARY_PATH = join(import.meta.dirname, 'audit/summary.json');

function readAuditSummary(): unknown {
  try {
    return JSON.parse(readFileSync(AUDIT_SUMMARY_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function druckPrerender() {
  return {
    name: 'druck-prerender',
    transformIndexHtml: {
      order: 'pre' as const,
      handler: (html: string) => buildLandingHtml(html, FIXTURES_DIR, readAuditSummary()),
    },
  };
}

export default defineConfig({
  plugins: [preact(), druckPrerender()],
  server: { port: 3111 },
});
```

The `try/catch` around the audit summary is a deliberate boundary: a missing summary is a legal state (first build) and renders the pending colophon; a broken fixture inside `buildLandingHtml` still throws and fails the build loudly. (`preact()` is removed in Task 8.)

- [ ] **Step 4: Rewrite index.html**

Replace `apps/druck-app/index.html` entirely. Verify the two preload filenames against `ls apps/druck-app/public/fonts/` (they must be the latin 800 Plus Jakarta file and the latin regular Source Serif file) and correct the hrefs if Bunny's naming differs:

```html
<!DOCTYPE html>
<html lang="en" data-surface="paper">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Druck — Structure in, magazine out</title>
  <meta name="description" content="Druck is an editorial rendering engine: structured article JSON in, magazine-quality pages out. Formats, multilingual typography, reading analytics, embeddable widgets. MIT.">
  <meta name="author" content="Artem Iagovdik <artyom.yagovdik@gmail.com>">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#faf8f5">
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0c0c0e">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="/fonts/files-plus-jakarta-sans-latin-800-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/files-source-serif-4-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
  <script>
    (function() {
      try {
        var t = localStorage.getItem('druck-theme');
        if (!t && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) t = 'dark';
        if (t) document.documentElement.dataset.theme = t;
      } catch(e) {}
    })();
  </script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <nav class="demo-nav" aria-label="Main">
    <div class="demo-nav-left">
      <span class="demo-logo">Dr<span class="demo-logo-accent">u</span>ck</span>
    </div>
    <div class="demo-nav-right">
      <button class="theme-btn" data-island="theme" aria-label="Toggle color theme">
        <svg class="sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <svg class="moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
    </div>
  </nav>
  <div class="reading-progress" data-island="rail" aria-hidden="true"></div>

  <main id="main">
    <section class="band band-hero" data-surface="paper" aria-labelledby="hero-heading">
      <div class="demo-hero-text">
        <div class="demo-hero-tag"><span class="demo-hero-tag-dot"></span>Editorial Rendering</div>
        <h1 id="hero-heading" class="demo-hero-h1">Structure in,<br><em>magazine out</em></h1>
        <p class="demo-hero-body">Druck turns structured article data into magazine-quality pages. Formats, per-language typography, reading analytics, and embeddable widgets — extracted from a pipeline that rendered thousands of production articles before it had a name.</p>
        <div class="demo-hero-cta-row">
          <button class="demo-cta" data-island="copy" data-copy-text="pnpm add @druck-editorial/engine">
            <code>pnpm add @druck-editorial/engine</code>
            <span class="icon-slot" data-icon="copy" aria-hidden="true"></span>
          </button>
          <a class="demo-cta demo-cta-ghost" href="https://github.com/druck-editorial/druck" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </div>
      <div class="hero-stage" data-island="sequence">
        <div class="hero-pane hero-pane-json" aria-label="The article source data">
          <div class="pane-chrome">feature.json</div>
          <pre class="json-pane"><code><!--druck:hero-json--></code></pre>
        </div>
        <div class="hero-pane hero-pane-mag" aria-label="The rendered magazine page">
          <div class="pane-chrome">rendered</div>
          <!--druck:hero-magazine-->
        </div>
        <button class="replay-btn" data-role="replay" hidden>
          <span class="icon-slot" data-icon="arrow-counter-clockwise" aria-hidden="true"></span>
          Replay
        </button>
      </div>
    </section>

    <section class="band band-formats" data-surface="paper" aria-labelledby="formats-heading">
      <h2 id="formats-heading" class="band-title">One story, <em>three</em> magazines</h2>
      <p class="band-lede">The same JSON, three editorial registers. The engine decides layout; you decide judgment.</p>
      <div class="format-switch" data-island="switcher" data-switch="format" role="radiogroup" aria-label="Article format">
        <button role="radio" aria-checked="true" data-value="feature">Feature</button>
        <button role="radio" aria-checked="false" data-value="quick_take">Quick Take</button>
        <button role="radio" aria-checked="false" data-value="wire">Wire</button>
      </div>
      <p class="format-caption" data-format="feature">Feature: chapters, key points, the full editorial chrome.</p>
      <p class="format-caption" data-format="quick_take" hidden>Quick Take: one chapter, two hundred words, same care.</p>
      <p class="format-caption" data-format="wire" hidden>Wire: dateline and lede, no chrome, costs nothing to produce.</p>
      <div class="format-stage" aria-live="polite">
        <!--druck:format-panels-->
      </div>
    </section>

    <section class="band band-langs" data-surface="paper" aria-labelledby="langs-heading">
      <h2 id="langs-heading" class="band-title">Five languages, <em>real</em> rules</h2>
      <p class="band-lede">Not translation — typesetting. Each locale carries its own hyphenation, quotes, and rhythm.</p>
      <div class="lang-switch" data-island="switcher" data-switch="lang" role="radiogroup" aria-label="Specimen language">
        <button role="radio" aria-checked="true" data-value="en">EN</button>
        <button role="radio" aria-checked="false" data-value="de">DE</button>
        <button role="radio" aria-checked="false" data-value="fr">FR</button>
        <button role="radio" aria-checked="false" data-value="es">ES</button>
        <button role="radio" aria-checked="false" data-value="ja">JA</button>
      </div>
      <div class="specimen-stage" aria-live="polite">
        <!--druck:specimens-->
      </div>
    </section>

    <section class="band band-article" data-surface="paper" aria-labelledby="article-heading">
      <h2 id="article-heading" class="band-title">The full <em>article</em>, live</h2>
      <p class="band-lede">Rendered by the engine at build time. Pick an accent — every category carries its own.</p>
      <div class="accent-switch" data-island="switcher" data-switch="accent" role="radiogroup" aria-label="Category accent">
        <button role="radio" aria-checked="true" data-value="cat-ai">AI</button>
        <button role="radio" aria-checked="false" data-value="cat-security">Security</button>
        <button role="radio" aria-checked="false" data-value="cat-dev-tools">Dev Tools</button>
        <button role="radio" aria-checked="false" data-value="cat-infrastructure">Infrastructure</button>
        <button role="radio" aria-checked="false" data-value="cat-business">Business</button>
        <button role="radio" aria-checked="false" data-value="cat-science">Science</button>
        <button role="radio" aria-checked="false" data-value="cat-policy">Policy</button>
        <button role="radio" aria-checked="false" data-value="cat-weekly">Weekly</button>
      </div>
      <div class="demo-article-frame band4-article" data-island="analytics">
        <!--druck:band4-article-->
      </div>
      <aside class="demo-analytics" aria-labelledby="analytics-title">
        <div class="demo-analytics-title" id="analytics-title">Reading analytics — watching you read, right now</div>
        <p class="analytics-privacy">@druck-editorial/analytics is tracking your reading of the article above. Nothing leaves this page.</p>
        <div class="demo-analytics-grid">
          <div class="demo-analytics-metric">
            <div class="demo-analytics-metric-label">Scroll depth</div>
            <div class="demo-analytics-metric-value"><span data-metric="depth">0</span><span class="demo-analytics-metric-unit">%</span></div>
            <div class="demo-depth-track"><div class="demo-depth-fill" data-metric="depth-fill"></div></div>
          </div>
          <div class="demo-analytics-metric">
            <div class="demo-analytics-metric-label">Active reading</div>
            <div class="demo-analytics-metric-value" data-metric="time">0s</div>
          </div>
          <div class="demo-analytics-metric">
            <div class="demo-analytics-metric-label">Chapters read</div>
            <div class="demo-analytics-metric-value"><span data-metric="chapters">0</span><span class="demo-analytics-metric-unit">/ 3</span></div>
          </div>
          <div class="demo-analytics-metric">
            <div class="demo-analytics-metric-label">Milestones</div>
            <div class="demo-analytics-metric-value" data-metric="milestone">&ndash;</div>
          </div>
        </div>
        <div class="visually-hidden" role="status" data-metric="announcer"></div>
      </aside>
    </section>

    <section class="band band-wild" data-surface="ink" aria-labelledby="wild-heading" data-island="embeds">
      <h2 id="wild-heading" class="band-title">In the <em>wild</em></h2>
      <p class="band-lede">Four publications that do not exist, running one widget that does. Host styles clash on purpose; the article inside never flinches.</p>
      <div class="frames">
        <article class="frame frame--music" aria-label="PHONOGRAPH, a music magazine">
          <div class="frame-chrome"><span class="dots" aria-hidden="true"></span><span class="frame-host">phonograph.fm</span></div>
          <header class="frame-masthead">PHONOGRAPH<nav aria-hidden="true"><span>Reviews</span><span>Lists</span><span>Live</span></nav></header>
          <div class="frame-viewport">
            <druck-article data-src="/sample-data/frame-music.json" css-url="/article.css" accent="#e0402e"></druck-article>
          </div>
          <p class="frame-caption">Archivo Black mastheads &middot; hot red &middot; quick_take</p>
        </article>
        <article class="frame frame--fashion" aria-label="ATELIER, a fashion magazine">
          <div class="frame-chrome"><span class="dots" aria-hidden="true"></span><span class="frame-host">atelier-journal.com</span></div>
          <header class="frame-masthead">A T E L I E R<nav aria-hidden="true"><span>Collections</span><span>Essays</span></nav></header>
          <div class="frame-viewport">
            <druck-article data-src="/sample-data/frame-fashion.json" css-url="/article.css" accent="#1c1a18"></druck-article>
          </div>
          <p class="frame-caption">Bodoni Moda display &middot; near-black &middot; quick_take</p>
        </article>
        <article class="frame frame--tech" aria-label="deploy.log, a tech blog">
          <div class="frame-chrome"><span class="dots" aria-hidden="true"></span><span class="frame-host">deploy.log</span></div>
          <header class="frame-masthead">deploy.log<nav aria-hidden="true"><span>posts</span><span>rss</span></nav></header>
          <div class="frame-viewport">
            <druck-article data-src="/sample-data/wire.json" css-url="/article.css" accent="#2a9d8f"></druck-article>
          </div>
          <p class="frame-caption">Space Grotesk + Plex Mono &middot; teal &middot; wire</p>
        </article>
        <article class="frame frame--markets" aria-label="LEDGERLINE, a markets daily published from a Telegram channel">
          <div class="frame-chrome"><span class="dots" aria-hidden="true"></span><span class="frame-host">t.me/ledgerline &rarr; ledgerline.site</span></div>
          <div class="channel-strip" aria-hidden="true">
            <span class="bubble">BTC holding the shelf. ETF flows +6 days.</span>
            <span class="bubble">$2.1B net in. Funding flat.</span>
            <span class="bubble">Full brief &rarr;</span>
          </div>
          <header class="frame-masthead">LEDGERLINE<nav aria-hidden="true"><span>Briefs</span><span>Data</span></nav></header>
          <div class="frame-viewport">
            <druck-article data-src="/sample-data/frame-markets.json" css-url="/article.css" accent="#1f9d63"></druck-article>
          </div>
          <p class="frame-caption">They post in Telegram. Readers get a magazine. &middot; wire</p>
        </article>
      </div>
    </section>

    <section class="band band-colophon" data-surface="ink" aria-labelledby="colophon-heading">
      <h2 id="colophon-heading" class="band-title">Colophon</h2>
      <!--druck:colophon-scores-->
      <p class="colophon-claim">Rendered output requires zero JavaScript. This page's interactivity ships as small islands; the article you read above arrived as static HTML. View source — it is all there.</p>
      <div class="colophon-snippet">
        <pre><code>&lt;druck-article src="story.json"&gt;&lt;/druck-article&gt;</code></pre>
        <button class="demo-cta demo-cta-ghost" data-island="copy" data-copy-text='<druck-article src="story.json"></druck-article>'>
          <span class="icon-slot" data-icon="copy" aria-hidden="true"></span>Copy
        </button>
      </div>
      <p class="colophon-links">
        <a href="https://github.com/druck-editorial/druck" target="_blank" rel="noopener noreferrer">GitHub</a>
        <span>&middot;</span><span>MIT</span><span>&middot;</span>
        <code>pnpm add @druck-editorial/engine</code>
      </p>
    </section>
  </main>

  <footer class="demo-footer">
    Druck — the editorial rendering layer extracted from <a href="https://sonto.tech" target="_blank" rel="noopener noreferrer">Sonto</a>.
    &copy; 2026 Artem Iagovdik &middot; MIT.
  </footer>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

The two legacy script tags (`article-progress.js`, `article-effects.js`) are gone; their behavior is reimplemented in islands. Delete the orphaned files: `git rm apps/druck-app/public/assets/js/article-progress.js apps/druck-app/public/assets/js/article-effects.js`

- [ ] **Step 5: tsconfig adjustments**

Open `apps/druck-app/tsconfig.json`: remove the `jsx` and `jsxImportSource` compiler options if present, ensure `include` covers `src` and `prerender`. Run `pnpm --filter @druck-editorial/app typecheck` — App.tsx still compiles for now; errors about missing main.ts imports are expected to be absent (main.ts arrives in Task 8; typecheck only covers existing files).

- [ ] **Step 6: Dev smoke + commit**

Run: `pnpm dev` and open http://localhost:3111. Expected: the static page renders all six bands with article content baked in (no interactivity yet; module 404 in console is the known mid-state). Ctrl-C.

```bash
git add apps/druck-app/index.html apps/druck-app/vite.config.ts apps/druck-app/tsconfig.json apps/druck-app/prerender
git rm apps/druck-app/public/assets/js/article-progress.js apps/druck-app/public/assets/js/article-effects.js
git commit -m "feat: static six-band landing skeleton with build-time prerender"
```

---

### Task 7: Styles — landing.css and the styles.css prune

**Files:**
- Create: `apps/druck-app/src/styles/landing.css`
- Modify: `apps/druck-app/src/styles.css`

- [ ] **Step 1: Prune styles.css**

Delete these rule blocks (and their `[data-theme="dark"]` variants and media-query copies): `.demo-tabs`, `.demo-tab` (all states), `.demo-meta`, `.demo-meta-sep`, `.demo-hero-showcase`, `.showcase-card` (all), `.showcase-card-label`, `.showcase-card-value`, `.showcase-accent-bar`, `.demo-categories` (all), `.demo-cat-chip` (all), `.demo-cat-dot`, `.demo-divider` (all), `.demo-article-header`, `.demo-article-label`, `.demo-format-badge`, `.demo-article-content.fade-out`, `.demo-article-content.fade-in`, `@keyframes fadeInUp`, `.demo-loading` (all), `.demo-loading-spinner`, `@keyframes spin`, and every `.demo-mobile-tab*` rule. Keep: tokens, reset, `.demo-nav*`, `.demo-logo*`, `.theme-btn*`, `.demo-hero` text/tag/h1/body/cta rules, `.demo-article-frame`, `.demo-analytics*`, `.demo-depth*`, `.demo-footer*`, `.reading-progress`.

Run `wc -l apps/druck-app/src/styles.css` — Expected: roughly 450-550 lines.

- [ ] **Step 2: Write landing.css**

Create `apps/druck-app/src/styles/landing.css`:

```css
:root {
  --band-pad: clamp(56px, 9vw, 128px);
  --band-max: 1200px;
  --ink-bg: #101013;
  --ink-surface: #18181d;
  --ink-text: #efeef2;
  --ink-text-secondary: #b6b4c0;
  --ink-hairline: rgba(255, 255, 255, 0.09);
  --seq-step-ms: 600ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}

html[data-surface="ink"] body {
  background: var(--ink-bg);
  color: var(--ink-text);
}
html[data-surface="ink"] .demo-nav { background: color-mix(in oklab, var(--ink-bg) 86%, transparent); border-color: var(--ink-hairline); }
html[data-surface="ink"] .demo-logo { color: var(--ink-text); }
html[data-surface="ink"] .theme-btn { color: var(--ink-text); border-color: var(--ink-hairline); }

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.skip-link {
  position: fixed;
  top: -48px;
  left: 16px;
  z-index: 200;
  padding: 10px 16px;
  background: var(--demo-text);
  color: var(--demo-bg);
  border-radius: 0 0 var(--demo-radius) var(--demo-radius);
  transition: top 150ms var(--ease-out);
}
.skip-link:focus-visible { top: 0; }

.band { max-width: var(--band-max); margin: 0 auto; padding: var(--band-pad) 24px; }
.band-title { font-family: 'Plus Jakarta Sans', 'pjs-fallback', system-ui, sans-serif; font-size: clamp(28px, 4vw, 44px); font-weight: 800; letter-spacing: -0.03em; margin: 0 0 12px; }
.band-title em { font-family: 'Source Serif 4', 'ss4-fallback', Georgia, serif; font-style: italic; font-weight: 400; color: var(--demo-accent-clay); }
html[data-surface="ink"] .band-title em { color: #e8a18f; }
.band-lede { max-width: 560px; color: var(--demo-text-muted); margin: 0 0 40px; }
html[data-surface="ink"] .band-lede { color: var(--ink-text-secondary); }

.band-hero { display: grid; grid-template-columns: 5fr 7fr; gap: 48px; align-items: start; }
.hero-stage { position: relative; display: grid; grid-template-columns: 5fr 7fr; gap: 16px; grid-column: 2; }
.band-hero .demo-hero-text { grid-column: 1; }
.hero-pane { border: 1px solid var(--demo-hairline-strong); border-radius: var(--demo-radius-lg); overflow: hidden; background: var(--demo-surface); box-shadow: var(--demo-shadow-md); }
.pane-chrome { font: 500 11px/1 'IBM Plex Mono', monospace; letter-spacing: 0.08em; text-transform: uppercase; padding: 10px 14px; border-bottom: 1px solid var(--demo-hairline); color: var(--demo-text-muted); }
.json-pane { margin: 0; padding: 14px; font: 400 11.5px/1.7 ui-monospace, 'SF Mono', Menlo, monospace; overflow: hidden; max-height: 520px; }
.json-pane .jl { display: block; padding: 0 6px; border-radius: 4px; transition: background var(--demo-transition); }
.json-pane .jl.lit { background: rgba(184, 74, 52, 0.14); }
.json-pane .jk { color: #8a4a3a; font-style: normal; }
.json-pane .js { color: #3a5a6d; font-style: normal; }
.json-pane .jn { color: #7a5a30; font-style: normal; }
.json-pane .jp { color: var(--demo-text-faint); font-style: normal; }
[data-theme="dark"] .json-pane .jk { color: #e0907c; }
[data-theme="dark"] .json-pane .js { color: #9fc1d4; }
[data-theme="dark"] .json-pane .jn { color: #d4b46a; }

.hero-mag { padding: 24px; }
.hero-mag-title { font-family: var(--type-headline-font, 'Plus Jakarta Sans'), sans-serif; font-size: clamp(22px, 2.4vw, 34px); font-weight: 800; line-height: 1.05; letter-spacing: -0.04em; margin: 10px 0; }
.hero-mag-img img { width: 100%; height: auto; border-radius: var(--demo-radius); display: block; }
.hero-mag-body { font-family: 'Source Serif 4', 'ss4-fallback', Georgia, serif; font-size: 14.5px; line-height: 1.7; color: var(--demo-text-secondary); }
.hero-mag .article-kicker { margin-bottom: 0; }
.hero-mag .article-deck { margin: 0 0 14px; font-size: 14px; max-width: none; text-align: left; }

.hx { opacity: 0; transform: translateY(10px); }
.hero-stage[data-state="playing"] .hx, .hero-stage[data-state="done"] .hx { transition: opacity var(--seq-step-ms) var(--ease-out), transform var(--seq-step-ms) var(--ease-out); }
.hx.on { opacity: 1; transform: none; }
.hero-stage[data-state="static"] .hx { opacity: 1; transform: none; }
.replay-btn { position: absolute; right: 12px; bottom: 12px; display: inline-flex; gap: 8px; align-items: center; padding: 8px 14px; border: 1px solid var(--demo-hairline-strong); border-radius: 999px; background: var(--demo-surface); color: var(--demo-text-secondary); cursor: pointer; font-size: 12.5px; }
.replay-btn:hover { color: var(--demo-text); }
.replay-btn:focus-visible { outline: 2px solid var(--demo-accent-clay); outline-offset: 2px; }

.format-switch, .lang-switch, .accent-switch { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.format-switch button, .lang-switch button, .accent-switch button {
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid var(--demo-hairline-strong);
  border-radius: 999px;
  background: var(--demo-surface);
  color: var(--demo-text-secondary);
  font: 500 13.5px/1 'General Sans', 'gs-fallback', system-ui, sans-serif;
  cursor: pointer;
  transition: background var(--demo-transition), color var(--demo-transition), border-color var(--demo-transition);
}
.format-switch button[aria-checked="true"], .lang-switch button[aria-checked="true"], .accent-switch button[aria-checked="true"] {
  background: var(--demo-text);
  color: var(--demo-bg);
  border-color: var(--demo-text);
}
.format-switch button:focus-visible, .lang-switch button:focus-visible, .accent-switch button:focus-visible, .demo-cta:focus-visible {
  outline: 2px solid var(--demo-accent-clay);
  outline-offset: 2px;
}

.format-caption { font-size: 13.5px; color: var(--demo-text-muted); margin: 0 0 20px; }
.format-stage { position: relative; min-height: 640px; border: 1px solid var(--demo-hairline-strong); border-radius: var(--demo-radius-lg); overflow: hidden; background: var(--demo-surface); }
.format-panel { max-height: 640px; overflow-y: auto; opacity: 1; transition: opacity 200ms var(--ease-out); }
.format-panel[hidden] { display: none; }
.format-panel.leaving { opacity: 0; }

.specimen-stage { min-height: 420px; border: 1px solid var(--demo-hairline-strong); border-radius: var(--demo-radius-lg); background: var(--demo-surface); padding: clamp(24px, 4vw, 56px); }
.specimen-panel[hidden] { display: none; }
.specimen-headline { font-family: 'Plus Jakarta Sans', 'pjs-fallback', sans-serif; font-size: clamp(24px, 3vw, 38px); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; margin: 0 0 18px; text-wrap: balance; }
.specimen-body { font-family: 'Source Serif 4', 'ss4-fallback', Georgia, serif; font-size: 17px; line-height: 1.72; max-width: 620px; }
.specimen-quote { font-family: 'Source Serif 4', 'ss4-fallback', Georgia, serif; font-size: 21px; font-style: italic; color: var(--demo-text-secondary); border-left: 2px solid var(--demo-accent-clay); margin: 24px 0; padding-left: 20px; }
.specimen-rule-label { font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--demo-text-muted); margin: 28px 0 6px; }
.specimen-rule { font: 400 12.5px/1.6 ui-monospace, Menlo, monospace; color: var(--demo-accent-clay); background: rgba(184, 74, 52, 0.07); padding: 6px 10px; border-radius: 6px; display: inline-block; }
.specimen-panel[lang="en"] .specimen-body { hanging-punctuation: first; }
.specimen-panel[lang="de"] .specimen-body, .specimen-panel[lang="de"] .specimen-headline { hyphens: auto; hyphenate-limit-chars: 10 5 5; }
.specimen-panel[lang="fr"] .specimen-body { hyphens: auto; hyphenate-limit-chars: 7 3 3; }
.specimen-panel[lang="fr"] .specimen-headline, .specimen-panel[lang="es"] .specimen-headline { hyphens: manual; }
.specimen-panel[lang="es"] .specimen-body { line-height: 1.78; }
.specimen-panel[lang="ja"] .specimen-headline, .specimen-panel[lang="ja"] .specimen-body, .specimen-panel[lang="ja"] .specimen-quote {
  font-family: 'Hiragino Sans', 'Yu Gothic', 'Noto Sans JP', sans-serif;
  font-style: normal;
  word-break: keep-all;
  line-break: strict;
}
.specimen-panel[lang="ja"] .specimen-body { line-height: 1.88; letter-spacing: 0.012em; }

.band4-article { max-height: 760px; overflow-y: auto; }
.band4-article .article-shell { transition: none; }
.analytics-privacy { font-size: 12.5px; color: var(--demo-text-muted); margin: 4px 0 16px; }

.band-wild .frames { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
.frame { border: 1px solid var(--ink-hairline); border-radius: var(--demo-radius-lg); overflow: hidden; background: var(--ink-surface); }
.frame-chrome { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--ink-hairline); }
.frame-chrome .dots { width: 38px; height: 8px; background: radial-gradient(circle 4px, rgba(255,255,255,0.25) 3.4px, transparent 4px) 0/14px 8px repeat-x; }
.frame-host { font: 400 11px/1 ui-monospace, Menlo, monospace; color: var(--ink-text-secondary); }
.frame-masthead { display: flex; justify-content: space-between; align-items: baseline; padding: 14px 18px; border-bottom: 1px solid var(--ink-hairline); color: var(--ink-text); }
.frame-masthead nav { display: flex; gap: 14px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-text-secondary); }
.frame-viewport { height: 460px; overflow-y: auto; background: #fdfcfa; }
.frame-caption { font-size: 12px; color: var(--ink-text-secondary); padding: 12px 18px; margin: 0; }
.channel-strip { display: flex; gap: 8px; padding: 12px 14px 0; flex-wrap: wrap; }
.channel-strip .bubble { font-size: 11.5px; color: var(--ink-text); background: rgba(42, 171, 238, 0.14); border: 1px solid rgba(42, 171, 238, 0.25); padding: 6px 12px; border-radius: 12px 12px 12px 3px; }

.frame--music .frame-masthead { font-family: 'Archivo Black', 'pjs-fallback', sans-serif; font-size: 22px; letter-spacing: 0.02em; }
.frame--music druck-article { --type-headline-font: 'Archivo Black', sans-serif; --type-headline-weight: 400; --type-headline-tracking: 0; --type-accent-style: normal; }
.frame--fashion .frame-masthead { font-family: 'Bodoni Moda', Didot, serif; font-weight: 600; font-size: 20px; letter-spacing: 0.32em; }
.frame--fashion druck-article { --type-headline-font: 'Bodoni Moda', Didot, serif; --type-headline-weight: 700; --type-headline-tracking: 0; --type-headline-leading: 1.08; }
.frame--tech .frame-masthead { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 18px; }
.frame--tech druck-article { --type-headline-font: 'Space Grotesk', sans-serif; --type-headline-weight: 700; --font-heading: 'IBM Plex Mono', monospace; }
.frame--markets .frame-masthead { font-family: 'Plus Jakarta Sans', 'pjs-fallback', sans-serif; font-weight: 800; font-size: 17px; letter-spacing: 0.14em; }
.frame--markets druck-article { --font-heading: 'IBM Plex Mono', monospace; }

.band-colophon { text-align: center; }
.rings { display: flex; justify-content: center; gap: clamp(20px, 4vw, 48px); margin: 32px 0 16px; }
.ring { margin: 0; color: var(--ink-text-secondary); font-size: 11.5px; letter-spacing: 0.06em; text-transform: uppercase; }
.ring-track { fill: none; stroke: var(--ink-hairline); stroke-width: 5; }
.ring-fill { fill: none; stroke: #6fbf8e; stroke-width: 5; stroke-linecap: round; transform: rotate(-90deg); transform-origin: center; }
.ring-value { fill: var(--ink-text); font: 700 17px 'Plus Jakarta Sans', sans-serif; }
.colophon-method { font-size: 12.5px; color: var(--ink-text-secondary); max-width: 520px; margin: 0 auto 28px; }
.colophon-claim { font-family: 'Source Serif 4', 'ss4-fallback', Georgia, serif; font-size: 17px; line-height: 1.7; max-width: 560px; margin: 0 auto 28px; color: var(--ink-text); }
.colophon-snippet { display: inline-flex; align-items: center; gap: 12px; border: 1px solid var(--ink-hairline); border-radius: var(--demo-radius); padding: 10px 14px; margin-bottom: 24px; }
.colophon-snippet pre { margin: 0; font: 400 13px/1 ui-monospace, Menlo, monospace; color: var(--ink-text); }
.colophon-links { display: flex; justify-content: center; gap: 12px; align-items: center; color: var(--ink-text-secondary); }
.colophon-links a { color: var(--ink-text); }

.icon-slot svg { width: 15px; height: 15px; display: block; fill: currentColor; }

@media (max-width: 1023px) {
  .band-hero, .hero-stage { grid-template-columns: 1fr; }
  .hero-stage { grid-column: 1; }
  .band-wild .frames { grid-template-columns: 1fr; }
}
@media (max-width: 767px) {
  .json-pane { max-height: 180px; }
  .json-pane .jl:nth-child(n+7) { display: none; }
  .format-stage { min-height: 480px; }
  .format-panel { max-height: 480px; }
  .frame-viewport { height: 380px; }
  .rings { display: grid; grid-template-columns: repeat(2, max-content); justify-content: center; }
}
@media (prefers-reduced-motion: reduce) {
  .hx, .json-pane .jl, .format-panel, .skip-link, body { transition: none; }
  .replay-btn { display: none; }
}
```

- [ ] **Step 3: Import order in main entry**

The imports land in `src/main.ts` (Task 8) in this order: `./styles/fonts.css`, `./styles.css`, `./styles/landing.css`, `@druck-editorial/css/article.css`. Record this here so Task 8 copies it exactly. `fonts-themes.css` is not imported — the embeds island injects it.

- [ ] **Step 4: Dev visual check + commit**

Run `pnpm dev`, check all six bands at 1440 and 375 wide, both themes (toggle is dead until Task 8 — flip `data-theme` on `<html>` in devtools). Expected: layout holds, no horizontal scroll at 320.

```bash
git add apps/druck-app/src/styles.css apps/druck-app/src/styles/landing.css
git commit -m "feat: landing band styles, ink surfaces, frame type themes"
```

---

### Task 8: Islands — vanilla interactivity, Preact removed

**Files:**
- Create: `apps/druck-app/src/main.ts`, `apps/druck-app/src/islands/{theme,copy,rail,sequence,switcher,surfaces,embeds,analyticsPanel}.ts`
- Create: `apps/druck-app/src/islands/{switcher,sequence,copy}.test.ts`
- Delete: `apps/druck-app/src/App.tsx`, `apps/druck-app/src/main.tsx`
- Modify: `apps/druck-app/package.json`, `apps/druck-app/vite.config.ts`

- [ ] **Step 1: Write failing unit tests (happy-dom)**

Create `src/islands/switcher.test.ts`:

```ts
// @vitest-environment happy-dom
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { initSwitcher } from './switcher.js';

function buildSwitcherDom(): HTMLElement {
  document.body.innerHTML = `
    <div data-switch="format" role="radiogroup">
      <button role="radio" aria-checked="true" data-value="feature">Feature</button>
      <button role="radio" aria-checked="false" data-value="wire">Wire</button>
    </div>
    <div class="stage">
      <div data-format="feature">A</div>
      <div data-format="wire" hidden>B</div>
    </div>`;
  return document.querySelector('[data-switch]') as HTMLElement;
}

describe('initSwitcher', () => {
  beforeEach(() => buildSwitcherDom());

  test('clicking a radio shows its panels and updates aria-checked', () => {
    initSwitcher(document.querySelector('[data-switch]')!, { datasetKey: 'format' });
    const wireButton = document.querySelector('[data-value="wire"]') as HTMLButtonElement;
    wireButton.click();
    expect(wireButton.getAttribute('aria-checked')).toBe('true');
    expect((document.querySelector('[data-format="wire"]') as HTMLElement).hidden).toBe(false);
    expect((document.querySelector('[data-format="feature"]') as HTMLElement).hidden).toBe(true);
  });

  test('arrow keys move selection and focus', () => {
    initSwitcher(document.querySelector('[data-switch]')!, { datasetKey: 'format' });
    const [first, second] = [...document.querySelectorAll('[role="radio"]')] as HTMLButtonElement[];
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(second.getAttribute('aria-checked')).toBe('true');
  });

  test('invokes onChange callback with the selected value', () => {
    const onChange = vi.fn();
    initSwitcher(document.querySelector('[data-switch]')!, { datasetKey: 'format', onChange });
    (document.querySelector('[data-value="wire"]') as HTMLButtonElement).click();
    expect(onChange).toHaveBeenCalledWith('wire');
  });
});
```

Create `src/islands/sequence.test.ts`:

```ts
// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { playSequence, SEQUENCE_STEP_MS } from './sequence.js';

function buildStage(): HTMLElement {
  document.body.innerHTML = `
    <div class="hero-stage">
      <pre><code>
        <span class="jl" data-key="category">c</span>
        <span class="jl" data-key="title">t</span>
      </code></pre>
      <div>
        <div class="hx" data-step="1"></div>
        <div class="hx" data-step="2"></div>
      </div>
      <button data-role="replay" hidden></button>
    </div>`;
  return document.querySelector('.hero-stage') as HTMLElement;
}

describe('playSequence', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('reveals steps in order and finishes in done state', () => {
    const stage = buildStage();
    playSequence(stage);
    expect(stage.dataset.state).toBe('playing');
    vi.advanceTimersByTime(SEQUENCE_STEP_MS);
    expect(stage.querySelector('[data-step="1"]')!.classList.contains('on')).toBe(true);
    expect(stage.querySelector('[data-step="2"]')!.classList.contains('on')).toBe(false);
    vi.advanceTimersByTime(SEQUENCE_STEP_MS * 2);
    expect(stage.dataset.state).toBe('done');
    expect((stage.querySelector('[data-role="replay"]') as HTMLElement).hidden).toBe(false);
  });

  test('lights the matching json line during its step', () => {
    const stage = buildStage();
    playSequence(stage);
    vi.advanceTimersByTime(SEQUENCE_STEP_MS);
    expect(stage.querySelector('[data-key="category"]')!.classList.contains('lit')).toBe(true);
  });
});
```

Create `src/islands/copy.test.ts`:

```ts
// @vitest-environment happy-dom
import { describe, expect, test, vi } from 'vitest';
import { initCopyButton } from './copy.js';

describe('initCopyButton', () => {
  test('writes data-copy-text to the clipboard and flips state', async () => {
    document.body.innerHTML = `<button data-copy-text="hello"><span class="icon-slot"></span></button>`;
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const button = document.querySelector('button') as HTMLButtonElement;
    initCopyButton(button);
    button.click();
    await vi.waitFor(() => expect(button.dataset.copied).toBe('true'));
    expect(writeText).toHaveBeenCalledWith('hello');
  });
});
```

Run: `pnpm --filter @druck-editorial/app test` — Expected: FAIL (modules missing).

- [ ] **Step 2: Implement the islands**

`src/islands/switcher.ts`:

```ts
interface SwitcherOptions {
  datasetKey: string;
  onChange?: (value: string) => void;
}

const NEXT_KEYS = ['ArrowRight', 'ArrowDown'];
const PREV_KEYS = ['ArrowLeft', 'ArrowUp'];

export function initSwitcher(root: HTMLElement, options: SwitcherOptions): void {
  const radios = [...root.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
  if (radios.length === 0) return;

  const select = (target: HTMLButtonElement): void => {
    const value = target.dataset.value ?? '';
    for (const radio of radios) {
      radio.setAttribute('aria-checked', String(radio === target));
      radio.tabIndex = radio === target ? 0 : -1;
    }
    for (const panel of document.querySelectorAll<HTMLElement>(`[data-${options.datasetKey}]`)) {
      panel.hidden = panel.dataset[options.datasetKey] !== value;
    }
    options.onChange?.(value);
  };

  for (const radio of radios) {
    radio.addEventListener('click', () => select(radio));
  }

  root.addEventListener('keydown', (event) => {
    const isNext = NEXT_KEYS.includes(event.key);
    const isPrev = PREV_KEYS.includes(event.key);
    if (!isNext && !isPrev) return;
    event.preventDefault();
    const current = radios.findIndex((radio) => radio.getAttribute('aria-checked') === 'true');
    const offset = isNext ? 1 : -1;
    const next = radios[(current + offset + radios.length) % radios.length];
    select(next);
    next.focus();
  });

  const initial = radios.find((radio) => radio.getAttribute('aria-checked') === 'true') ?? radios[0];
  for (const radio of radios) radio.tabIndex = radio === initial ? 0 : -1;
}
```

`src/islands/sequence.ts`:

```ts
export const SEQUENCE_STEP_MS = 700;
const STEP_TO_KEY: Record<string, string> = {
  '1': 'category',
  '2': 'title',
  '3': 'subtitle',
  '4': 'heroImage',
  '5': 'chapters',
};

function setStep(stage: HTMLElement, step: number): void {
  for (const el of stage.querySelectorAll<HTMLElement>('.hx')) {
    el.classList.toggle('on', Number(el.dataset.step) <= step);
  }
  for (const line of stage.querySelectorAll<HTMLElement>('.jl[data-key]')) {
    line.classList.toggle('lit', line.dataset.key === STEP_TO_KEY[String(step)]);
  }
}

export function playSequence(stage: HTMLElement): void {
  const steps = stage.querySelectorAll('.hx').length;
  const replay = stage.querySelector<HTMLElement>('[data-role="replay"]');
  stage.dataset.state = 'playing';
  setStep(stage, 0);
  let current = 0;
  const tick = (): void => {
    current += 1;
    setStep(stage, current);
    if (current < steps) {
      window.setTimeout(tick, SEQUENCE_STEP_MS);
      return;
    }
    stage.dataset.state = 'done';
    if (replay) replay.hidden = false;
  };
  window.setTimeout(tick, SEQUENCE_STEP_MS);
}

export function initSequence(stage: HTMLElement): void {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    stage.dataset.state = 'static';
    return;
  }
  stage.querySelector<HTMLElement>('[data-role="replay"]')?.addEventListener('click', () => playSequence(stage));
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      playSequence(stage);
    },
    { threshold: 0.35 }
  );
  observer.observe(stage);
}
```

`src/islands/copy.ts`:

```ts
const COPIED_RESET_MS = 1600;

export function initCopyButton(button: HTMLElement): void {
  button.addEventListener('click', async () => {
    const text = button.dataset.copyText ?? '';
    try {
      await navigator.clipboard.writeText(text);
      button.dataset.copied = 'true';
      window.setTimeout(() => delete button.dataset.copied, COPIED_RESET_MS);
    } catch {
      button.dataset.copied = 'failed';
    }
  });
}
```

`src/islands/theme.ts`:

```ts
export function initThemeToggle(button: HTMLElement): void {
  button.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('druck-theme', next);
    } catch {}
  });
}
```

`src/islands/rail.ts`:

```ts
export function initProgressRail(rail: HTMLElement): void {
  let ticking = false;
  const update = (): void => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? window.scrollY / max : 0;
    rail.style.transform = `scaleX(${progress})`;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }, { passive: true });
  update();
}
```

(Add `transform-origin: left; transform: scaleX(0);` to the existing `.reading-progress` rule in styles.css while here — compositor-only width.)

`src/islands/surfaces.ts`:

```ts
export function initSurfaces(): void {
  const inkBands = document.querySelectorAll<HTMLElement>('[data-surface="ink"]');
  if (inkBands.length === 0) return;
  const visibleInk = new Set<Element>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visibleInk.add(entry.target);
        else visibleInk.delete(entry.target);
      }
      document.documentElement.dataset.surface = visibleInk.size > 0 ? 'ink' : 'paper';
    },
    { threshold: 0.32 }
  );
  for (const band of inkBands) observer.observe(band);
}
```

`src/islands/embeds.ts`:

```ts
const THEME_FONTS_ID = 'druck-theme-fonts';

async function activate(band: HTMLElement): Promise<void> {
  if (!document.getElementById(THEME_FONTS_ID)) {
    const link = document.createElement('link');
    link.id = THEME_FONTS_ID;
    link.rel = 'stylesheet';
    link.href = new URL('../styles/fonts-themes.css', import.meta.url).href;
    document.head.appendChild(link);
  }
  await import('@druck-editorial/widget');
  for (const widget of band.querySelectorAll<HTMLElement>('druck-article[data-src]')) {
    widget.setAttribute('src', widget.dataset.src ?? '');
  }
}

export function initEmbeds(band: HTMLElement): void {
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void activate(band);
    },
    { rootMargin: '600px 0px' }
  );
  observer.observe(band);
}
```

`src/islands/analyticsPanel.ts`:

```ts
import { ReadingTracker } from '@druck-editorial/analytics';

const MILESTONES = [25, 50, 75, 100];

function formatReadingTime(totalSeconds: number): string {
  if (totalSeconds < 60) return `${Math.round(totalSeconds)}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}m ${seconds}s`;
}

export function initAnalyticsPanel(articleRoot: HTMLElement): void {
  const metric = (name: string): HTMLElement | null =>
    document.querySelector(`[data-metric="${name}"]`);
  const announced = new Set<number>();
  let chaptersRead = 0;

  new ReadingTracker(articleRoot, 'landing-demo', {
    sendOn: 'manual',
    depthMilestones: MILESTONES,
    onDepth: (depth) => {
      const depthEl = metric('depth');
      if (depthEl) depthEl.textContent = String(depth);
      const fill = metric('depth-fill');
      if (fill) fill.style.width = `${depth}%`;
      const milestone = MILESTONES.filter((m) => depth >= m).at(-1);
      if (milestone === undefined || announced.has(milestone)) return;
      announced.add(milestone);
      const milestoneEl = metric('milestone');
      if (milestoneEl) milestoneEl.textContent = `${milestone}%`;
      const announcer = metric('announcer');
      if (announcer) announcer.textContent = `Reading depth ${milestone} percent`;
    },
    onActiveReading: (seconds) => {
      const timeEl = metric('time');
      if (timeEl) timeEl.textContent = formatReadingTime(seconds);
    },
    onChapterRead: () => {
      chaptersRead += 1;
      const chaptersEl = metric('chapters');
      if (chaptersEl) chaptersEl.textContent = String(chaptersRead);
    },
  });
}

export { formatReadingTime };
```

`src/main.ts`:

```ts
import './styles/fonts.css';
import './styles.css';
import './styles/landing.css';
import '@druck-editorial/css/article.css';
import copyIcon from './icons/copy.svg?raw';
import replayIcon from './icons/arrow-counter-clockwise.svg?raw';
import { initThemeToggle } from './islands/theme.js';
import { initCopyButton } from './islands/copy.js';
import { initProgressRail } from './islands/rail.js';
import { initSequence } from './islands/sequence.js';
import { initSwitcher } from './islands/switcher.js';
import { initSurfaces } from './islands/surfaces.js';
import { initEmbeds } from './islands/embeds.js';
import { initAnalyticsPanel } from './islands/analyticsPanel.js';

const ICONS: Record<string, string> = {
  copy: copyIcon,
  'arrow-counter-clockwise': replayIcon,
};

for (const slot of document.querySelectorAll<HTMLElement>('.icon-slot[data-icon]')) {
  slot.innerHTML = ICONS[slot.dataset.icon ?? ''] ?? '';
}

const themeButton = document.querySelector<HTMLElement>('[data-island="theme"]');
if (themeButton) initThemeToggle(themeButton);

for (const button of document.querySelectorAll<HTMLElement>('[data-island="copy"]')) {
  initCopyButton(button);
}

const rail = document.querySelector<HTMLElement>('[data-island="rail"]');
if (rail) initProgressRail(rail);

const stage = document.querySelector<HTMLElement>('[data-island="sequence"]');
if (stage) initSequence(stage);

for (const switcher of document.querySelectorAll<HTMLElement>('[data-island="switcher"]')) {
  const kind = switcher.dataset.switch;
  if (kind === 'format') initSwitcher(switcher, { datasetKey: 'format' });
  if (kind === 'lang') initSwitcher(switcher, { datasetKey: 'lang' });
  if (kind === 'accent') {
    initSwitcher(switcher, {
      datasetKey: 'accent-unused',
      onChange: (value) => {
        const shell = document.querySelector('.band4-article .article-shell');
        if (!shell) return;
        shell.className = shell.className.replace(/\bcat-[\w-]+\b/, value);
      },
    });
  }
}

initSurfaces();

const embedsBand = document.querySelector<HTMLElement>('[data-island="embeds"]');
if (embedsBand) initEmbeds(embedsBand);

const articleRoot = document.querySelector<HTMLElement>('.band4-article .article-shell');
if (articleRoot) initAnalyticsPanel(articleRoot);
```

The lang switcher relies on `data-lang` attributes that `renderSpecimenPanel` already emits. The accent switcher targets no panels (its dataset key matches nothing) and works purely through the callback.

- [ ] **Step 3: Delete Preact, run everything**

```bash
git rm apps/druck-app/src/App.tsx apps/druck-app/src/main.tsx
```

In `apps/druck-app/package.json` remove `preact`, `@preact/signals` from dependencies and `@preact/preset-vite` from devDependencies. In `vite.config.ts` remove the `preact` import and the `preact()` plugin call. Then:

```bash
pnpm install
pnpm --filter @druck-editorial/app test
pnpm --filter @druck-editorial/app typecheck
pnpm --filter @druck-editorial/app build
```

Expected: tests PASS, typecheck clean, build completes with prerendered HTML in `dist/index.html` (grep it: `grep -c article-shell apps/druck-app/dist/index.html` returns at least 4).

- [ ] **Step 4: Dev smoke**

Run `pnpm dev`. Expected: sequence plays once on scroll into view, replay works, all three switchers switch (mouse and arrow keys), accents recolor the article, surface goes ink at band 5, widgets render inside all four frames with their type themes, analytics numbers move as you read, copy buttons copy.

- [ ] **Step 5: Commit**

```bash
git add -A apps/druck-app/src apps/druck-app/package.json apps/druck-app/vite.config.ts pnpm-lock.yaml
git commit -m "feat: vanilla islands replace Preact app shell"
```

### Task 9: Behavioral E2E, accessibility, and keyboard suites

**Files:**
- Create: `apps/druck-app/playwright.config.ts`
- Create: `apps/druck-app/tests/landing.spec.ts`, `apps/druck-app/tests/a11y.spec.ts`, `apps/druck-app/tests/keyboard.spec.ts`

- [ ] **Step 1: Install Playwright**

Add to `apps/druck-app/package.json` devDependencies: `"@playwright/test": "^1.50.0"`, `"@axe-core/playwright": "^4.10.0"`, and scripts `"test:e2e": "playwright test"`. Then:

```bash
pnpm install
pnpm --filter @druck-editorial/app exec playwright install chromium
```

- [ ] **Step 2: playwright.config.ts**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'pnpm preview',
    port: 4173,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
```

Run `pnpm --filter @druck-editorial/app build` once before E2E so `preview` has a dist.

- [ ] **Step 3: Behavioral spec — every feature, real assertions**

Create `tests/landing.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test.describe('band 1 — transformation', () => {
  test('sequence plays to done and replay restarts it', async ({ page }) => {
    await page.goto('/');
    const stage = page.locator('[data-island="sequence"]');
    await stage.scrollIntoViewIfNeeded();
    await expect(stage).toHaveAttribute('data-state', 'done', { timeout: 8000 });
    await expect(stage.locator('.hx[data-step="5"]')).toHaveClass(/on/);
    const replay = stage.locator('[data-role="replay"]');
    await expect(replay).toBeVisible();
    await replay.click();
    await expect(stage).toHaveAttribute('data-state', 'playing');
    await expect(stage).toHaveAttribute('data-state', 'done', { timeout: 8000 });
  });

  test('reduced motion renders the complete static state', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('http://localhost:4173/');
    const stage = page.locator('[data-island="sequence"]');
    await expect(stage).toHaveAttribute('data-state', 'static');
    await expect(stage.locator('[data-role="replay"]')).toBeHidden();
    await context.close();
  });
});

test.describe('band 2 — formats', () => {
  test('switching format swaps panel and caption', async ({ page }) => {
    await page.goto('/');
    await page.locator('.band-formats').scrollIntoViewIfNeeded();
    await page.getByRole('radio', { name: 'Wire' }).click();
    await expect(page.locator('.format-panel[data-format="wire"]')).toBeVisible();
    await expect(page.locator('.format-panel[data-format="feature"]')).toBeHidden();
    await expect(page.locator('.format-caption[data-format="wire"]')).toBeVisible();
    await expect(page.locator('.format-panel[data-format="wire"] .post-simple')).toBeVisible();
  });
});

test.describe('band 3 — languages', () => {
  test('language chips swap specimens with correct lang attribute', async ({ page }) => {
    await page.goto('/');
    await page.locator('.band-langs').scrollIntoViewIfNeeded();
    await page.getByRole('radio', { name: 'DE' }).click();
    const german = page.locator('.specimen-panel[lang="de"]');
    await expect(german).toBeVisible();
    await expect(german).toContainText('Sicherheitslückenausnutzung');
    await expect(page.locator('.specimen-panel[lang="en"]')).toBeHidden();
  });
});

test.describe('band 4 — article, accents, analytics', () => {
  test('article is prerendered into the HTML before JS', async ({ page }) => {
    const response = await page.request.get('/');
    const html = await response.text();
    expect(html).toContain('article-shell');
    expect(html).toContain('The Quiet');
  });

  test('accent chip recolors the article shell', async ({ page }) => {
    await page.goto('/');
    await page.locator('.band-article').scrollIntoViewIfNeeded();
    await page.getByRole('radio', { name: 'Security' }).click();
    await expect(page.locator('.band4-article .article-shell')).toHaveClass(/cat-security/);
  });

  test('reading the article moves the analytics metrics', async ({ page }) => {
    await page.goto('/');
    const article = page.locator('.band4-article');
    await article.scrollIntoViewIfNeeded();
    await article.evaluate((el) => el.scrollTo(0, el.scrollHeight / 2));
    await page.waitForTimeout(1500);
    const depth = page.locator('[data-metric="depth"]');
    await expect(depth).not.toHaveText('0', { timeout: 8000 });
  });
});

test.describe('band 5 — widgets in the wild', () => {
  test('all four frames render live shadow-dom articles with their stories', async ({ page }) => {
    await page.goto('/');
    await page.locator('.band-wild').scrollIntoViewIfNeeded();
    const expectations: Array<[string, string]> = [
      ['.frame--music', 'Glass Anatomy'],
      ['.frame--fashion', 'Uniform'],
      ['.frame--tech', 'Claude'],
      ['.frame--markets', 'Bitcoin'],
    ];
    for (const [frame, text] of expectations) {
      const widget = page.locator(`${frame} druck-article`);
      await expect(widget).toBeVisible();
      await expect
        .poll(async () => widget.evaluate((el) => el.shadowRoot?.textContent ?? ''), { timeout: 10000 })
        .toContain(text);
    }
  });

  test('surface turns ink at band 5 and back to paper at the hero', async ({ page }) => {
    await page.goto('/');
    await page.locator('.band-wild').scrollIntoViewIfNeeded();
    await expect(page.locator('html')).toHaveAttribute('data-surface', 'ink');
    await page.locator('.band-hero').scrollIntoViewIfNeeded();
    await expect(page.locator('html')).toHaveAttribute('data-surface', 'paper');
  });
});

test.describe('chrome', () => {
  test('theme toggle persists across reload', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-island="theme"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('no horizontal scroll at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);
  });

  test('page renders all bands with JavaScript disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('http://localhost:4173/');
    await expect(page.locator('.band')).toHaveCount(6);
    await expect(page.locator('.band4-article .article-shell')).toBeVisible();
    await context.close();
  });
});
```

- [ ] **Step 4: a11y spec**

Create `tests/a11y.spec.ts`:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`axe finds no violations in ${theme} theme`, async ({ page }) => {
    await page.goto('/');
    await page.evaluate((t) => {
      document.documentElement.dataset.theme = t;
    }, theme);
    await page.locator('.band-colophon').scrollIntoViewIfNeeded();
    await page.locator('.band-hero').scrollIntoViewIfNeeded();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
```

- [ ] **Step 5: keyboard spec**

Create `tests/keyboard.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('skip link is first tab stop and jumps to main', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  expect(page.url()).toContain('#main');
});

test('format radiogroup follows arrow-key semantics', async ({ page }) => {
  await page.goto('/');
  await page.locator('.format-switch').scrollIntoViewIfNeeded();
  await page.getByRole('radio', { name: 'Feature' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Quick Take' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.format-panel[data-format="quick_take"]')).toBeVisible();
});

test('every interactive control is reachable and focus-visible', async ({ page }) => {
  await page.goto('/');
  const selectors = ['[data-island="theme"]', '.demo-cta', '.format-switch button', '.lang-switch button', '.accent-switch button'];
  for (const selector of selectors) {
    const el = page.locator(selector).first();
    await el.focus();
    await expect(el).toBeFocused();
  }
});
```

- [ ] **Step 6: Run and commit**

```bash
pnpm --filter @druck-editorial/app build
pnpm --filter @druck-editorial/app test:e2e
```

Expected: all specs PASS. Fix regressions before committing (common first-run failures: surface threshold needing 0.32→0.25 on short viewports, widget poll timeout on cold start — bump to 15000 only if the failure is startup latency, not behavior).

```bash
git add apps/druck-app/playwright.config.ts apps/druck-app/tests apps/druck-app/package.json pnpm-lock.yaml
git commit -m "test: behavioral, accessibility, and keyboard suites for the landing"
```

---

### Task 10: Visual regression suite

**Files:**
- Create: `apps/druck-app/tests/visual.spec.ts`

- [ ] **Step 1: Write the suite**

```ts
import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  { name: 'xs', width: 320, height: 720 },
  { name: 'sm', width: 375, height: 812 },
  { name: 'md', width: 768, height: 1024 },
  { name: 'lg', width: 1024, height: 768 },
  { name: 'xl', width: 1440, height: 900 },
];
const BANDS = ['.band-hero', '.band-formats', '.band-langs', '.band-article', '.band-wild', '.band-colophon'];

for (const viewport of VIEWPORTS) {
  for (const theme of ['light', 'dark'] as const) {
    test(`bands at ${viewport.name} in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t;
      }, theme);
      for (const band of BANDS) {
        await page.locator(band).scrollIntoViewIfNeeded();
        await page.waitForTimeout(450);
        await expect(page.locator(band)).toHaveScreenshot(
          `${band.slice(6)}-${viewport.name}-${theme}.png`,
          { maxDiffPixelRatio: 0.02, animations: 'disabled' }
        );
      }
    });
  }
}
```

Reduced motion is forced so the hero screenshots capture the deterministic static state; the sequence's animated path is covered behaviorally in Task 9.

- [ ] **Step 2: Baseline, eyeball, commit**

```bash
pnpm --filter @druck-editorial/app exec playwright test tests/visual.spec.ts --update-snapshots
```

Open `tests/visual.spec.ts-snapshots/` and review every image at xs and xl in both themes — this is the design review in file form. Fix anything broken before accepting baselines.

```bash
git add apps/druck-app/tests/visual.spec.ts apps/druck-app/tests/visual.spec.ts-snapshots
git commit -m "test: visual regression baselines across viewports and themes"
```

---

### Task 11: Lighthouse audit gate and honest colophon numbers

**Files:**
- Create: `apps/druck-app/scripts/audit.mjs`
- Create (generated): `apps/druck-app/audit/summary.json`

- [ ] **Step 1: Write the audit script**

```js
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const APP_DIR = join(import.meta.dirname, '..');
const AUDIT_DIR = join(APP_DIR, 'audit');
const REPORT_PATH = join(AUDIT_DIR, 'lighthouse.json');
const SUMMARY_PATH = join(AUDIT_DIR, 'summary.json');
const TARGET_URL = 'http://localhost:4173/';
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const INITIAL_TRANSFER_BUDGET_KB = 250;
const HERO_IMAGE_PATTERN = /\/img\/.+\.webp/;

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.on('exit', (code) => (code === 0 ? resolve(child) : reject(new Error(`${command} exited ${code}`))));
    child.on('error', reject);
  });
}

const preview = spawn('pnpm', ['preview'], { cwd: APP_DIR, stdio: 'ignore', detached: true });
await new Promise((resolve) => setTimeout(resolve, 2500));

try {
  mkdirSync(AUDIT_DIR, { recursive: true });
  await run('npx', [
    '-y', 'lighthouse', TARGET_URL,
    `--only-categories=${CATEGORIES.join(',')}`,
    '--output=json', `--output-path=${REPORT_PATH}`,
    '--chrome-flags=--headless=new', '--quiet',
  ]);

  const report = JSON.parse(readFileSync(REPORT_PATH, 'utf8'));
  const scores = Object.fromEntries(
    CATEGORIES.map((key) => [key, Math.round(report.categories[key].score * 100)])
  );
  const networkItems = report.audits['network-requests'].details.items;
  const initialTransferKB = Math.round(
    networkItems
      .filter((item) => !HERO_IMAGE_PATTERN.test(item.url))
      .reduce((sum, item) => sum + (item.transferSize ?? 0), 0) / 1024
  );

  const summary = {
    scores,
    totalTransferKB: initialTransferKB,
    lighthouseVersion: report.lighthouseVersion,
    measuredAt: report.fetchTime.slice(0, 10),
  };
  writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2) + '\n');

  const failures = [];
  for (const [key, value] of Object.entries(scores)) {
    if (value < 100) failures.push(`${key}: ${value}`);
  }
  if (initialTransferKB > INITIAL_TRANSFER_BUDGET_KB) {
    failures.push(`initial transfer ${initialTransferKB} KB exceeds ${INITIAL_TRANSFER_BUDGET_KB} KB`);
  }

  console.log(JSON.stringify(summary, null, 2));
  if (failures.length > 0) {
    console.error(`AUDIT FAILED:\n${failures.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log('AUDIT PASSED: 100 / 100 / 100 / 100 within budget');
  }
} finally {
  process.kill(-preview.pid, 'SIGTERM');
}
```

Note `detached: true` plus `process.kill(-pid)` tears down the whole preview process group.

Add script to `apps/druck-app/package.json`: `"audit": "node scripts/audit.mjs"`.

- [ ] **Step 2: Build, audit, iterate to 100x4**

```bash
pnpm --filter @druck-editorial/app build
pnpm --filter @druck-editorial/app audit
```

Expected: `AUDIT PASSED` with four 100s. If a category lands below 100, the report names the failing audits — fix, rebuild, rerun. The likely suspects and their fixes: render-blocking theme-fonts link (must only be injected by the embeds island, never in head), missing image dimensions (every `img` the engine and prerenderer emit carries width/height), contrast on muted ink text (lighten `--ink-text-secondary` until it passes 4.5:1).

- [ ] **Step 3: Bake the measured numbers into the colophon**

```bash
pnpm --filter @druck-editorial/app build
grep -o 'Measured with Lighthouse [^<]*' apps/druck-app/dist/index.html
```

Expected: the colophon method line now carries the real version, date, and transfer size (the plugin picked up `audit/summary.json`). Re-run `pnpm --filter @druck-editorial/app test:e2e` to confirm nothing regressed.

- [ ] **Step 4: Commit**

```bash
git add apps/druck-app/scripts/audit.mjs apps/druck-app/audit/summary.json apps/druck-app/package.json
git commit -m "feat: lighthouse audit gate writes measured colophon numbers"
```

---

### Task 12: Final sweep — coverage, full build, checklist

- [ ] **Step 1: Coverage gate**

Run: `pnpm --filter @druck-editorial/app test:coverage`
Expected: PASS with islands and prerender at or above the 80 percent thresholds configured in Task 1. If a file falls short, the missing branches are almost certainly error paths — cover them with a test, do not delete the threshold.

- [ ] **Step 2: Whole-workspace health**

```bash
pnpm -r typecheck
pnpm -r test
pnpm --filter @druck-editorial/app build
pnpm --filter @druck-editorial/app test:e2e
pnpm --filter @druck-editorial/app audit
```

Expected: everything green.

- [ ] **Step 3: Manual checklist (one pass, both themes)**

- Sequence: plays once, replay replays, reduced-motion shows static annotated state.
- Switchers: mouse, arrow keys, visible focus rings, no layout shift on swap.
- Band 5: four frames, four different typographic identities, widgets readable inside their viewports on a phone-width screen.
- Surfaces: paper to ink and back, instant under reduced motion.
- Colophon: real numbers, copy buttons work, View Source actually shows the article HTML.
- 320px: nothing overflows, every control is tappable.

- [ ] **Step 4: Update CLAUDE.md workspace map and commit**

Add one line to the repo `CLAUDE.md` Workspace section: `apps/druck-app` is the landing/demo (static prerender + islands; no Preact). Then:

```bash
git add CLAUDE.md
git commit -m "docs: note landing architecture in workspace map"
```

---

## Plan self-review (against the spec)

- Spec coverage: bands 1-6 → Tasks 6-8; engine schema → Task 3; fixtures incl. diverse frames and specimens → Task 4; prerender → Tasks 5-6; fonts/icons/images self-hosted with Bunny-as-source → Task 2; surface system → Tasks 7-8; analytics reframe → Tasks 6 and 8; colophon honesty → Task 11; the six folded-in bug fixes → favicon and fonts (Task 2), Unsplash removal (Task 4), legacy scripts and mobile tab bar (Tasks 6-7, deletion and prune), infinite-spinner class eliminated with the runtime-fetch demo path (Tasks 5-8, widget fetches keep the widget's built-in error state); testing plan → Tasks 1, 9, 10, 11, 12.
- Spec deviations, both flagged during planning: Preact is removed in favor of vanilla islands (spec named Preact as the hydration vehicle; behavior contract — no flash, hydrate on top — is kept and tested by the JS-disabled and prerender specs); band 2 panels are prerendered rather than fetch-rendered, so the spec's band-2 error card has no runtime trigger and is dropped — fixture failures now fail the build inside `buildLandingHtml`, which is strictly earlier and louder.
- No placeholders: every step carries code, content, or an exact command; the two measured values (font filenames, image dimensions) are obtained by explicit commands in their tasks.
- Type consistency: `initSwitcher(root, { datasetKey, onChange })`, `playSequence(stage)`, `buildLandingHtml(template, fixturesDir, auditSummary)`, `renderColophonScores(summary)` are used with identical signatures everywhere they appear.

