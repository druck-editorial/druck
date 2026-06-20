# Druck Front-Page Looks — Implementation Plan (Part 3: the immersive showcase)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the landing showcase — "One feed. Twenty ways." — a zero-JS click-to-launch immersive scroll-morph that renders the same feed through all 20 looks: the 8 engine looks (already built) plus 12 new landing-local spectacle looks (Aqua, Aero, Vaporwave, Memphis, Risograph, Zine, Terminal, Bloomberg, Letterpress, Bauhaus, Tabloid, Neubrutalism).

**Architecture:** The druck landing is prerendered HTML (`prerender/render-bands.mjs` fills `<!--druck:...-->` placeholders in `index.html`) plus tiny vanilla islands. This plan renders all 20 looks at BUILD time: the 8 engine looks via `renderFrontPage(buildFrontPage(snapshot), {look})` (already imported in render-bands), the 12 spectacle looks via new landing-local composer functions in `prerender/spectacle.mjs`. A new band carries the teaser + a `<a href="#showcase">` CTA; the experience is a fullscreen `#showcase:target` overlay (zero JS) containing scroll-snap sections that rise on `animation-timeline: view()`. The engine looks are styled for free by `src/styles/feed-global.css` (which `@import`s the engine `feed.css` with all 8 look themes); the overlay mechanics + 12 spectacle themes live in a new `src/styles/showcase.css`. A working reference prototype exists at `.superpowers/sdd/showcase-prototype.mjs` (proves the framework + Aqua/Aero).

**Tech Stack:** Node ESM prerender (`.mjs`), `@druck-editorial/engine`, plain CSS, vanilla islands, Vitest for prerender unit tests, Playwright for the app's visual baselines.

**Scope note — Part 3 of a tiered build.** Parts 1-2 (engine: classic + 8 looks) are on branch `feat/front-page-looks`. This part is landing-only — it touches `apps/druck-app`, never the engine packages. Spec: `docs/superpowers/specs/2026-06-20-druck-front-page-looks-design.md`.

## Global Constraints

- Zero client JS in the showcase: the launch is a CSS `:target`, the scroll-morph is CSS `scroll-snap` + `animation-timeline: view()` (gated by `@supports` + `prefers-reduced-motion`). The landing's existing island JS is NOT used for the showcase.
- Spectacle looks are LANDING-LOCAL — composer functions in `apps/druck-app/prerender/spectacle.mjs`, never added to `@druck-editorial/engine` or its `FrontPageLook` union.
- Every source file keeps its SPDX header (`// SPDX-License-Identifier: MIT` + copyright for JS; the `/* ... | ... */` single-line form for CSS). No other source comments beyond short CSS section labels. No emojis. No non-ASCII bytes (HTML entities like `&mdash;` are ASCII and allowed).
- No external CDN/font deps. The band + overlay use the landing's already-loaded fonts: `Plus Jakarta Sans` (headings), `Source Serif 4` (serif/italic accents), `IBM Plex Mono` (labels). Textures are inline `data:` SVG or CSS gradients.
- Every user-supplied value escaped: text via `escapeHtml`, every `href`/`src` via `safeUrl` (both are imported from `@druck-editorial/engine`; spectacle composers must use them).
- Each spectacle look scoped under `.sx-{look}` (no cross-look bleed); the overlay under `#showcase`/`.sc-*`.
- The existing landing bands, Lighthouse 100x4, and the <= 250 KB base-landing transfer budget must not regress. The showcase CSS + spectacle imagery load with the page; measure with `node scripts/audit.mjs`. If the base landing approaches budget, the showcase CSS may be split to load on `:target` — note it, do not silently exceed.
- Conventional commits; no `Co-Authored-By`. Run `git commit -m "..."` standalone (no `-q`, no `&&`); stage files by name; never stage `apps/druck-app/public/feed.css` or `.../sonto-snapshot.json` (build artifacts).
- Run from `/var/www/druck`. App tests: `pnpm --filter @druck-editorial/app test`. Prerender unit tests live in `apps/druck-app/prerender/*.test.mjs` and `apps/druck-app/tests-unit/`.

---

## File Structure

- `apps/druck-app/prerender/spectacle.mjs` — NEW. The 12 landing-local spectacle composers + a `SPECTACLE` registry `[{ key, name, render }]`. Each `render(items)` returns an HTML string scoped under `.sx-{key}`.
- `apps/druck-app/prerender/spectacle.test.mjs` — NEW. Per-look unit tests (scoping + escaping).
- `apps/druck-app/prerender/render-bands.mjs` — MODIFY. Add `renderShowcase(snapshot)` (8 engine looks via the engine + the 12 spectacle looks via `SPECTACLE`); wire it into `buildLandingHtml` at a new `<!--druck:showcase-->` placeholder.
- `apps/druck-app/prerender/render-bands.test.mjs` — MODIFY. Assert the showcase band + overlay render with all 20 look sections.
- `apps/druck-app/index.html` — MODIFY. Add the showcase teaser band markup + the `<!--druck:showcase-->` placeholder for the overlay; add `<link rel="stylesheet" href="/src/styles/showcase.css">` to the head.
- `apps/druck-app/src/styles/showcase.css` — NEW. Band styling + overlay `:target` + scroll-morph mechanics + intro/outro + the 12 `.sx-{look}` themes.

Spectacle keys/prefixes: `aqua`, `aero`, `vaporwave`, `memphis`, `riso`, `zine`, `terminal`, `bloomberg`, `letterpress`, `bauhaus`, `tabloid`, `neubrutalism` — each scoped `.sx-{key}`.

Build order: framework first (Tasks 1-3: the spectacle module seeded with Aqua/Aero, the render wiring, the CSS shell), then the remaining 10 spectacle looks (Tasks 4-13), each a composer + theme + test, picked up automatically by `renderShowcase`.

---

## Task 1: Spectacle composer module + Aqua + Aero

**Files:**
- Create: `apps/druck-app/prerender/spectacle.mjs`
- Test: `apps/druck-app/prerender/spectacle.test.mjs`

