# Druck Front-Page Looks — Implementation Plan (Part 1: engine foundation + Brutalist)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a multi-look front-page system to the druck engine — a composer registry behind `renderFrontPage` — and prove it end to end with the Brutalist look and a `look` attribute on `<druck-feed>`, without changing the existing `classic` output.

**Architecture:** `buildFrontPage` already separates editorial ranking from rendering. This plan enriches its row model with `role`/`hasImage`, turns `renderFrontPage` into a dispatcher over a per-look composer registry (the current renderer becomes `composeClassic`, byte-identical), adds the Brutalist composer plus scoped CSS, and wires a reflecting `look` attribute through the web component.

**Tech Stack:** TypeScript (ESM, `.js` import suffixes), pnpm workspace, Vitest (`vitest run`; widget tests use `happy-dom`), plain CSS (`@druck-editorial/css`).

**Scope note — this is Part 1 of a tiered build.** It delivers the look-system architecture and one production look (Brutalist, the approved craft bar). Follow-on plans, each the same shape, add the remaining seven engine looks (Swiss, Helvetica, Broadsheet, Luxury, Noir, Bento, Almanac) and then the click-to-launch immersive landing showcase with its twelve landing-only spectacle looks. Each part is independently shippable. Spec: `docs/superpowers/specs/2026-06-20-druck-front-page-looks-design.md`.

## Global Constraints

- Zero client JavaScript in engine output. Composers emit HTML only. All look styling and motion is CSS.
- Every source file starts with the SPDX header verbatim: `// SPDX-License-Identifier: MIT` then `// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>` (CSS uses the single-line `/* SPDX-License-Identifier: MIT | Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com> */` form).
- No other source-file comments. Naming carries meaning. No emojis anywhere.
- No external CDN dependencies. Self-host everything.
- ESM only. TypeScript imports use the `.js` suffix (e.g. `import { x } from './types.js'`).
- Immutable data patterns. Early returns over nested conditionals.
- The `classic` front-page output must stay byte-identical to today's `renderFrontPage` output. This is a back-compat guarantee with a regression test.
- Commits follow conventional-commit format (`type: summary`). Do NOT add `Co-Authored-By` lines.
- Run from the repo root `/var/www/druck`.

---

## File Structure

- `packages/druck-engine/src/types.ts` — add `FrontPageLook` union and `look?` on `RenderOptions`.
- `packages/druck-engine/src/frontpage.ts` — add `FrontPageItem`, enrich `buildFrontPage`, refactor `renderFrontPage` into a composer registry + dispatch, add `composeClassic` (extracted) and `composeBrutalist`.
- `packages/druck-engine/src/frontpage.test.ts` — tests for enrichment, dispatch, classic-unchanged, Brutalist markup.
- `packages/druck-engine/src/index.ts` — export `FrontPageLook`, `FrontPageItem`.
- `packages/druck-css/feed.css` — append shared zero-JS primitives and the `.druck-front-page--brutalist` style block.
- `packages/druck-widget/src/druck-feed.ts` — observe + reflect a `look` attribute, cache items, pass `look` into render options, re-render on change without refetch.
- `packages/druck-widget/src/druck-feed.test.ts` — test the `look` re-render.

---

## Task 1: Enrich the front-page model and add the look type

**Files:**
- Modify: `packages/druck-engine/src/types.ts`
- Modify: `packages/druck-engine/src/frontpage.ts`
- Modify: `packages/druck-engine/src/index.ts`
- Test: `packages/druck-engine/src/frontpage.test.ts`

**Interfaces:**
- Consumes: existing `ArticleData`, `RenderOptions` (types.ts); existing `buildFrontPage`, `FrontPageRow`, `FrontPageRowType` (frontpage.ts); `safeUrl` (format.js).
- Produces:
  - `type FrontPageLook = 'classic' | 'swiss' | 'helvetica' | 'broadsheet' | 'brutalist' | 'luxury' | 'noir' | 'bento' | 'almanac'`
  - `RenderOptions.look?: FrontPageLook`
  - `interface FrontPageItem extends ArticleData { role: 'lead' | 'feature' | 'brief'; hasImage: boolean }`
  - `buildFrontPage(items: ArticleData[]): FrontPageRow[]` where `FrontPageRow.items: FrontPageItem[]`