**Interfaces:**
- Produces:
  - `partition(items)` -> `{ lead, rest }` (lead = first item, rest = the remainder; mirrors the engine's ranking by reusing `buildFrontPage`)
  - `safeHref(item)` / `safeImg(item)` (local: `escapeHtml(safeUrl(...) || fallback)`)
  - `composeAqua(items)`, `composeAero(items)` -> HTML scoped under `.sx-aqua` / `.sx-aero`
  - `export const SPECTACLE = [{ key: 'aqua', name: 'Aqua', render: composeAqua }, { key: 'aero', name: 'Aero', render: composeAero }]`

- [ ] **Step 1: Write the failing test**

Create `apps/druck-app/prerender/spectacle.test.mjs`:

```js
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { describe, expect, it } from 'vitest';
import { SPECTACLE } from './spectacle.mjs';

const items = [
  { title: '<script>x</script>', subtitle: 'S', category: 'business', publishedAt: 'May 07, 2026',
    heroImage: 'https://example.com/a.webp', shareUrl: 'javascript:alert(1)', hot: true },
  { title: 'Two', subtitle: 'S2', category: 'startup', publishedAt: 'May 07, 2026',
    heroImage: 'https://example.com/b.webp', shareUrl: 'https://example.com/b/' },
  { title: 'Three', subtitle: 'S3', category: 'science', publishedAt: 'May 06, 2026',
    heroImage: 'https://example.com/c.webp', shareUrl: 'https://example.com/c/' },
];

describe('spectacle looks', () => {
  for (const { key, render } of SPECTACLE) {
    it(`${key}: scopes, renders, and escapes`, () => {
      const html = render(items);
      expect(html).toContain(`sx-${key}`);
      expect(html).not.toContain('<script>x</script>');
      expect(html).not.toContain('javascript:alert(1)');
    });
  }
});
```

This loops over `SPECTACLE`, so it covers every look added in later tasks too.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @druck-editorial/app test`
Expected: FAIL — `./spectacle.mjs` does not exist.

- [ ] **Step 3: Implement the module**

Create `apps/druck-app/prerender/spectacle.mjs`:

```js
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { buildFrontPage, escapeHtml, safeUrl } from '@druck-editorial/engine';

export function partition(items) {
  const rows = buildFrontPage(items);
  const lead = rows.find((r) => r.type === 'hero')?.items[0];
  const rest = rows.filter((r) => r.type !== 'hero').flatMap((r) => r.items);
  return { lead, rest };
}

const href = (item) => escapeHtml(safeUrl(item.shareUrl ?? '') || '#');
const img = (item) => escapeHtml(safeUrl(item.heroImage) || 'data:,');

function composeAqua(items) {
  const { lead, rest } = partition(items);
  return `<div class="sx-aqua"><div class="aq-win">` +
    `<div class="aq-bar"><i class="r"></i><i class="y"></i><i class="g"></i><span class="aq-t">Druck</span></div>` +
    `<div class="aq-body">` +
    (lead ? `<a class="aq-lead" href="${href(lead)}"><img src="${img(lead)}" alt="" loading="lazy" width="1200" height="675"><div class="aq-txt"><div class="aq-k">${escapeHtml(lead.category)}</div><h2>${escapeHtml(lead.title)}</h2><p>${escapeHtml(lead.subtitle)}</p><span class="aq-btn">Read</span></div></a>` : '') +
    `<ul class="aq-list">${rest.slice(0, 7).map((i) => `<li><a href="${href(i)}"><span class="aq-dot"></span>${escapeHtml(i.title)}</a></li>`).join('')}</ul>` +
    `</div></div></div>`;
}

function composeAero(items) {
  const { lead, rest } = partition(items);
  return `<div class="sx-aero"><div class="ae-glass"><div class="ae-orb"></div>` +
    (lead ? `<a class="ae-lead" href="${href(lead)}"><div class="ae-k">${escapeHtml(lead.category)}</div><h2>${escapeHtml(lead.title)}</h2><p>${escapeHtml(lead.subtitle)}</p></a>` : '') +
    `<ul class="ae-list">${rest.slice(0, 6).map((i) => `<li><a href="${href(i)}">${escapeHtml(i.title)}</a></li>`).join('')}</ul>` +
    `</div></div>`;
}

export const SPECTACLE = [
  { key: 'aqua', name: 'Aqua', render: composeAqua },
  { key: 'aero', name: 'Aero', render: composeAero },
];
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @druck-editorial/app test`
Expected: PASS — both aqua/aero cases (scoping + escaping).

- [ ] **Step 5: Commit**

```bash
git add apps/druck-app/prerender/spectacle.mjs apps/druck-app/prerender/spectacle.test.mjs
```
then:
```bash
git commit -m "feat(showcase): add spectacle composer module with aqua and aero"
```

---

## Task 2: renderShowcase + band + overlay wiring

**Files:**
- Modify: `apps/druck-app/prerender/render-bands.mjs`
- Modify: `apps/druck-app/index.html`
- Test: `apps/druck-app/prerender/render-bands.test.mjs`

**Interfaces:**
- Consumes: `buildFrontPage`, `renderFrontPage` (already imported in render-bands), `SPECTACLE` from `./spectacle.mjs`.
- Produces: `renderShowcase(items)` returning the overlay HTML (intro + 20 `<section class="ms">` look sections + outro + close), injected at `<!--druck:showcase-->`. The teaser band markup is static in `index.html`.

- [ ] **Step 1: Write the failing test**

Add to `apps/druck-app/prerender/render-bands.test.mjs`:

```js
import { renderShowcase } from './render-bands.mjs';

describe('renderShowcase', () => {
  const items = [
    { title: 'Lead', subtitle: 'S', category: 'ai', publishedAt: 'Jun 10, 2026', heroImage: 'https://e.com/a.webp', shareUrl: 'https://e.com/a/', hot: true },
    { title: 'Two', subtitle: 'S2', category: 'startup', publishedAt: 'Jun 10, 2026', heroImage: 'https://e.com/b.webp', shareUrl: 'https://e.com/b/' },
    { title: 'Three', subtitle: 'S3', category: 'science', publishedAt: 'Jun 09, 2026', heroImage: 'https://e.com/c.webp', shareUrl: 'https://e.com/c/' },
  ];
  it('renders engine and spectacle look sections inside the overlay', () => {
    const html = renderShowcase(items);
    expect(html).toContain('class="sc-intro"');
    expect(html).toContain('druck-front-page--brutalist');
    expect(html).toContain('druck-front-page--almanac');
    expect(html).toContain('sx-aqua');
    expect(html).toContain('sx-aero');
    expect(html).toContain('class="sc-close"');
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `pnpm --filter @druck-editorial/app test` → FAIL (`renderShowcase` not exported).

- [ ] **Step 3: Implement renderShowcase**

In `apps/druck-app/prerender/render-bands.mjs`, add the import near the top (after the engine import):

```js
import { SPECTACLE } from './spectacle.mjs';
```

Add the function (place it near `renderFrontPageBand`):

```js
const SHOWCASE_ENGINE_LOOKS = ['brutalist', 'swiss', 'helvetica', 'broadsheet', 'luxury', 'noir', 'bento', 'almanac'];

export function renderShowcase(items) {
  const engineSections = SHOWCASE_ENGINE_LOOKS.map((look) => ({
    name: `${look} (engine)`,
    html: renderFrontPage(buildFrontPage(items), { look }),
  }));
  const spectacleSections = SPECTACLE.map(({ key, name, render }) => ({
    name: `${name} (spectacle)`,
    html: render(items),
  }));
  const sections = [...engineSections, ...spectacleSections];
  const morph = sections
    .map((s, i) =>
      `<section class="ms"><div class="ms-label">${String(i + 1).padStart(2, '0')} / ${escapeHtml(s.name)}</div>` +
      `<div class="ms-look reveal">${s.html}</div></section>`,
    )
    .join('');
  return (
    '<a class="sc-close" href="#" aria-label="Close showcase">Close</a>' +
    '<section class="sc-intro"><div><div class="sc-eye">One feed</div>' +
    '<h2>Twenty ways to print the same news.</h2>' +
    '<p>The same stories. Scroll, and watch the front page transform.</p>' +
    '<div class="sc-dn">scroll</div></div></section>' +
    morph +
    '<section class="sc-outro"><div><div class="sc-big">20 looks</div><p>Zero bytes of JavaScript.</p></div></section>'
  );
}
```

Wire it into `buildLandingHtml`: add `renderShowcase(frontPageSnapshot.data)` where the snapshot is available. Since `buildLandingHtml` already reads the snapshot for the front-page band via `renderFrontPageBand(fixturesDir)`, refactor so the snapshot is read once and shared:

```js
// inside buildLandingHtml, replace the renderFrontPageBand call with a shared snapshot read:
const snapshot = await readFixture(fixturesDir, 'sonto-snapshot.json');
// ...in the Promise.all destructure, drop frontPage from the parallel array and compute after:
const frontPage = renderFrontPage(buildFrontPage(snapshot.data));
const showcase = renderShowcase(snapshot.data);
// ...add to the .replace chain:
  .replace('<!--druck:showcase-->', () => showcase)
```

(If refactoring the snapshot read is risky, instead read it a second time inside the showcase branch — the file is small and the build is not hot-path. Prefer the shared read.)

- [ ] **Step 4: Add the band + placeholder to index.html**

In `apps/druck-app/index.html`, add the teaser band as a new `<section>` immediately after the existing front-page band's closing tag (find the band that contains `<!--druck:front-page-->`), and add the overlay container at the END of `<body>` (before the closing `</body>`):

Teaser band:
```html
<section class="band band-showcase" aria-labelledby="showcase-heading">
  <p class="band-eyebrow">One feed, twenty ways</p>
  <h2 class="band-title" id="showcase-heading">The same feed, <em>twenty magazines.</em></h2>
  <p class="band-lede">Druck ranks the stories once, then prints them as twenty different publications. Open the showcase and scroll &mdash; the front page changes its mind about what kind of paper it is. Zero JavaScript: the launch is a CSS <code>:target</code>, the motion is CSS scroll-timeline.</p>
  <a class="showcase-cta" href="#showcase">See all 20</a>
</section>
```

Overlay container (end of body):
```html
<div id="showcase" class="sc-overlay" role="dialog" aria-label="Twenty looks showcase"><!--druck:showcase--></div>
```

Add the stylesheet link in `<head>` after the `feed-global.css` link:
```html
  <link rel="stylesheet" href="/src/styles/showcase.css">
```

- [ ] **Step 5: Run to verify it passes** — `pnpm --filter @druck-editorial/app test` → PASS (renderShowcase test). Also `pnpm --filter @druck-editorial/app typecheck` if the app typechecks the prerender, else skip.

- [ ] **Step 6: Commit**

```bash
git add apps/druck-app/prerender/render-bands.mjs apps/druck-app/prerender/render-bands.test.mjs apps/druck-app/index.html
```
then:
```bash
git commit -m "feat(showcase): render the immersive band and overlay with all 20 looks"
```

---

## Task 3: Showcase CSS shell (band + overlay + scroll-morph + Aqua/Aero themes)

**Files:**
- Create: `apps/druck-app/src/styles/showcase.css`

**Interfaces:** Consumes the markup from Tasks 1-2 (`.band-showcase`, `.showcase-cta`, `#showcase`, `.sc-*`, `.ms*`, `.sx-aqua`, `.sx-aero`). Engine-look CSS is already present via `feed-global.css`.

- [ ] **Step 1: Create the stylesheet**

Create `apps/druck-app/src/styles/showcase.css` with the SPDX single-line header, then the band styling (using the landing's Plus Jakarta Sans / Source Serif 4 / IBM Plex Mono fonts and the existing `--demo-accent-clay` token), the overlay `:target` + scroll-morph mechanics, intro/outro, and the Aqua + Aero themes. Use this exact block (adapted from the validated prototype, fonts swapped to the landing's):

```css
/* SPDX-License-Identifier: MIT | Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com> */

/* Teaser band */
.band-showcase .band-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--demo-accent-clay); margin: 0 0 18px; }
.band-showcase .showcase-cta { display: inline-flex; align-items: center; gap: 12px; margin-top: 32px; background: var(--demo-text, #efeef2); color: var(--demo-bg, #101013); font-family: 'IBM Plex Mono', monospace; font-size: 14px; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 600; padding: 16px 26px; border-radius: 999px; text-decoration: none; transition: background 0.15s; }
.band-showcase .showcase-cta::after { content: '->'; }
.band-showcase .showcase-cta:hover { background: #d6ff00; }

/* Overlay (zero-JS :target launch) */
.sc-overlay { display: none; }
#showcase:target { display: block; position: fixed; inset: 0; z-index: 1000; background: #06060a; overflow-y: scroll; scroll-snap-type: y proximity; }
.sc-close { position: fixed; top: 18px; right: 20px; z-index: 1100; font: 600 13px/1 'IBM Plex Mono', monospace; letter-spacing: 0.1em; text-transform: uppercase; color: #06060a; background: #d6ff00; border-radius: 999px; padding: 10px 16px; text-decoration: none; }

/* Scroll-morph sections */
.ms { min-height: 100vh; scroll-snap-align: start; position: relative; padding-top: 54px; background: #06060a; }
.ms-label { position: sticky; top: 0; z-index: 10; background: #000; color: #9bff5a; font: 600 12px/1 'IBM Plex Mono', monospace; letter-spacing: 0.16em; text-transform: uppercase; padding: 10px 16px; }
.ms-look { max-width: 1180px; margin: 0 auto; }
.ms-look.reveal { animation: sc-rise linear both; animation-timeline: view(); animation-range: entry 2% cover 30%; }
@keyframes sc-rise { from { opacity: 0; transform: translateY(40px) scale(0.99); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .ms-look.reveal { animation: none; } }
@supports not (animation-timeline: view()) { .ms-look.reveal { animation: none; } }

/* Intro / outro */
.sc-intro, .sc-outro { min-height: 100vh; scroll-snap-align: start; display: grid; place-items: center; text-align: center; color: #fff; padding: 40px; }
.sc-intro { background: radial-gradient(120% 80% at 50% 0%, #1a1a26, #06060a); }
.sc-outro { background: radial-gradient(120% 80% at 50% 100%, #1a1a26, #06060a); }
.sc-eye { font: 600 13px/1 'IBM Plex Mono', monospace; letter-spacing: 0.32em; text-transform: uppercase; color: #9bff5a; margin-bottom: 22px; }
.sc-intro h2 { font-family: 'Source Serif 4', Georgia, serif; font-weight: 400; font-size: clamp(40px, 8vw, 96px); line-height: 1; letter-spacing: -0.01em; max-width: 14ch; margin: 0; }
.sc-intro p { margin-top: 20px; color: #b6b4c0; font-size: 18px; max-width: 42ch; }
.sc-dn { margin-top: 40px; font: 600 12px/1 'IBM Plex Mono', monospace; letter-spacing: 0.2em; text-transform: uppercase; }
.sc-dn::after { content: ' v'; }
.sc-big { font: 600 clamp(60px, 12vw, 150px)/1 'IBM Plex Mono', monospace; color: #9bff5a; }
.sc-outro p { color: #b6b4c0; margin-top: 14px; }

/* Aqua */
.sx-aqua { background: repeating-linear-gradient(#eef3fb, #eef3fb 1px, #e2eaf6 1px, #e2eaf6 2px); font-family: 'Lucida Grande', 'Helvetica Neue', sans-serif; padding: 40px clamp(16px, 4vw, 48px) 64px; }
.sx-aqua .aq-win { max-width: 1000px; margin: 0 auto; border-radius: 12px; overflow: hidden; border: 1px solid #93a9c8; box-shadow: 0 18px 48px rgba(40,70,120,0.3); background: #fff; }
.sx-aqua .aq-bar { height: 36px; background: linear-gradient(#fbfdff, #c1d2eb); display: flex; align-items: center; gap: 7px; padding: 0 14px; border-bottom: 1px solid #93a9c8; }
.sx-aqua .aq-bar i { width: 13px; height: 13px; border-radius: 50%; }
.sx-aqua .aq-bar .r { background: radial-gradient(circle at 35% 30%, #ff9d94, #e8453a); }
.sx-aqua .aq-bar .y { background: radial-gradient(circle at 35% 30%, #ffe08a, #e0a31f); }
.sx-aqua .aq-bar .g { background: radial-gradient(circle at 35% 30%, #b7f08a, #4fa024); }
.sx-aqua .aq-t { margin: 0 auto; font-size: 13px; font-weight: 600; color: #3a4a63; text-shadow: 0 1px 0 #fff; }
.sx-aqua .aq-body { padding: 22px; display: grid; grid-template-columns: 1.3fr 1fr; gap: 24px; }
.sx-aqua .aq-lead { text-decoration: none; color: #1f3350; display: block; }
.sx-aqua .aq-lead img { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 8px; border: 1px solid #c3d0e2; }
.sx-aqua .aq-k { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #5a76a0; margin: 12px 0 6px; }
.sx-aqua .aq-lead h2 { font-size: 26px; margin: 0 0 8px; font-weight: 700; line-height: 1.05; }
.sx-aqua .aq-lead p { margin: 0; color: #4a5e7c; font-size: 14px; line-height: 1.5; }
.sx-aqua .aq-btn { display: inline-block; margin-top: 14px; background: linear-gradient(#fbfdff, #b6cdec); border: 1px solid #7e9bc4; border-radius: 999px; padding: 6px 20px; font-size: 13px; color: #22405f; box-shadow: inset 0 1px 0 #fff; }
.sx-aqua .aq-list { list-style: none; margin: 0; padding: 0; }
.sx-aqua .aq-list li { border-bottom: 1px solid #e2eaf6; }
.sx-aqua .aq-list a { display: flex; align-items: center; gap: 10px; padding: 11px 0; color: #1f3350; text-decoration: none; font-size: 15px; }
.sx-aqua .aq-dot { width: 9px; height: 9px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #bfe0ff, #3b7fd0); flex: none; }

/* Aero */
.sx-aero { background: linear-gradient(160deg, #62a6db, #2e6aa6 55%, #143963); font-family: 'Segoe UI', 'Helvetica Neue', sans-serif; padding: 64px clamp(16px, 5vw, 64px); position: relative; }
.sx-aero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(120% 50% at 50% -10%, rgba(255,255,255,0.4), transparent); }
.sx-aero .ae-glass { position: relative; max-width: 760px; margin: 0 auto; background: rgba(255,255,255,0.16); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border: 1px solid rgba(255,255,255,0.5); border-radius: 18px; padding: 40px 44px; color: #fff; overflow: hidden; box-shadow: 0 30px 70px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.7); }
.sx-aero .ae-glass::after { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 42%; background: linear-gradient(rgba(255,255,255,0.34), transparent); }
.sx-aero .ae-orb { position: absolute; bottom: -50px; right: -40px; width: 180px; height: 180px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.85), rgba(120,200,255,0.2)); filter: blur(3px); }
.sx-aero .ae-lead { position: relative; display: block; color: #fff; text-decoration: none; }
.sx-aero .ae-k { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.9; margin-bottom: 10px; }
.sx-aero .ae-lead h2 { margin: 0; font-size: clamp(28px, 4vw, 46px); font-weight: 600; line-height: 1.05; text-shadow: 0 1px 4px rgba(0,0,0,0.3); }
.sx-aero .ae-lead p { margin: 12px 0 0; font-size: 15px; opacity: 0.92; }
.sx-aero .ae-list { position: relative; list-style: none; margin: 24px 0 0; padding: 18px 0 0; border-top: 1px solid rgba(255,255,255,0.3); }
.sx-aero .ae-list a { display: block; padding: 9px 0; color: #fff; text-decoration: none; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.14); }

@media (max-width: 760px) { .sx-aqua .aq-body { grid-template-columns: 1fr; } }
```

- [ ] **Step 2: Build + controller visual check**

Run `pnpm --filter @druck-editorial/app build` (confirm it builds). The controller then serves the built landing, clicks "See all 20", and confirms: the band reads in the landing style, the overlay launches via `:target`, the intro shows, scrolling reveals the 8 engine looks + Aqua + Aero, and Close returns to the page. (The implementer cannot view a browser; do not create a harness.)

- [ ] **Step 3: Commit**

```bash
git add apps/druck-app/src/styles/showcase.css
```
then:
```bash
git commit -m "feat(showcase): band, zero-JS target overlay, scroll-morph, aqua/aero themes"
```

---

## Tasks 4-13: the remaining 10 spectacle looks

Each task adds ONE landing-local composer to `prerender/spectacle.mjs` (and its entry to the `SPECTACLE` array) plus its `.sx-{key}` theme to `src/styles/showcase.css`. The Task 1 loop test (`for (const {key,render} of SPECTACLE}`) covers each automatically; `renderShowcase` picks each up automatically. Per task: add composer + registry entry, run the test (the new look's scoping + escaping case passes), add the CSS theme, build, controller visual check, commit.

Each composer follows the Aqua/Aero shape: `const { lead, rest } = partition(items);` then a look-specific lead block + a list of `rest`, every text via `escapeHtml`, every href via the local `href()`/`img()` helpers, scoped under `.sx-{key}`. Each commit message: `feat(showcase): add the {name} spectacle look`.

The composer + CSS for each look are specified below. Reference aesthetics are the validated `.superpowers/sdd/` gallery mockups.

### Task 4: Vaporwave (`sx-vaporwave`)
Composer: a centered chrome-glow headline over a neon grid horizon + a list.
```js
function composeVaporwave(items) {
  const { lead, rest } = partition(items);
  return `<div class="sx-vaporwave"><div class="vw-sun"></div><div class="vw-grid"></div><div class="vw-inner">` +
    (lead ? `<a class="vw-lead" href="${href(lead)}"><div class="vw-k">${escapeHtml(lead.category)}</div><h2>${escapeHtml(lead.title)}</h2></a>` : '') +
    `<ul class="vw-list">${rest.slice(0, 6).map((i) => `<li><a href="${href(i)}">${escapeHtml(i.title)}</a></li>`).join('')}</ul>` +
    `</div></div>`;
}
```
Add `{ key: 'vaporwave', name: 'Vaporwave', render: composeVaporwave }` to `SPECTACLE`.
CSS:
```css
.sx-vaporwave { position: relative; overflow: hidden; background: linear-gradient(#1b0b3a, #3a0b52 52%, #ff2d95); font-family: 'Arial Black', Arial, sans-serif; padding: 80px clamp(16px, 5vw, 64px); }
.sx-vaporwave .vw-sun { position: absolute; top: 40px; left: 50%; transform: translateX(-50%); width: 220px; height: 220px; border-radius: 50%; background: linear-gradient(#ffe53b, #ff2d95); }
.sx-vaporwave .vw-grid { position: absolute; left: -25%; right: -25%; bottom: -40px; height: 50%; background-image: linear-gradient(rgba(0,255,231,0.55) 2px, transparent 2px), linear-gradient(90deg, rgba(0,255,231,0.55) 2px, transparent 2px); background-size: 40px 30px; transform: perspective(200px) rotateX(62deg); transform-origin: bottom; }
.sx-vaporwave .vw-inner { position: relative; max-width: 800px; margin: 0 auto; text-align: center; }
.sx-vaporwave .vw-k { font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.3em; text-transform: uppercase; color: #00ffe7; margin-bottom: 14px; }
.sx-vaporwave .vw-lead { text-decoration: none; }
.sx-vaporwave .vw-lead h2 { margin: 0 0 36px; color: #fff; font-size: clamp(34px, 6vw, 72px); text-transform: uppercase; letter-spacing: 0.04em; line-height: 0.95; text-shadow: 3px 3px 0 #00ffe7, -3px -3px 0 #ff2d95; }
.sx-vaporwave .vw-list { list-style: none; margin: 0; padding: 0; }
.sx-vaporwave .vw-list a { display: block; padding: 11px 0; color: #fff; text-decoration: none; font-family: 'IBM Plex Mono', monospace; font-size: 16px; border-bottom: 1px solid rgba(0,255,231,0.4); }
```

### Task 5: Memphis (`sx-memphis`)
Composer:
```js
function composeMemphis(items) {
  const { lead, rest } = partition(items);
  return `<div class="sx-memphis"><span class="mp-sq"></span><span class="mp-ci"></span><span class="mp-tr"></span><div class="mp-inner">` +
    (lead ? `<a class="mp-lead" href="${href(lead)}"><div class="mp-k">${escapeHtml(lead.category)}</div><h2>${escapeHtml(lead.title)}</h2><p>${escapeHtml(lead.subtitle)}</p></a>` : '') +
    `<ul class="mp-list">${rest.slice(0, 6).map((i) => `<li><a href="${href(i)}">${escapeHtml(i.title)}</a></li>`).join('')}</ul>` +
    `</div></div>`;
}
```
CSS:
```css
.sx-memphis { position: relative; overflow: hidden; background: #fdf4e3; font-family: Arial, Helvetica, sans-serif; padding: 56px clamp(16px, 4vw, 48px); }
.sx-memphis::before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(#111 2px, transparent 2px); background-size: 28px 28px; opacity: 0.08; }
.sx-memphis .mp-sq { position: absolute; top: 30px; right: 60px; width: 70px; height: 70px; background: #ffbf00; transform: rotate(15deg); }
.sx-memphis .mp-ci { position: absolute; bottom: 50px; left: 40px; width: 50px; height: 50px; border-radius: 50%; border: 10px solid #ff5a5f; }
.sx-memphis .mp-tr { position: absolute; top: 140px; left: 55%; width: 0; height: 0; border-left: 26px solid transparent; border-right: 26px solid transparent; border-bottom: 44px solid #2ec4b6; }
.sx-memphis .mp-inner { position: relative; max-width: 900px; margin: 0 auto; }
.sx-memphis .mp-k { font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #3d5af1; margin-bottom: 10px; font-weight: 700; }
.sx-memphis .mp-lead { text-decoration: none; color: #1b1b1b; display: block; }
.sx-memphis .mp-lead h2 { margin: 0 0 10px; font-weight: 900; font-size: clamp(32px, 5vw, 60px); color: #3d5af1; text-transform: uppercase; letter-spacing: -0.02em; line-height: 0.95; }
.sx-memphis .mp-lead p { margin: 0; color: #444; font-size: 16px; max-width: 44ch; }
.sx-memphis .mp-list { list-style: none; margin: 28px 0 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0 28px; }
.sx-memphis .mp-list a { display: block; padding: 12px 0; color: #1b1b1b; text-decoration: none; font-weight: 700; border-bottom: 3px solid #111; }
@media (max-width: 700px) { .sx-memphis .mp-list { grid-template-columns: 1fr; } }
```

### Task 6: Risograph (`sx-riso`)
Composer: two-color overprint poster headline + list.
```js
function composeRiso(items) {
  const { lead, rest } = partition(items);
  return `<div class="sx-riso"><div class="ri-inner">` +
    (lead ? `<a class="ri-lead" href="${href(lead)}"><div class="ri-k">${escapeHtml(lead.category)}</div><h2>${escapeHtml(lead.title)}</h2></a>` : '') +
    `<ul class="ri-list">${rest.slice(0, 6).map((i) => `<li><a href="${href(i)}">${escapeHtml(i.title)}</a></li>`).join('')}</ul>` +
    `</div></div>`;
}
```
CSS:
```css
.sx-riso { position: relative; background: #f3ead2; font-family: 'Arial Black', Arial, sans-serif; padding: 56px clamp(16px, 4vw, 48px); }
.sx-riso::before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(circle, #ff3d77 1.4px, transparent 1.8px); background-size: 9px 9px; opacity: 0.45; mix-blend-mode: multiply; }
.sx-riso .ri-inner { position: relative; max-width: 900px; margin: 0 auto; }
.sx-riso .ri-k { font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #2b3aef; margin-bottom: 14px; }
.sx-riso .ri-lead { text-decoration: none; }
.sx-riso .ri-lead h2 { margin: 0 0 28px; color: #2b3aef; mix-blend-mode: multiply; font-size: clamp(34px, 6vw, 76px); text-transform: uppercase; line-height: 0.9; letter-spacing: -0.03em; text-shadow: 4px 4px 0 #ff3d77; }
.sx-riso .ri-list { list-style: none; margin: 0; padding: 0; }
.sx-riso .ri-list a { display: block; padding: 11px 0; color: #2b3aef; text-decoration: none; font-family: Arial, sans-serif; font-weight: 700; font-size: 17px; border-bottom: 2px solid rgba(43,58,239,0.3); mix-blend-mode: multiply; }
```

### Task 7: Ransom-note zine (`sx-zine`)
Composer: cut-out headline words + a list.
```js
function composeZine(items) {
  const { lead, rest } = partition(items);
  const cut = (t) => t.split(' ').map((w, i) => `<span class="zn-w zn-w${i % 4}">${escapeHtml(w)}</span>`).join(' ');
  return `<div class="sx-zine"><span class="zn-tape"></span><div class="zn-inner">` +
    (lead ? `<a class="zn-lead" href="${href(lead)}"><h2>${cut(lead.title)}</h2></a>` : '') +
    `<ul class="zn-list">${rest.slice(0, 6).map((i) => `<li><a href="${href(i)}">${escapeHtml(i.title)}</a></li>`).join('')}</ul>` +
    `</div></div>`;
}
```
Note: `cut` splits on spaces then escapes each word — escaping happens per word, so the output is safe.
CSS:
```css
.sx-zine { position: relative; background: #fbfbf7; font-family: Arial, sans-serif; padding: 56px clamp(16px, 4vw, 48px); }
.sx-zine .zn-tape { position: absolute; top: 30px; right: 80px; width: 90px; height: 28px; background: rgba(180,170,120,0.5); transform: rotate(12deg); }
.sx-zine .zn-inner { max-width: 900px; margin: 0 auto; }
.sx-zine .zn-lead { text-decoration: none; }
.sx-zine .zn-lead h2 { margin: 0 0 28px; display: flex; flex-wrap: wrap; gap: 6px; }
.sx-zine .zn-w { display: inline-block; padding: 2px 10px; font-weight: 900; line-height: 1; font-size: clamp(24px, 4vw, 48px); background: #111; color: #fff; }
.sx-zine .zn-w0 { transform: rotate(-3deg); font-family: Georgia, serif; }
.sx-zine .zn-w1 { transform: rotate(2deg); background: #ffe600; color: #111; }
.sx-zine .zn-w2 { transform: rotate(-2deg); background: #ff2d6f; font-family: Times, serif; }
.sx-zine .zn-w3 { transform: rotate(3deg); font-family: 'IBM Plex Mono', monospace; }
.sx-zine .zn-list { list-style: none; margin: 0; padding: 0; }
.sx-zine .zn-list a { display: block; padding: 11px 0; color: #111; text-decoration: none; font-family: 'IBM Plex Mono', monospace; font-size: 15px; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 2px solid #111; }
```

### Task 8: Terminal / CRT (`sx-terminal`)
Composer:
```js
function composeTerminal(items) {
  const { lead, rest } = partition(items);
  const line = (i) => `<div class="tm-line">&gt; ${escapeHtml(i.title)}</div>`;
  return `<div class="sx-terminal"><div class="tm-scan"></div><div class="tm-inner">` +
    `<div class="tm-head">DRUCK://feed</div>` +
    (lead ? `<a class="tm-lead" href="${href(lead)}"><div class="tm-line tm-hot">&gt; ${escapeHtml(lead.title)}<span class="tm-cur"></span></div></a>` : '') +
    rest.slice(0, 7).map((i) => `<a class="tm-row" href="${href(i)}">${line(i)}</a>`).join('') +
    `</div></div>`;
}
```
CSS:
```css
.sx-terminal { position: relative; overflow: hidden; background: #04140a; color: #39ff8b; font-family: 'IBM Plex Mono', ui-monospace, monospace; padding: 48px clamp(16px, 4vw, 48px); text-shadow: 0 0 6px rgba(57,255,139,0.6); }
.sx-terminal .tm-scan { position: absolute; inset: 0; background: repeating-linear-gradient(rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.28) 2px 3px); pointer-events: none; }
.sx-terminal .tm-inner { position: relative; max-width: 900px; margin: 0 auto; }
.sx-terminal .tm-head { font-size: 12px; letter-spacing: 0.1em; opacity: 0.8; border-bottom: 1px solid #1c6b3e; padding-bottom: 10px; margin-bottom: 18px; }
.sx-terminal .tm-lead, .sx-terminal .tm-row { display: block; text-decoration: none; color: inherit; }
.sx-terminal .tm-line { font-size: clamp(16px, 2vw, 22px); line-height: 1.7; }
.sx-terminal .tm-hot { font-size: clamp(22px, 3vw, 34px); }
.sx-terminal .tm-cur { display: inline-block; width: 10px; height: 1em; background: #39ff8b; vertical-align: -2px; margin-left: 4px; }
```

### Task 9: Bloomberg data terminal (`sx-bloomberg`)
Composer:
```js
function composeBloomberg(items) {
  const { lead, rest } = partition(items);
  const row = (i) => `<a class="bb-row" href="${href(i)}"><span class="bb-t">${escapeHtml(i.title)}</span><span class="bb-c">${escapeHtml(i.category)}</span></a>`;
  return `<div class="sx-bloomberg"><div class="bb-inner">` +
    `<div class="bb-top"><span>DRUCK TERMINAL</span><span>TOP STORIES</span></div>` +
    (lead ? `<a class="bb-row bb-lead" href="${href(lead)}"><span class="bb-t">${escapeHtml(lead.title)}</span><span class="bb-c bb-hot">HOT</span></a>` : '') +
    rest.slice(0, 8).map(row).join('') +
    `</div></div>`;
}
```
CSS:
```css
.sx-bloomberg { background: #0a0a0a; color: #ffae3b; font-family: 'IBM Plex Mono', ui-monospace, monospace; padding: 40px clamp(16px, 4vw, 48px); }
.sx-bloomberg .bb-inner { max-width: 1000px; margin: 0 auto; }
.sx-bloomberg .bb-top { display: flex; justify-content: space-between; border-bottom: 1px solid #3a2e12; padding-bottom: 8px; letter-spacing: 0.06em; font-size: 13px; margin-bottom: 6px; }
.sx-bloomberg .bb-row { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: baseline; padding: 9px 0; border-bottom: 1px solid #1a1a1a; text-decoration: none; }
.sx-bloomberg .bb-t { color: #dcdcdc; font-size: 15px; }
.sx-bloomberg .bb-lead .bb-t { color: #ffae3b; font-size: clamp(18px, 2.4vw, 26px); }
.sx-bloomberg .bb-c { color: #4ec06a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
.sx-bloomberg .bb-hot { color: #ff5a4d; }
```

### Task 10: Letterpress broadside (`sx-letterpress`)
Composer:
```js
function composeLetterpress(items) {
  const { lead, rest } = partition(items);
  return `<div class="sx-letterpress"><div class="lp-inner">` +
    `<div class="lp-k">Broadside</div>` +
    (lead ? `<a class="lp-lead" href="${href(lead)}"><h2>${escapeHtml(lead.title)}</h2></a><div class="lp-rule"></div>` : '') +
    `<ul class="lp-list">${rest.slice(0, 6).map((i) => `<li><a href="${href(i)}">${escapeHtml(i.title)}</a></li>`).join('')}</ul>` +
    `</div></div>`;
}
```
CSS:
```css
.sx-letterpress { background: #efe6d2; color: #6e1f1a; font-family: Georgia, 'Times New Roman', serif; padding: 56px clamp(16px, 4vw, 48px); }
.sx-letterpress .lp-inner { max-width: 820px; margin: 0 auto; text-align: center; border: 3px double #6e1f1a; padding: 40px clamp(16px, 4vw, 48px); }
.sx-letterpress .lp-k { font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 16px; }
.sx-letterpress .lp-lead { text-decoration: none; }
.sx-letterpress .lp-lead h2 { margin: 0; font-family: 'Arial Black', 'Helvetica Neue', sans-serif; font-weight: 900; font-size: clamp(34px, 6vw, 72px); text-transform: uppercase; letter-spacing: -0.02em; color: #241712; line-height: 0.85; }
.sx-letterpress .lp-rule { border-top: 1px solid #6e1f1a; border-bottom: 3px solid #6e1f1a; height: 3px; margin: 22px auto; max-width: 260px; }
.sx-letterpress .lp-list { list-style: none; margin: 0; padding: 0; }
.sx-letterpress .lp-list a { display: block; padding: 10px 0; color: #6e1f1a; text-decoration: none; font-style: italic; font-size: 16px; }
```

### Task 11: Bauhaus / constructivist (`sx-bauhaus`)
Composer:
```js
function composeBauhaus(items) {
  const { lead, rest } = partition(items);
  return `<div class="sx-bauhaus"><span class="bh-circ"></span><span class="bh-bar"></span><span class="bh-sq"></span><div class="bh-inner">` +
    (lead ? `<a class="bh-lead" href="${href(lead)}"><div class="bh-k">${escapeHtml(lead.category)}</div><h2>${escapeHtml(lead.title)}</h2></a>` : '') +
    `<ul class="bh-list">${rest.slice(0, 6).map((i) => `<li><a href="${href(i)}">${escapeHtml(i.title)}</a></li>`).join('')}</ul>` +
    `</div></div>`;
}
```
CSS:
```css
.sx-bauhaus { position: relative; overflow: hidden; background: #f4f1ea; font-family: Arial, Helvetica, sans-serif; padding: 56px clamp(16px, 4vw, 48px); }
.sx-bauhaus .bh-circ { position: absolute; top: -40px; right: -40px; width: 220px; height: 220px; border-radius: 50%; background: #e2231a; }
.sx-bauhaus .bh-bar { position: absolute; bottom: 60px; left: -60px; width: 360px; height: 44px; background: #1b1b1b; transform: rotate(-20deg); }
.sx-bauhaus .bh-sq { position: absolute; top: 40px; left: 40px; width: 70px; height: 70px; background: #f5c400; }
.sx-bauhaus .bh-inner { position: relative; max-width: 900px; margin: 0 auto; }
.sx-bauhaus .bh-k { font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #1b1b1b; margin-bottom: 12px; font-weight: 700; }
.sx-bauhaus .bh-lead { text-decoration: none; color: #1b1b1b; }
.sx-bauhaus .bh-lead h2 { margin: 0; font-weight: 900; font-size: clamp(36px, 6vw, 76px); text-transform: uppercase; letter-spacing: -0.03em; line-height: 0.9; }
.sx-bauhaus .bh-list { list-style: none; margin: 28px 0 0; padding: 0; }
.sx-bauhaus .bh-list a { display: block; padding: 11px 0; color: #1b1b1b; text-decoration: none; font-weight: 700; border-bottom: 2px solid #1b1b1b; }
```

### Task 12: Tabloid (`sx-tabloid`)
Composer:
```js
function composeTabloid(items) {
  const { lead, rest } = partition(items);
  return `<div class="sx-tabloid"><div class="tb-mast">Druck</div><div class="tb-inner">` +
    (lead ? `<a class="tb-lead" href="${href(lead)}"><div class="tb-k">Exclusive</div><h2>${escapeHtml(lead.title)}</h2></a>` : '') +
    `<ul class="tb-list">${rest.slice(0, 6).map((i) => `<li><a href="${href(i)}">${escapeHtml(i.title)}</a></li>`).join('')}</ul>` +
    `</div></div>`;
}
```
CSS:
```css
.sx-tabloid { background: #fff; font-family: 'Arial Black', 'Helvetica Neue', sans-serif; }
.sx-tabloid .tb-mast { background: #e2231a; color: #fff; font-weight: 900; font-size: clamp(40px, 7vw, 88px); text-transform: uppercase; letter-spacing: -0.02em; padding: 10px clamp(16px, 4vw, 48px); }
.sx-tabloid .tb-inner { max-width: 1000px; margin: 0 auto; padding: 24px clamp(16px, 4vw, 48px) 56px; }
.sx-tabloid .tb-k { font-family: Arial, sans-serif; font-weight: 800; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #e2231a; margin-bottom: 4px; }
.sx-tabloid .tb-lead { text-decoration: none; color: #111; }
.sx-tabloid .tb-lead h2 { margin: 0 0 24px; font-weight: 900; font-size: clamp(40px, 8vw, 104px); text-transform: uppercase; letter-spacing: -0.04em; line-height: 0.85; }
.sx-tabloid .tb-list { list-style: none; margin: 0; padding: 0; }
.sx-tabloid .tb-list a { display: block; padding: 12px 0; color: #111; text-decoration: none; font-family: Arial, sans-serif; font-weight: 800; font-size: 18px; text-transform: uppercase; border-bottom: 2px solid #111; }
```

### Task 13: Neubrutalism (`sx-neubrutalism`)
Composer:
```js
function composeNeubrutalism(items) {
  const { lead, rest } = partition(items);
  return `<div class="sx-neubrutalism"><div class="nb-inner">` +
    (lead ? `<a class="nb-card" href="${href(lead)}"><span class="nb-badge">HOT</span><span class="nb-k">${escapeHtml(lead.category)}</span><h2>${escapeHtml(lead.title)}</h2></a>` : '') +
    `<ul class="nb-list">${rest.slice(0, 6).map((i) => `<li><a href="${href(i)}">${escapeHtml(i.title)}</a></li>`).join('')}</ul>` +
    `</div></div>`;
}
```
CSS:
```css
.sx-neubrutalism { background: #f7f4ff; font-family: Arial, Helvetica, sans-serif; padding: 56px clamp(16px, 4vw, 48px); }
.sx-neubrutalism .nb-inner { max-width: 900px; margin: 0 auto; }
.sx-neubrutalism .nb-card { position: relative; display: block; background: #fff; border: 3px solid #111; box-shadow: 8px 8px 0 #111; border-radius: 6px; padding: 26px; text-decoration: none; color: #111; }
.sx-neubrutalism .nb-badge { position: absolute; top: -16px; right: -8px; background: #b9ff3d; border: 3px solid #111; border-radius: 999px; font-weight: 900; font-size: 12px; padding: 5px 12px; transform: rotate(6deg); }
.sx-neubrutalism .nb-k { font-family: 'IBM Plex Mono', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; background: #c9b8ff; border: 2px solid #111; display: inline-block; padding: 2px 8px; margin-bottom: 12px; }
.sx-neubrutalism .nb-card h2 { margin: 0; font-weight: 900; font-size: clamp(30px, 5vw, 60px); letter-spacing: -0.02em; line-height: 0.95; }
.sx-neubrutalism .nb-list { list-style: none; margin: 24px 0 0; padding: 0; }
.sx-neubrutalism .nb-list a { display: block; background: #fff; border: 3px solid #111; box-shadow: 4px 4px 0 #111; border-radius: 6px; padding: 14px 18px; margin-bottom: 14px; color: #111; text-decoration: none; font-weight: 800; }
```

---

## Self-Review

**Spec coverage:** All 12 landing-only spectacle looks from the spec are implemented as `prerender/spectacle.mjs` composers + `.sx-{key}` themes, wired into the immersive overlay alongside the 8 engine looks. The launch is zero-JS (`:target`), the motion is CSS scroll-timeline with reduced-motion + `@supports` fallbacks, and the spectacle looks stay landing-local (never the engine API). Engine-look styling rides on the existing `feed-global.css` import. The teaser band uses the landing's own fonts and clay accent.

**Placeholder scan:** No TBD/TODO. Every composer and CSS theme is complete code. Tasks 4-13 each carry their full composer + theme; the Task 1 loop test and `renderShowcase` consume the `SPECTACLE` registry so each new entry is automatically tested and rendered.

**Type consistency:** Every composer is `(items) => string`, registered in `SPECTACLE` as `{ key, name, render }`. Each composer's emitted `.sx-{key}`/sub-classes match its CSS theme's selectors. `partition`/`href`/`img`/`escapeHtml`/`safeUrl` are defined once in Task 1 and used by every later composer. `renderShowcase` (Task 2) consumes `SPECTACLE` and the engine `renderFrontPage`; `showcase.css` (Task 3) styles the overlay/band/morph that Task 2's markup produces.

**Budget watch:** 12 spectacle themes + the overlay CSS add to `showcase.css`. Task 3 and each look task end with a build; if `scripts/audit.mjs` shows the base-landing transfer approaching 250 KB, split `showcase.css` to load on `:target` (the spec permits this) and log it — do not silently exceed.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-20-druck-front-page-looks-part3.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, controller review + visual check between tasks.
2. **Inline Execution** — tasks run in this session with checkpoints.

Which approach?