- [ ] **Step 1: Write the failing test**

Add to `packages/druck-engine/src/frontpage.test.ts` inside the `describe('buildFrontPage', ...)` block:

```ts
  it('enriches items with role and hasImage', () => {
    const rows = buildFrontPage(eleven);
    expect(rows[0].items[0].role).toBe('lead');
    expect(rows[1].items[0].role).toBe('feature');
    expect(rows[3].items[0].role).toBe('brief');
    expect(rows[0].items[0].hasImage).toBe(true);
  });

  it('marks items without a usable hero image as hasImage=false', () => {
    const rows = buildFrontPage([item(0, { heroImage: '' })]);
    expect(rows[0].items[0].hasImage).toBe(false);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @druck-editorial/engine test`
Expected: FAIL — `role`/`hasImage` are undefined on the returned items.

- [ ] **Step 3: Add the types**

In `packages/druck-engine/src/types.ts`, add this union immediately above `export interface RenderOptions {`:

```ts
export type FrontPageLook =
  | 'classic'
  | 'swiss'
  | 'helvetica'
  | 'broadsheet'
  | 'brutalist'
  | 'luxury'
  | 'noir'
  | 'bento'
  | 'almanac';
```

Then add the `look` field inside `RenderOptions` (after `ogImageUrl?: string;`):

```ts
  look?: FrontPageLook;
```

- [ ] **Step 4: Enrich the builder**

In `packages/druck-engine/src/frontpage.ts`, update the import line that pulls from `./format.js` so it also imports `safeUrl` (it currently imports `escapeHtml, safeUrl` — confirm `safeUrl` is present; it is). Add the import for `ArticleData` if not already imported (it is, via the existing `import type { ArticleData, RenderOptions } from './types.js'`).

Add this interface and helper right below the existing `FrontPageRow` interface:

```ts
export interface FrontPageItem extends ArticleData {
  role: 'lead' | 'feature' | 'brief';
  hasImage: boolean;
}

const ROLE_BY_TYPE: Record<FrontPageRowType, FrontPageItem['role']> = {
  hero: 'lead',
  feature: 'feature',
  triple: 'feature',
  brief: 'brief',
};

function enrichItem(data: ArticleData, role: FrontPageItem['role']): FrontPageItem {
  return { ...data, role, hasImage: Boolean(safeUrl(data.heroImage)) };
}
```

Change the `FrontPageRow` interface so `items` is `FrontPageItem[]`:

```ts
export interface FrontPageRow {
  type: FrontPageRowType;
  items: FrontPageItem[];
}
```

Replace the body of `buildFrontPage` so each row's items are enriched. The new function:

```ts
export function buildFrontPage(items: ArticleData[]): FrontPageRow[] {
  if (!items.length) return [];
  const pool = [...items];
  const hotIdx = pool.findIndex((entry) => entry.hot);
  if (hotIdx > 0) pool.unshift(pool.splice(hotIdx, 1)[0]);

  const raw: { type: FrontPageRowType; items: ArticleData[] }[] = [
    { type: 'hero', items: pool.splice(0, 1) },
  ];
  if (pool.length >= 2) raw.push({ type: 'feature', items: pool.splice(0, 2) });
  if (pool.length >= 3) raw.push({ type: 'triple', items: pool.splice(0, 3) });
  const brief = pool.splice(0, BRIEF_MAX);
  if (brief.length) raw.push({ type: 'brief', items: brief });

  return raw.map((row) => ({
    type: row.type,
    items: row.items.map((data) => enrichItem(data, ROLE_BY_TYPE[row.type])),
  }));
}
```

- [ ] **Step 5: Export the new types**

In `packages/druck-engine/src/index.ts`, add `FrontPageLook` to the `export type { ... } from './types.js'` list, and add `FrontPageItem` to the `export type { FrontPageRow, FrontPageRowType } from './frontpage.js'` line so it reads:

```ts
export type { FrontPageRow, FrontPageRowType, FrontPageItem } from './frontpage.js';
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @druck-editorial/engine test`
Expected: PASS (all existing tests still pass — the existing `buildFrontPage` row-shape test is unaffected because `FrontPageItem` extends `ArticleData`).

- [ ] **Step 7: Typecheck**

Run: `pnpm --filter @druck-editorial/engine typecheck`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add packages/druck-engine/src/types.ts packages/druck-engine/src/frontpage.ts packages/druck-engine/src/index.ts packages/druck-engine/src/frontpage.test.ts
git commit -m "feat(engine): enrich front-page items with role/hasImage and add FrontPageLook"
```

---

## Task 2: Composer registry and dispatch (classic stays byte-identical)

**Files:**
- Modify: `packages/druck-engine/src/frontpage.ts`
- Test: `packages/druck-engine/src/frontpage.test.ts`

**Interfaces:**
- Consumes: `FrontPageRow`, `FrontPageItem`, `FrontPageLook`, `RenderOptions`, the existing private `renderHeroCard`/`renderBriefItem`, `renderCard`.
- Produces:
  - `type FrontPageComposer = (rows: FrontPageRow[], opts?: RenderOptions) => string`
  - `composeClassic(rows, opts)` returns the inner rows HTML (no wrapper)
  - `renderFrontPage(rows, opts)` dispatches on `opts.look`, wraps in `<div class="druck-front-page[ druck-front-page--{look}]">`, and falls back to `classic` (no scoping class) for any look not yet in the registry.

- [ ] **Step 1: Write the failing tests**

Add a new describe block to `packages/druck-engine/src/frontpage.test.ts`:

```ts
describe('renderFrontPage look dispatch', () => {
  it('classic output is unchanged by the look parameter', () => {
    const a = renderFrontPage(buildFrontPage(eleven));
    const b = renderFrontPage(buildFrontPage(eleven), { look: 'classic' });
    expect(a).toBe(b);
    expect(a.startsWith('<div class="druck-front-page">')).toBe(true);
    expect(a).toContain('df-row--hero');
  });

  it('falls back to classic with no scoping class for an unimplemented look', () => {
    const classic = renderFrontPage(buildFrontPage(eleven), { look: 'classic' });
    const swiss = renderFrontPage(buildFrontPage(eleven), { look: 'swiss' });
    expect(swiss).toBe(classic);
    expect(swiss).not.toContain('druck-front-page--swiss');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @druck-editorial/engine test`
Expected: FAIL — `renderFrontPage` does not yet accept/route `look`; the `swiss` case currently renders identically but the suite fails to compile only if `look` is missing from `RenderOptions` (added in Task 1, so this compiles). The new assertions about `startsWith('<div class="druck-front-page">')` will pass already; the meaningful failure appears once the wrapper logic exists. Confirm both new tests run; if both pass before any change, you skipped Task 1 — stop and verify Task 1 landed.

- [ ] **Step 3: Refactor into composer + dispatch**

In `packages/druck-engine/src/frontpage.ts`, add the import of `FrontPageLook`:

```ts
import type { ArticleData, FrontPageLook, RenderOptions } from './types.js';
```

Add the composer type and extract the classic renderer. Replace the existing `renderFrontPage` function with:

```ts
export type FrontPageComposer = (rows: FrontPageRow[], opts?: RenderOptions) => string;

function composeClassic(rows: FrontPageRow[], opts?: RenderOptions): string {
  return rows
    .map((row) => {
      if (row.type === 'hero') {
        return `<div class="df-row df-row--hero">${renderHeroCard(row.items[0])}</div>`;
      }
      if (row.type === 'brief') {
        const lis = row.items.map(renderBriefItem).join('');
        return `<div class="df-row df-row--brief"><div class="df-brief-label">In brief</div><ul>${lis}</ul></div>`;
      }
      const cls = row.type === 'feature' ? 'df-row--feature' : 'df-row--triple';
      const cards = row.items.map((entry) => renderCard(entry, opts)).join('');
      return `<div class="df-row ${cls}">${cards}</div>`;
    })
    .join('');
}

const COMPOSERS: Partial<Record<FrontPageLook, FrontPageComposer>> = {
  classic: composeClassic,
};

export function renderFrontPage(rows: FrontPageRow[], opts?: RenderOptions): string {
  const requested = opts?.look ?? 'classic';
  const compose = COMPOSERS[requested] ?? composeClassic;
  const look: FrontPageLook = COMPOSERS[requested] ? requested : 'classic';
  const lookClass = look === 'classic' ? '' : ` druck-front-page--${look}`;
  return `<div class="druck-front-page${lookClass}">${compose(rows, opts)}</div>`;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @druck-editorial/engine test`
Expected: PASS — all existing front-page tests plus the two new dispatch tests. The classic wrapper and rows are unchanged.

- [ ] **Step 5: Commit**

```bash
git add packages/druck-engine/src/frontpage.ts packages/druck-engine/src/frontpage.test.ts
git commit -m "refactor(engine): route renderFrontPage through a per-look composer registry"
```

---

## Task 3: The Brutalist composer

**Files:**
- Modify: `packages/druck-engine/src/frontpage.ts`
- Test: `packages/druck-engine/src/frontpage.test.ts`

**Interfaces:**
- Consumes: `FrontPageRow`, `FrontPageItem`, `escapeHtml`, `safeUrl`, the `COMPOSERS` registry.
- Produces: `composeBrutalist(rows, opts)` registered under `brutalist`, emitting markup with classes `dfb-mast`, `dfb-wm`, `dfb-rule`, `dfb-lead`, `dfb-head`, `dfb-kicker`, `dfb-title`, `dfb-img`, `dfb-grid`, `dfb-cell`, `dfb-n`, `dfb-ck`, `dfb-brief`, `dfb-bt`.

- [ ] **Step 1: Write the failing tests**

Add to `packages/druck-engine/src/frontpage.test.ts`:

```ts
describe('composeBrutalist', () => {
  it('scopes the wrapper and renders masthead, lead, cells and brief', () => {
    const html = renderFrontPage(buildFrontPage(eleven), { look: 'brutalist' });
    expect(html).toContain('druck-front-page--brutalist');
    expect(html).toContain('dfb-mast');
    expect(html).toContain('dfb-lead');
    expect(html).toContain('dfb-grid');
    expect(html).toContain('dfb-brief');
  });

  it('escapes titles and only emits safe hrefs', () => {
    const items = [
      item(0, { hot: true, title: '<script>x</script>', shareUrl: 'javascript:alert(1)' }),
      item(1), item(2), item(3),
    ];
    const html = renderFrontPage(buildFrontPage(items), { look: 'brutalist' });
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('javascript:alert(1)');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @druck-editorial/engine test`
Expected: FAIL — `brutalist` is not in the registry, so output falls back to classic and lacks `druck-front-page--brutalist`.

- [ ] **Step 3: Implement the composer**

In `packages/druck-engine/src/frontpage.ts`, add these functions above the `COMPOSERS` constant:

```ts
function brutalistLead(item: FrontPageItem): string {
  const href = safeUrl(item.shareUrl ?? '') || '#';
  const img = safeUrl(item.heroImage) || 'data:,';
  const kicker = `${item.category}${item.hot ? ' / Hot' : ''}`;
  return (
    '<div class="dfb-lead">' +
    '<div class="dfb-head">' +
    `<span class="dfb-kicker">${escapeHtml(kicker)}</span>` +
    `<a class="dfb-title" href="${escapeHtml(href)}"><h2>${escapeHtml(item.title)}</h2></a>` +
    '</div>' +
    `<a class="dfb-img" href="${escapeHtml(href)}">` +
    `<img src="${escapeHtml(img)}" alt="${escapeHtml(item.heroImageAlt ?? item.title)}" loading="lazy" width="1200" height="675">` +
    '</a>' +
    '</div>'
  );
}

function brutalistCell(item: FrontPageItem, n: number): string {
  const href = safeUrl(item.shareUrl ?? '') || '#';
  return (
    `<a class="dfb-cell" href="${escapeHtml(href)}">` +
    `<span class="dfb-n">${String(n).padStart(2, '0')}</span>` +
    `<span class="dfb-ck">${escapeHtml(item.category)}</span>` +
    `<h3>${escapeHtml(item.title)}</h3>` +
    '</a>'
  );
}

function brutalistBriefItem(item: FrontPageItem): string {
  const href = safeUrl(item.shareUrl ?? '') || '#';
  return (
    `<li><a href="${escapeHtml(href)}">` +
    `<span class="dfb-bt">${escapeHtml(item.title)}</span>` +
    `<time>${escapeHtml(item.publishedAt)}</time>` +
    '</a></li>'
  );
}

function composeBrutalist(rows: FrontPageRow[], _opts?: RenderOptions): string {
  const lead = rows.find((r) => r.type === 'hero')?.items[0];
  const cells = rows
    .filter((r) => r.type === 'feature' || r.type === 'triple')
    .flatMap((r) => r.items);
  const brief = rows.find((r) => r.type === 'brief')?.items ?? [];

  const parts: string[] = [
    '<div class="dfb-mast"><span class="dfb-wm">Druck</span></div><div class="dfb-rule"></div>',
  ];
  if (lead) parts.push(brutalistLead(lead));
  if (cells.length) {
    const cellHtml = cells.map((c, i) => brutalistCell(c, i + 2)).join('');
    parts.push(`<div class="dfb-grid">${cellHtml}</div>`);
  }
  if (brief.length) {
    parts.push(`<ol class="dfb-brief">${brief.map(brutalistBriefItem).join('')}</ol>`);
  }
  return parts.join('');
}
```

Register it by extending the `COMPOSERS` constant:

```ts
const COMPOSERS: Partial<Record<FrontPageLook, FrontPageComposer>> = {
  classic: composeClassic,
  brutalist: composeBrutalist,
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @druck-editorial/engine test`
Expected: PASS — both new Brutalist tests, all prior tests still green.

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @druck-editorial/engine typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/druck-engine/src/frontpage.ts packages/druck-engine/src/frontpage.test.ts
git commit -m "feat(engine): add the brutalist front-page composer"
```

---

## Task 4: Brutalist CSS + shared zero-JS primitives

**Files:**
- Modify: `packages/druck-css/feed.css`
- Verify-with: a throwaway browser harness (below). No unit test — CSS is verified visually here; the automated visual baseline lands with the showcase plan that wires this look into the app.

**Interfaces:**
- Consumes: the markup classes from Task 3 (`dfb-*`) under the `.druck-front-page--brutalist` wrapper from Task 2.
- Produces: a self-contained `.druck-front-page--brutalist` style block and shared primitive custom properties at the top of the front-page CSS scope.

- [ ] **Step 1: Append the styles**

Add to the end of `packages/druck-css/feed.css`:

```css
/* Shared front-page look primitives (zero-JS) */
.druck-front-page {
  --dfx-grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
}

/* Brutalist look */
.druck-front-page--brutalist {
  --ink: #0b0b0b;
  --paper: #efece3;
  --acid: #d6ff00;
  --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  background: var(--paper);
  color: var(--ink);
  font-family: "Helvetica Neue", Arial, sans-serif;
  padding: 26px clamp(16px, 4vw, 40px) 48px;
}
.druck-front-page--brutalist .dfb-mast {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
.druck-front-page--brutalist .dfb-wm {
  font-size: clamp(48px, 9vw, 120px);
  font-weight: 900;
  letter-spacing: -0.055em;
  line-height: 0.78;
  text-transform: uppercase;
}
.druck-front-page--brutalist .dfb-rule {
  height: 8px;
  background: var(--ink);
  margin-top: 12px;
}
.druck-front-page--brutalist .dfb-lead {
  display: grid;
  grid-template-columns: 1.35fr 0.9fr;
  border-bottom: 8px solid var(--ink);
}
.druck-front-page--brutalist .dfb-head {
  padding: 24px 24px 30px 0;
}
.druck-front-page--brutalist .dfb-kicker {
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background: var(--ink);
  color: var(--paper);
  padding: 5px 9px;
  display: inline-block;
  margin-bottom: 18px;
}
.druck-front-page--brutalist .dfb-title {
  color: inherit;
  text-decoration: none;
}
.druck-front-page--brutalist .dfb-title h2 {
  margin: 0;
  font-size: clamp(40px, 6.6vw, 96px);
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.045em;
  text-transform: uppercase;
}
.druck-front-page--brutalist .dfb-img {
  position: relative;
  border-left: 8px solid var(--ink);
  background: var(--acid);
  overflow: hidden;
  min-height: 300px;
  display: block;
}
.druck-front-page--brutalist .dfb-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: grayscale(1) contrast(1.25) brightness(1.06);
  mix-blend-mode: multiply;
}
.druck-front-page--brutalist .dfb-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
.druck-front-page--brutalist .dfb-cell {
  padding: 20px 20px 26px;
  border-right: 2px solid var(--ink);
  border-bottom: 8px solid var(--ink);
  color: inherit;
  text-decoration: none;
  display: block;
}
.druck-front-page--brutalist .dfb-cell:nth-child(3n) {
  border-right: 0;
}
.druck-front-page--brutalist .dfb-n {
  font-family: var(--mono);
  font-size: 13px;
  letter-spacing: 0.1em;
}
.druck-front-page--brutalist .dfb-ck {
  display: block;
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.65;
  margin: 5px 0 12px;
}
.druck-front-page--brutalist .dfb-cell h3 {
  margin: 0;
  font-size: clamp(22px, 2.5vw, 31px);
  font-weight: 800;
  line-height: 0.97;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}
.druck-front-page--brutalist .dfb-brief {
  list-style: none;
  margin: 0;
  padding: 22px 0 0;
}
.druck-front-page--brutalist .dfb-brief li {
  border-bottom: 2px solid var(--ink);
}
.druck-front-page--brutalist .dfb-brief a {
  display: flex;
  gap: 16px;
  align-items: baseline;
  padding: 13px 0;
  color: inherit;
  text-decoration: none;
}
.druck-front-page--brutalist .dfb-bt {
  font-size: clamp(18px, 2vw, 23px);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  line-height: 1;
}
.druck-front-page--brutalist .dfb-brief time {
  margin-left: auto;
  font-family: var(--mono);
  font-size: 11px;
  opacity: 0.55;
  white-space: nowrap;
}
@media (max-width: 760px) {
  .druck-front-page--brutalist .dfb-lead,
  .druck-front-page--brutalist .dfb-grid {
    grid-template-columns: 1fr;
  }
  .druck-front-page--brutalist .dfb-img {
    border-left: 0;
    border-top: 8px solid var(--ink);
    min-height: 220px;
  }
  .druck-front-page--brutalist .dfb-cell {
    border-right: 0;
  }
}
```

- [ ] **Step 2: Build the workspace to confirm nothing breaks**

Run: `pnpm -r build`
Expected: all packages build green (the css package copies/ships `feed.css`).

- [ ] **Step 3: Visual confirmation via a throwaway harness**

Create `packages/druck-css/tmp-brutalist-harness.html` (do not commit it):

```html
<!DOCTYPE html>
<html><head><meta charset="utf-8"><link rel="stylesheet" href="./feed.css"></head>
<body>
<script type="module">
  import { buildFrontPage, renderFrontPage } from '../druck-engine/dist/index.js';
  const feed = await (await fetch('https://sonto.tech/data/druck-feed.json')).json();
  document.body.innerHTML = renderFrontPage(buildFrontPage(feed), { look: 'brutalist' });
</script>
</body></html>
```

Serve and open it: `pnpm dlx serve packages/druck-css` (or any static server), open `tmp-brutalist-harness.html`. Confirm: condensed masthead, 8px rules, the lead headline beside an acid/black duotone hero, a three-cell grid, and the brief list. Resize narrow — it collapses to one column. Then delete the harness file.

- [ ] **Step 4: Commit**

```bash
git add packages/druck-css/feed.css
git commit -m "feat(css): add brutalist front-page look and shared grain primitive"
```

---

## Task 5: `look` attribute on the `<druck-feed>` web component

**Files:**
- Modify: `packages/druck-widget/src/druck-feed.ts`
- Test: `packages/druck-widget/src/druck-feed.test.ts`

**Interfaces:**
- Consumes: `renderFrontPage`, `buildFrontPage`, `RenderOptions` (already imported); the engine `look` scoping from Tasks 2-3.
- Produces: a `look` attribute on `<druck-feed>` that reflects into `RenderOptions.look` for `layout="front-page"`, re-rendering from cached items on change without a refetch.

- [ ] **Step 1: Write the failing test**

Add to `packages/druck-widget/src/druck-feed.test.ts` inside the existing `describe('druck-feed front-page mode', ...)`:

```ts
  it('re-renders with the look scoping class when look changes, without refetching', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(ITEMS));
    vi.stubGlobal('fetch', fetchMock);
    const el = document.createElement('druck-feed');
    el.setAttribute('layout', 'front-page');
    el.setAttribute('src', 'https://example.com/feed.json');
    document.body.appendChild(el);
    await waitForEvent(el, 'druck:feed-rendered');

    const rerendered = waitForEvent(el, 'druck:feed-rendered');
    el.setAttribute('look', 'brutalist');
    await rerendered;

    expect(el.shadowRoot!.innerHTML).toContain('druck-front-page--brutalist');
    expect(el.shadowRoot!.innerHTML).toContain('dfb-mast');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @druck-editorial/widget test`
Expected: FAIL — `look` is not observed, the second `druck:feed-rendered` never fires (test times out or the class is absent).

- [ ] **Step 3: Implement the attribute**

In `packages/druck-widget/src/druck-feed.ts`:

Add `'look'` to `observedAttributes`:

```ts
  static get observedAttributes(): string[] {
    return ['src', 'lang', 'theme', 'accent', CSS_URL_ATTR, 'columns', 'layout', 'fallback-src', 'look'];
  }
```

Add a cached-items field next to the other private fields (after `#renderGeneration = 0;`):

```ts
  #lastItems: ArticleData[] | null = null;
```

In `#render`, store the items at the top of the method (immediately after `await this.#cssReady;` and the generation guard, before `this.#applyContainerAttrs();`):

```ts
    this.#lastItems = items;
```

Add `look` to the `opts` object built in `#render`:

```ts
    const opts: RenderOptions = {
      lang: this.getAttribute('lang') ?? undefined,
      theme: (this.getAttribute('theme') as RenderOptions['theme']) ?? undefined,
      accentColor: this.getAttribute('accent') ?? undefined,
      look: (this.getAttribute('look') as RenderOptions['look']) ?? undefined,
    };
```

Handle the `look` change in `attributeChangedCallback` by adding a branch (after the `columns` branch):

```ts
    } else if (name === 'look') {
      if (this.#lastItems && this.isConnected) {
        void this.#render(this.#lastItems, ++this.#renderGeneration);
      }
    }
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @druck-editorial/widget test`
Expected: PASS — the new test plus all existing widget tests. `fetch` was called once (re-render used the cache).

- [ ] **Step 5: Typecheck the workspace**

Run: `pnpm -r typecheck`
Expected: no errors.

- [ ] **Step 6: Full test + build gate**

Run: `pnpm -r test && pnpm -r build`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add packages/druck-widget/src/druck-feed.ts packages/druck-widget/src/druck-feed.test.ts
git commit -m "feat(widget): add look attribute that re-renders the front page in place"
```

---

## Self-Review

**Spec coverage (Part 1 scope):**
- Enriched semantic model (`role`, `hasImage`) — Task 1.
- `FrontPageLook` type + `look` on `RenderOptions` — Task 1.
- Composer registry + dispatch, `classic` byte-identical, look-scoping wrapper — Task 2.
- Brutalist composer (the approved bar) — Task 3 (markup) + Task 4 (CSS).
- Widget `look` selection — Task 5.
- Deferred to later parts (explicitly out of Part 1): the other seven engine looks, shared scroll-reveal/view-transition primitives (only the grain primitive is seeded here, the rest land with the looks that use them), `look="auto"` date-seed rotation, per-look visual baselines in the app, and the click-to-launch immersive showcase with its twelve spectacle looks. Spec sections for those map to follow-on plans, not gaps in this one.

**Placeholder scan:** No TBD/TODO. Every code step shows complete code. The one non-unit-tested deliverable (Brutalist CSS, Task 4) states its verification method (browser harness + build) and names where the automated visual baseline lands instead of pretending one exists here.

**Type consistency:** `FrontPageLook` (Task 1) is consumed by `COMPOSERS` and `renderFrontPage` (Task 2) and the widget opts (Task 5) with the same name. `FrontPageItem` (Task 1) is the row item type used by every composer (Tasks 2-3). The `dfb-*` class names emitted in Task 3 match the selectors styled in Task 4 exactly. `composeClassic`/`composeBrutalist`/`FrontPageComposer` names are consistent across Tasks 2-3.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-20-druck-front-page-looks.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session with checkpoints for review.

Which approach?
