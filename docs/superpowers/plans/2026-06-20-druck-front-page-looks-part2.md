# Druck Front-Page Looks — Implementation Plan (Part 2: the seven remaining engine looks)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the seven remaining engine looks — Swiss, Helvetica, Broadsheet, Luxury, Noir, Bento, Almanac — each as a registered composer plus a scoped CSS theme, following the Brutalist pattern proven in Part 1.

**Architecture:** Part 1 left a composer registry: `renderFrontPage` dispatches on `opts.look`, wraps in `<div class="druck-front-page druck-front-page--{look}">`, and falls back to `classic` for unregistered looks. This plan first extracts three shared helpers (`partitionRows`, `safeHref`, `safeImg`) and refactors Brutalist onto them with byte-identical output, then adds one composer + CSS theme per look. Luxury and Noir share one structural composer (`composeHeroBlocks`) differentiated only by CSS, matching the spec's "style-led looks share a base composer + theme."

**Tech Stack:** TypeScript (ESM, `.js` import suffixes), pnpm workspace, Vitest, plain CSS (`@druck-editorial/css`).

**Predecessor:** Part 1 (`docs/superpowers/plans/2026-06-20-druck-front-page-looks.md`) is merged/landed on this branch. Spec: `docs/superpowers/specs/2026-06-20-druck-front-page-looks-design.md`. The Brutalist look (`composeBrutalist`, `dfb-*` classes, `.druck-front-page--brutalist` CSS) is the reference craft bar — every look here matches that quality level.

## Global Constraints

- Zero client JS in engine output. Composers emit HTML strings only. All look styling and motion is CSS (scroll-driven motion via `animation-timeline: view()`, gated by `@supports` and `prefers-reduced-motion`).
- Every source file keeps its existing SPDX header verbatim. CSS appends use no comments beyond short section labels matching the file's existing style. No other source-file comments. No emojis. No non-ASCII in code.
- No external CDN dependencies. Self-host everything (any texture is an inline `data:` SVG or a CSS gradient).
- ESM only. TypeScript imports use the `.js` suffix.
- Immutable data patterns. Early returns.
- Every user-supplied value is escaped: text via `escapeHtml`, every `href`/`src` via `safeHref`/`safeImg` (which wrap `safeUrl` + `escapeHtml`). No raw interpolation of feed fields.
- `classic` and `brutalist` output stay byte-identical after the Task 1 refactor (regression-tested).
- Each composer is registered in `COMPOSERS` under its `FrontPageLook` key (the union already lists all nine looks from Part 1).
- Conventional commit messages (`type(scope): summary`). Do NOT add `Co-Authored-By` lines.
- Git commit hook: run `git commit -m "..."` as its OWN standalone command (no `-q`, no `&&` chaining); stage with a separate `git add <files>`; never stage `apps/druck-app/public/feed.css` or `apps/druck-app/public/sample-data/sonto-snapshot.json`.
- Run everything from `/var/www/druck`. Engine tests: `pnpm --filter @druck-editorial/engine test`. Typecheck: `pnpm --filter @druck-editorial/engine typecheck`.

---

## File Structure

- `packages/druck-engine/src/frontpage.ts` — add `partitionRows`, `safeHref`, `safeImg`; refactor `composeBrutalist`; add `composeSwiss`, `composeHelvetica`, `composeBroadsheet`, `composeHeroBlocks` (+ `composeLuxury`/`composeNoir`), `composeBento`, `composeAlmanac`; register all seven in `COMPOSERS`.
- `packages/druck-engine/src/frontpage.test.ts` — one focused test per look (scoping class + key structural class + escaping), plus a `partitionRows` unit test.
- `packages/druck-css/feed.css` — append one `.druck-front-page--{look}` theme block per look.

Class prefixes (no collisions with `dfb-`): Swiss `dfsw-`, Helvetica `dfhe-`, Broadsheet `dfbr-`, Luxury `dflx-`, Noir `dfnr-`, Bento `dfbn-`, Almanac `dfal-`.

Each look task ends with: composer + registration + unit test passing, CSS block appended, and a controller visual check (the controller renders the real feed through the look in a headless browser before marking the task complete).

---

## Task 1: Shared helpers + Brutalist refactor (output byte-identical)

**Files:**
- Modify: `packages/druck-engine/src/frontpage.ts`
- Test: `packages/druck-engine/src/frontpage.test.ts`

**Interfaces:**
- Produces:
  - `interface FrontPagePartition { lead?: FrontPageItem; cells: FrontPageItem[]; brief: FrontPageItem[] }`
  - `function partitionRows(rows: FrontPageRow[]): FrontPagePartition`
  - `function safeHref(item: FrontPageItem): string` — returns `escapeHtml(safeUrl(item.shareUrl ?? '') || '#')`
  - `function safeImg(item: FrontPageItem): string` — returns `escapeHtml(safeUrl(item.heroImage) || 'data:,')`
- All later look composers consume these three.

- [ ] **Step 1: Write the failing test**

Add to `frontpage.test.ts` (new describe block):

```ts
describe('partitionRows', () => {
  it('splits rows into lead, cells, and brief', () => {
    const rows = buildFrontPage(eleven);
    const p = partitionRows(rows);
    expect(p.lead?.slug).toBe(rows[0].items[0].slug);
    expect(p.cells.length).toBe(5);
    expect(p.brief.length).toBe(5);
  });

  it('returns an empty partition for no rows', () => {
    const p = partitionRows([]);
    expect(p.lead).toBeUndefined();
    expect(p.cells).toEqual([]);
    expect(p.brief).toEqual([]);
  });
});
```

`partitionRows` must be exported for the test. Add it to the engine `index.ts`? No — it is internal. Import it in the test directly from `./frontpage.js` by adding `partitionRows` to the existing test import line `import { buildFrontPage, renderFrontPage } from './frontpage.js';` → `import { buildFrontPage, renderFrontPage, partitionRows } from './frontpage.js';`. Export `partitionRows` from `frontpage.ts` (named `export function`).

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @druck-editorial/engine test`
Expected: FAIL — `partitionRows` is not exported / not defined.

- [ ] **Step 3: Add the helpers**

In `frontpage.ts`, add immediately above `function brutalistLead`:

```ts
export interface FrontPagePartition {
  lead?: FrontPageItem;
  cells: FrontPageItem[];
  brief: FrontPageItem[];
}

export function partitionRows(rows: FrontPageRow[]): FrontPagePartition {
  return {
    lead: rows.find((r) => r.type === 'hero')?.items[0],
    cells: rows.filter((r) => r.type === 'feature' || r.type === 'triple').flatMap((r) => r.items),
    brief: rows.find((r) => r.type === 'brief')?.items ?? [],
  };
}

function safeHref(item: FrontPageItem): string {
  return escapeHtml(safeUrl(item.shareUrl ?? '') || '#');
}

function safeImg(item: FrontPageItem): string {
  return escapeHtml(safeUrl(item.heroImage) || 'data:,');
}
```

- [ ] **Step 4: Refactor Brutalist onto the helpers (output identical)**

Replace `brutalistLead`, `brutalistCell`, `brutalistBriefItem`, and `composeBrutalist` so they use `safeHref`/`safeImg`/`partitionRows`. The emitted strings must be byte-identical to before.

```ts
function brutalistLead(item: FrontPageItem): string {
  const kicker = `${item.category}${item.hot ? ' / Hot' : ''}`;
  return (
    '<div class="dfb-lead">' +
    '<div class="dfb-head">' +
    `<span class="dfb-kicker">${escapeHtml(kicker)}</span>` +
    `<a class="dfb-title" href="${safeHref(item)}"><h2>${escapeHtml(item.title)}</h2></a>` +
    '</div>' +
    `<a class="dfb-img" href="${safeHref(item)}">` +
    `<img src="${safeImg(item)}" alt="${escapeHtml(item.heroImageAlt ?? item.title)}" loading="lazy" width="1200" height="675">` +
    '</a>' +
    '</div>'
  );
}

function brutalistCell(item: FrontPageItem, n: number): string {
  return (
    `<a class="dfb-cell" href="${safeHref(item)}">` +
    `<span class="dfb-n">${String(n).padStart(2, '0')}</span>` +
    `<span class="dfb-ck">${escapeHtml(item.category)}</span>` +
    `<h3>${escapeHtml(item.title)}</h3>` +
    '</a>'
  );
}

function brutalistBriefItem(item: FrontPageItem): string {
  return (
    `<li><a href="${safeHref(item)}">` +
    `<span class="dfb-bt">${escapeHtml(item.title)}</span>` +
    `<time>${escapeHtml(item.publishedAt)}</time>` +
    '</a></li>'
  );
}

function composeBrutalist(rows: FrontPageRow[], _opts?: RenderOptions): string {
  const { lead, cells, brief } = partitionRows(rows);
  const parts: string[] = [
    '<div class="dfb-mast"><span class="dfb-wm">Druck</span></div><div class="dfb-rule"></div>',
  ];
  if (lead) parts.push(brutalistLead(lead));
  if (cells.length) {
    parts.push(`<div class="dfb-grid">${cells.map((c, i) => brutalistCell(c, i + 2)).join('')}</div>`);
  }
  if (brief.length) {
    parts.push(`<ol class="dfb-brief">${brief.map(brutalistBriefItem).join('')}</ol>`);
  }
  return parts.join('');
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm --filter @druck-editorial/engine test`
Expected: PASS — the two new `partitionRows` tests plus the existing Brutalist tests (unchanged, proving byte-identical output). Then typecheck: `pnpm --filter @druck-editorial/engine typecheck`.

- [ ] **Step 6: Commit**

```bash
git add packages/druck-engine/src/frontpage.ts packages/druck-engine/src/frontpage.test.ts
```
then, as a separate command:
```bash
git commit -m "refactor(engine): extract partitionRows/safeHref/safeImg shared by composers"
```

---

## Task 2: Swiss look

**Files:** Modify `frontpage.ts`, `frontpage.test.ts`; append to `packages/druck-css/feed.css`.

**Interfaces:** Produces `composeSwiss(rows, opts?)` registered under `swiss`; emits classes `dfsw-top`, `dfsw-wm`, `dfsw-meta`, `dfsw-acc`, `dfsw-lead`, `dfsw-head`, `dfsw-cat`, `dfsw-title`, `dfsw-dek`, `dfsw-img`, `dfsw-grid`, `dfsw-cell`, `dfsw-k`, `dfsw-brief`, `dfsw-bt` under `.druck-front-page--swiss`.

- [ ] **Step 1: Write the failing test**

Add to `frontpage.test.ts`:

```ts
describe('engine look: swiss', () => {
  it('scopes the wrapper, renders structure, and escapes', () => {
    const items = [
      item(0, { hot: true, title: '<script>x</script>', shareUrl: 'javascript:alert(1)' }),
      item(1), item(2), item(3), item(4), item(5),
    ];
    const html = renderFrontPage(buildFrontPage(items), { look: 'swiss' });
    expect(html).toContain('druck-front-page--swiss');
    expect(html).toContain('dfsw-lead');
    expect(html).toContain('dfsw-grid');
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('javascript:alert(1)');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @druck-editorial/engine test`
Expected: FAIL — `swiss` not registered, falls back to classic, no `druck-front-page--swiss`.

- [ ] **Step 3: Implement the composer + register**

Add to `frontpage.ts` (above `COMPOSERS`):

```ts
function composeSwiss(rows: FrontPageRow[], _opts?: RenderOptions): string {
  const { lead, cells, brief } = partitionRows(rows);
  const parts: string[] = [];
  if (lead) {
    parts.push(
      `<div class="dfsw-top"><span class="dfsw-wm">Druck</span><span class="dfsw-meta">${escapeHtml(lead.publishedAt)}</span></div>` +
      '<div class="dfsw-acc"></div>' +
      '<div class="dfsw-lead"><div class="dfsw-head">' +
      `<div class="dfsw-cat">${escapeHtml(lead.category)}</div>` +
      `<a class="dfsw-title" href="${safeHref(lead)}"><h2>${escapeHtml(lead.title)}</h2></a>` +
      `<p class="dfsw-dek">${escapeHtml(lead.subtitle)}</p></div>` +
      `<a class="dfsw-img" href="${safeHref(lead)}"><img src="${safeImg(lead)}" alt="${escapeHtml(lead.heroImageAlt ?? lead.title)}" loading="lazy" width="1200" height="675"></a>` +
      '</div>'
    );
  }
  if (cells.length) {
    parts.push('<div class="dfsw-grid">' + cells.map((c) =>
      `<a class="dfsw-cell" href="${safeHref(c)}"><div class="dfsw-k">${escapeHtml(c.category)}</div>` +
      `<h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.subtitle)}</p></a>`
    ).join('') + '</div>');
  }
  if (brief.length) {
    parts.push('<ol class="dfsw-brief">' + brief.map((b) =>
      `<li><a href="${safeHref(b)}"><span class="dfsw-bt">${escapeHtml(b.title)}</span><time>${escapeHtml(b.publishedAt)}</time></a></li>`
    ).join('') + '</ol>');
  }
  return parts.join('');
}
```

Register it: add `swiss: composeSwiss,` to `COMPOSERS`.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @druck-editorial/engine test` then `pnpm --filter @druck-editorial/engine typecheck`. Expected: PASS / clean.

- [ ] **Step 5: Append the CSS**

Add to the end of `packages/druck-css/feed.css`:

```css
/* Swiss look */
.druck-front-page--swiss {
  --sw-accent: #e2231a;
  background: #fff;
  color: #0a0a0a;
  font-family: Arial, Helvetica, sans-serif;
  padding: 34px clamp(16px, 4vw, 40px) 60px;
}
.druck-front-page--swiss .dfsw-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 3px solid #0a0a0a;
  padding-bottom: 10px;
}
.druck-front-page--swiss .dfsw-wm {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.03em;
  text-transform: uppercase;
}
.druck-front-page--swiss .dfsw-meta {
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #555;
}
.druck-front-page--swiss .dfsw-acc {
  height: 3px;
  background: var(--sw-accent);
}
.druck-front-page--swiss .dfsw-lead {
  display: grid;
  grid-template-columns: 7fr 5fr;
  gap: 34px;
  padding: 38px 0;
  border-bottom: 1px solid #d4d4d4;
}
.druck-front-page--swiss .dfsw-cat {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--sw-accent);
  margin-bottom: 16px;
}
.druck-front-page--swiss .dfsw-title {
  color: inherit;
  text-decoration: none;
}
.druck-front-page--swiss .dfsw-title h2 {
  margin: 0;
  font-size: clamp(34px, 5vw, 62px);
  font-weight: 800;
  line-height: 0.98;
  letter-spacing: -0.03em;
  text-wrap: balance;
}
.druck-front-page--swiss .dfsw-dek {
  margin-top: 20px;
  font-size: 16px;
  line-height: 1.5;
  color: #222;
  max-width: 40ch;
}
.druck-front-page--swiss .dfsw-img img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  display: block;
}
.druck-front-page--swiss .dfsw-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 34px;
  padding-top: 34px;
}
.druck-front-page--swiss .dfsw-cell {
  border-top: 2px solid #0a0a0a;
  padding-top: 14px;
  color: inherit;
  text-decoration: none;
  display: block;
}
.druck-front-page--swiss .dfsw-k {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 10px;
}
.druck-front-page--swiss .dfsw-cell h3 {
  margin: 0;
  font-size: 21px;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.01em;
}
.druck-front-page--swiss .dfsw-cell p {
  margin: 9px 0 0;
  font-size: 13.5px;
  line-height: 1.45;
  color: #333;
}
.druck-front-page--swiss .dfsw-brief {
  list-style: none;
  margin: 34px 0 0;
  padding: 0;
}
.druck-front-page--swiss .dfsw-brief li {
  border-top: 1px solid #d4d4d4;
}
.druck-front-page--swiss .dfsw-brief a {
  display: flex;
  gap: 16px;
  align-items: baseline;
  padding: 12px 0;
  color: inherit;
  text-decoration: none;
}
.druck-front-page--swiss .dfsw-bt {
  font-size: 16px;
  font-weight: 700;
}
.druck-front-page--swiss .dfsw-brief time {
  margin-left: auto;
  font-size: 12px;
  color: #888;
  white-space: nowrap;
}
@media (max-width: 800px) {
  .druck-front-page--swiss .dfsw-lead,
  .druck-front-page--swiss .dfsw-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: Controller visual check (the implementer notes this; the controller runs it)**

The controller renders the real feed through `look: 'swiss'` headless and confirms: red accent rule, flush-left grid, hairline cell rules, brief list, narrow-width collapse. The implementer does not need a browser.

- [ ] **Step 7: Commit**

```bash
git add packages/druck-engine/src/frontpage.ts packages/druck-engine/src/frontpage.test.ts packages/druck-css/feed.css
```
then:
```bash
git commit -m "feat(engine,css): add the swiss front-page look"
```

---

## Task 3: Helvetica look

**Files:** Modify `frontpage.ts`, `frontpage.test.ts`; append to `feed.css`.

**Interfaces:** Produces `composeHelvetica(rows, opts?)` registered under `helvetica`; emits `dfhe-top`, `dfhe-wm`, `dfhe-meta`, `dfhe-lead`, `dfhe-cat`, `dfhe-list`, `dfhe-c`, `dfhe-t` under `.druck-front-page--helvetica`.

- [ ] **Step 1: Write the failing test**

```ts
describe('engine look: helvetica', () => {
  it('scopes the wrapper, renders structure, and escapes', () => {
    const items = [
      item(0, { hot: true, title: '<script>x</script>', shareUrl: 'javascript:alert(1)' }),
      item(1), item(2), item(3), item(4), item(5),
    ];
    const html = renderFrontPage(buildFrontPage(items), { look: 'helvetica' });
    expect(html).toContain('druck-front-page--helvetica');
    expect(html).toContain('dfhe-lead');
    expect(html).toContain('dfhe-list');
    expect(html).not.toContain('<script>x</script>');
    expect(html).not.toContain('javascript:alert(1)');
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `pnpm --filter @druck-editorial/engine test` → FAIL (no `--helvetica`).

- [ ] **Step 3: Implement + register**

```ts
function composeHelvetica(rows: FrontPageRow[], _opts?: RenderOptions): string {
  const { lead, cells, brief } = partitionRows(rows);
  const parts: string[] = [
    `<div class="dfhe-top"><span class="dfhe-wm">Druck</span><span class="dfhe-meta">${escapeHtml(lead?.publishedAt ?? '')}</span></div>`,
  ];
  if (lead) {
    parts.push(
      `<a class="dfhe-lead" href="${safeHref(lead)}">` +
      `<span class="dfhe-cat">${escapeHtml(lead.category)}</span>` +
      `<h2>${escapeHtml(lead.title)}</h2><p>${escapeHtml(lead.subtitle)}</p></a>`
    );
  }
  const rest = [...cells, ...brief];
  if (rest.length) {
    parts.push('<ol class="dfhe-list">' + rest.map((i) =>
      `<li><a href="${safeHref(i)}"><span class="dfhe-c">${escapeHtml(i.category)}</span>` +
      `<span class="dfhe-t">${escapeHtml(i.title)}</span></a></li>`
    ).join('') + '</ol>');
  }
  return parts.join('');
}
```

Register: add `helvetica: composeHelvetica,` to `COMPOSERS`.

- [ ] **Step 4: Run to verify it passes** — test + typecheck green.

- [ ] **Step 5: Append the CSS**

```css
/* Helvetica look */
.druck-front-page--helvetica {
  background: #fff;
  color: #000;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  padding: 40px clamp(16px, 5vw, 56px) 64px;
}
.druck-front-page--helvetica .dfhe-top {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  border-bottom: 1px solid #000;
  padding-bottom: 8px;
}
.druck-front-page--helvetica .dfhe-lead {
  display: block;
  color: inherit;
  text-decoration: none;
  padding: 36px 0 30px;
  border-bottom: 1px solid #000;
}
.druck-front-page--helvetica .dfhe-cat {
  font-size: 12px;
  letter-spacing: 0.04em;
}
.druck-front-page--helvetica .dfhe-lead h2 {
  margin: 10px 0 14px;
  font-weight: 700;
  font-size: clamp(40px, 7vw, 86px);
  letter-spacing: -0.045em;
  line-height: 0.94;
  text-wrap: balance;
}
.druck-front-page--helvetica .dfhe-lead p {
  margin: 0;
  font-size: 18px;
  line-height: 1.4;
  max-width: 50ch;
}
.druck-front-page--helvetica .dfhe-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.druck-front-page--helvetica .dfhe-list li {
  border-bottom: 1px solid #cfcfcf;
}
.druck-front-page--helvetica .dfhe-list a {
  display: grid;
  grid-template-columns: 9rem 1fr;
  gap: 18px;
  align-items: baseline;
  padding: 16px 0;
  color: inherit;
  text-decoration: none;
}
.druck-front-page--helvetica .dfhe-c {
  font-size: 12px;
  letter-spacing: 0.04em;
  color: #888;
  text-transform: lowercase;
}
.druck-front-page--helvetica .dfhe-t {
  font-size: clamp(20px, 2.6vw, 30px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.04;
}
@media (max-width: 640px) {
  .druck-front-page--helvetica .dfhe-list a {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
```

- [ ] **Step 6: Controller visual check** — pure black-on-white, oversized lead headline, clean two-column typographic list.

- [ ] **Step 7: Commit**

```bash
git add packages/druck-engine/src/frontpage.ts packages/druck-engine/src/frontpage.test.ts packages/druck-css/feed.css
```
then:
```bash
git commit -m "feat(engine,css): add the helvetica front-page look"
```

---

## Task 4: Broadsheet look

**Files:** Modify `frontpage.ts`, `frontpage.test.ts`; append to `feed.css`.

**Interfaces:** Produces `composeBroadsheet(rows, opts?)` registered under `broadsheet`; emits `dfbr-mast`, `dfbr-rule`, `dfbr-date`, `dfbr-leadtitle`, `dfbr-sub`, `dfbr-cols`, `dfbr-story`, `dfbr-drop` under `.druck-front-page--broadsheet`.

- [ ] **Step 1: Write the failing test**

```ts
describe('engine look: broadsheet', () => {
  it('scopes the wrapper, renders columns, and escapes', () => {
    const items = [
      item(0, { hot: true, title: '<script>x</script>', shareUrl: 'javascript:alert(1)' }),
      item(1), item(2), item(3), item(4), item(5),
    ];
    const html = renderFrontPage(buildFrontPage(items), { look: 'broadsheet' });
    expect(html).toContain('druck-front-page--broadsheet');
    expect(html).toContain('dfbr-mast');
    expect(html).toContain('dfbr-cols');
    expect(html).not.toContain('<script>x</script>');
    expect(html).not.toContain('javascript:alert(1)');
  });
});
```

- [ ] **Step 2: Run to verify it fails** — FAIL.

- [ ] **Step 3: Implement + register**

```ts
function composeBroadsheet(rows: FrontPageRow[], _opts?: RenderOptions): string {
  const { lead, cells, brief } = partitionRows(rows);
  const parts: string[] = ['<div class="dfbr-mast">The Druck</div><div class="dfbr-rule"></div>'];
  if (lead) {
    parts.push(`<div class="dfbr-date">${escapeHtml(lead.publishedAt)}</div>`);
    parts.push(`<a class="dfbr-leadtitle" href="${safeHref(lead)}"><h2>${escapeHtml(lead.title)}</h2></a>`);
    parts.push(`<p class="dfbr-sub">${escapeHtml(lead.subtitle)}</p>`);
  }
  const stories = [...cells, ...brief];
  if (stories.length) {
    parts.push('<div class="dfbr-cols">' + stories.map((s, i) =>
      `<div class="dfbr-story${i === 0 ? ' dfbr-drop' : ''}"><h3>${escapeHtml(s.category)}</h3>` +
      `<a href="${safeHref(s)}"><b>${escapeHtml(s.title)}</b></a> ${escapeHtml(s.subtitle)}</div>`
    ).join('') + '</div>');
  }
  return parts.join('');
}
```

Register: add `broadsheet: composeBroadsheet,` to `COMPOSERS`.

- [ ] **Step 4: Run to verify it passes** — test + typecheck green.

- [ ] **Step 5: Append the CSS**

```css
/* Broadsheet look */
.druck-front-page--broadsheet {
  background: #f6f1e6;
  color: #1a1611;
  font-family: Georgia, "Times New Roman", serif;
  padding: 30px clamp(16px, 4vw, 40px) 60px;
}
.druck-front-page--broadsheet .dfbr-mast {
  text-align: center;
  font-size: clamp(34px, 5vw, 58px);
  font-weight: 700;
  font-variant: small-caps;
  letter-spacing: 0.02em;
}
.druck-front-page--broadsheet .dfbr-rule {
  border-top: 3px double #1a1611;
  border-bottom: 1px solid #1a1611;
  height: 4px;
  margin: 8px 0;
}
.druck-front-page--broadsheet .dfbr-date {
  text-align: center;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #6a5f4c;
  margin-bottom: 22px;
}
.druck-front-page--broadsheet .dfbr-leadtitle {
  color: inherit;
  text-decoration: none;
}
.druck-front-page--broadsheet .dfbr-leadtitle h2 {
  margin: 0 auto 14px;
  text-align: center;
  font-size: clamp(34px, 5.4vw, 66px);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.01em;
  max-width: 18ch;
  text-wrap: balance;
}
.druck-front-page--broadsheet .dfbr-sub {
  text-align: center;
  font-style: italic;
  font-size: 18px;
  color: #54493a;
  margin: 0 auto 28px;
  max-width: 48ch;
}
.druck-front-page--broadsheet .dfbr-cols {
  columns: 3;
  column-gap: 30px;
  column-rule: 1px solid #cdc3ad;
  font-size: 15px;
  line-height: 1.55;
  text-align: justify;
  hyphens: auto;
}
.druck-front-page--broadsheet .dfbr-story {
  margin: 0 0 14px;
  break-inside: avoid;
}
.druck-front-page--broadsheet .dfbr-story h3 {
  font-variant: small-caps;
  font-size: 15px;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #1a1611;
  margin: 0 0 8px;
  font-weight: 700;
}
.druck-front-page--broadsheet .dfbr-story a {
  color: inherit;
}
.druck-front-page--broadsheet .dfbr-drop::first-letter {
  float: left;
  font-size: 58px;
  line-height: 0.72;
  font-weight: 700;
  padding: 6px 8px 0 0;
}
@media (max-width: 800px) {
  .druck-front-page--broadsheet .dfbr-cols {
    columns: 1;
  }
}
```

Note: `::first-letter` on `.dfbr-drop` applies to the small-caps `h3` first, not the body. That is acceptable for the demo; if the controller's visual check finds the drop-cap landing on the category label instead of the lead paragraph, file it as a finding for a follow-up (the structural look still reads as a broadsheet). Do not redesign the markup in this task without raising it.

- [ ] **Step 6: Controller visual check** — serif masthead, double rule, centered lead headline, justified three-column body, drop-cap, single-column collapse.

- [ ] **Step 7: Commit**

```bash
git add packages/druck-engine/src/frontpage.ts packages/druck-engine/src/frontpage.test.ts packages/druck-css/feed.css
```
then:
```bash
git commit -m "feat(engine,css): add the broadsheet front-page look"
```

---

## Task 5: Luxury look (introduces the shared hero-blocks composer)

**Files:** Modify `frontpage.ts`, `frontpage.test.ts`; append to `feed.css`.

**Interfaces:** Produces `composeHeroBlocks(rows, prefix)` (a shared structural composer parameterized by class prefix) and `composeLuxury` (= `composeHeroBlocks(rows, 'dflx')`) registered under `luxury`. Emits `{prefix}-hero`, `{prefix}-scrim`, `{prefix}-htext`, `{prefix}-kick`, `{prefix}-body`, `{prefix}-story`, `{prefix}-k` under `.druck-front-page--luxury`. Task 6 (Noir) reuses `composeHeroBlocks` with prefix `dfnr`.

- [ ] **Step 1: Write the failing test**

```ts
describe('engine look: luxury', () => {
  it('scopes the wrapper, renders hero + blocks, and escapes', () => {
    const items = [
      item(0, { hot: true, title: '<script>x</script>', shareUrl: 'javascript:alert(1)' }),
      item(1), item(2), item(3), item(4), item(5),
    ];
    const html = renderFrontPage(buildFrontPage(items), { look: 'luxury' });
    expect(html).toContain('druck-front-page--luxury');
    expect(html).toContain('dflx-hero');
    expect(html).toContain('dflx-body');
    expect(html).not.toContain('<script>x</script>');
    expect(html).not.toContain('javascript:alert(1)');
  });
});
```

- [ ] **Step 2: Run to verify it fails** — FAIL.

- [ ] **Step 3: Implement + register**

```ts
function composeHeroBlocks(rows: FrontPageRow[], prefix: string): string {
  const { lead, cells, brief } = partitionRows(rows);
  const parts: string[] = [];
  if (lead) {
    parts.push(
      `<a class="${prefix}-hero" href="${safeHref(lead)}">` +
      `<img src="${safeImg(lead)}" alt="${escapeHtml(lead.heroImageAlt ?? lead.title)}" loading="lazy" width="1600" height="900">` +
      `<span class="${prefix}-scrim"></span>` +
      `<span class="${prefix}-htext"><span class="${prefix}-kick">${escapeHtml(lead.category)}</span>` +
      `<h2>${escapeHtml(lead.title)}</h2></span></a>`
    );
  }
  const stories = [...cells, ...brief].slice(0, 6);
  if (stories.length) {
    parts.push(`<div class="${prefix}-body">` + stories.map((s) =>
      `<a class="${prefix}-story" href="${safeHref(s)}"><span class="${prefix}-k">${escapeHtml(s.category)}</span>` +
      `<h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.subtitle)}</p></a>`
    ).join('') + '</div>');
  }
  return parts.join('');
}

function composeLuxury(rows: FrontPageRow[], _opts?: RenderOptions): string {
  return composeHeroBlocks(rows, 'dflx');
}
```

Register: add `luxury: composeLuxury,` to `COMPOSERS`.

- [ ] **Step 4: Run to verify it passes** — test + typecheck green.

- [ ] **Step 5: Append the CSS**

```css
/* Luxury look */
.druck-front-page--luxury {
  background: #faf8f5;
  color: #211d1a;
  font-family: Georgia, serif;
}
.druck-front-page--luxury .dflx-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: clamp(360px, 60vh, 560px);
  overflow: hidden;
  color: #fff;
  text-decoration: none;
}
.druck-front-page--luxury .dflx-hero img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.druck-front-page--luxury .dflx-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15,12,9,0.1) 30%, rgba(15,12,9,0.85) 100%);
}
.druck-front-page--luxury .dflx-htext {
  position: relative;
  padding: 56px clamp(20px, 7vw, 80px);
  max-width: 64ch;
}
.druck-front-page--luxury .dflx-kick {
  display: block;
  font-family: Arial, sans-serif;
  font-size: 11px;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  opacity: 0.85;
  margin-bottom: 20px;
}
.druck-front-page--luxury .dflx-htext h2 {
  margin: 0;
  font-size: clamp(38px, 5.6vw, 82px);
  font-weight: 400;
  font-style: italic;
  line-height: 1.02;
  letter-spacing: -0.01em;
  text-shadow: 0 1px 30px rgba(0,0,0,0.4);
}
.druck-front-page--luxury .dflx-body {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 48px;
  padding: 54px clamp(20px, 6vw, 64px);
}
.druck-front-page--luxury .dflx-story {
  color: inherit;
  text-decoration: none;
}
.druck-front-page--luxury .dflx-k {
  display: block;
  font-family: Arial, sans-serif;
  font-size: 10px;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: #a2978a;
  margin-bottom: 14px;
}
.druck-front-page--luxury .dflx-story h3 {
  margin: 0;
  font-size: 26px;
  font-weight: 400;
  line-height: 1.12;
  letter-spacing: -0.01em;
}
.druck-front-page--luxury .dflx-story p {
  margin: 13px 0 0;
  font-size: 15px;
  line-height: 1.6;
  color: #5c5248;
}
@media (max-width: 800px) {
  .druck-front-page--luxury .dflx-body {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}
```

- [ ] **Step 6: Controller visual check** — full-bleed hero with scrim and italic serif headline, airy three-column story row, single-column collapse.

- [ ] **Step 7: Commit**

```bash
git add packages/druck-engine/src/frontpage.ts packages/druck-engine/src/frontpage.test.ts packages/druck-css/feed.css
```
then:
```bash
git commit -m "feat(engine,css): add the luxury front-page look and shared hero-blocks composer"
```

---

## Task 6: Noir look (reuses the hero-blocks composer)

**Files:** Modify `frontpage.ts`, `frontpage.test.ts`; append to `feed.css`.

**Interfaces:** Produces `composeNoir(rows, opts?)` = `composeHeroBlocks(rows, 'dfnr')`, registered under `noir`. Emits `dfnr-*` classes under `.druck-front-page--noir`.

- [ ] **Step 1: Write the failing test**

```ts
describe('engine look: noir', () => {
  it('scopes the wrapper, renders hero + blocks, and escapes', () => {
    const items = [
      item(0, { hot: true, title: '<script>x</script>', shareUrl: 'javascript:alert(1)' }),
      item(1), item(2), item(3), item(4), item(5),
    ];
    const html = renderFrontPage(buildFrontPage(items), { look: 'noir' });
    expect(html).toContain('druck-front-page--noir');
    expect(html).toContain('dfnr-hero');
    expect(html).toContain('dfnr-body');
    expect(html).not.toContain('<script>x</script>');
    expect(html).not.toContain('javascript:alert(1)');
  });
});
```

- [ ] **Step 2: Run to verify it fails** — FAIL.

- [ ] **Step 3: Implement + register**

```ts
function composeNoir(rows: FrontPageRow[], _opts?: RenderOptions): string {
  return composeHeroBlocks(rows, 'dfnr');
}
```

Register: add `noir: composeNoir,` to `COMPOSERS`.

- [ ] **Step 4: Run to verify it passes** — test + typecheck green.

- [ ] **Step 5: Append the CSS**

```css
/* Noir look */
.druck-front-page--noir {
  background: #0c0b0a;
  color: #e8e2d6;
  font-family: Georgia, serif;
}
.druck-front-page--noir .dfnr-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: clamp(360px, 60vh, 560px);
  overflow: hidden;
  color: #fff;
  text-decoration: none;
}
.druck-front-page--noir .dfnr-hero img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.6) brightness(0.7);
}
.druck-front-page--noir .dfnr-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.9) 100%);
}
.druck-front-page--noir .dfnr-htext {
  position: relative;
  padding: 56px clamp(20px, 7vw, 80px);
  max-width: 60ch;
}
.druck-front-page--noir .dfnr-kick {
  display: block;
  font-family: Arial, sans-serif;
  font-size: 11px;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: #c9a86a;
  margin-bottom: 20px;
}
.druck-front-page--noir .dfnr-htext h2 {
  margin: 0;
  font-size: clamp(38px, 5.6vw, 82px);
  font-weight: 400;
  font-style: italic;
  line-height: 1.02;
  letter-spacing: -0.01em;
}
.druck-front-page--noir .dfnr-body {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 48px;
  padding: 54px clamp(20px, 6vw, 64px);
}
.druck-front-page--noir .dfnr-story {
  color: inherit;
  text-decoration: none;
  border-top: 1px solid #2a2722;
  padding-top: 18px;
}
.druck-front-page--noir .dfnr-k {
  display: block;
  font-family: Arial, sans-serif;
  font-size: 10px;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: #c9a86a;
  margin-bottom: 14px;
}
.druck-front-page--noir .dfnr-story h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 400;
  font-style: italic;
  line-height: 1.14;
}
.druck-front-page--noir .dfnr-story p {
  margin: 13px 0 0;
  font-size: 15px;
  line-height: 1.6;
  color: #8c857a;
}
@media (max-width: 800px) {
  .druck-front-page--noir .dfnr-body {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}
```

- [ ] **Step 6: Controller visual check** — black-and-gold, dimmed cinematic hero, italic serif, gold tracked kickers, single-column collapse.

- [ ] **Step 7: Commit**

```bash
git add packages/druck-engine/src/frontpage.ts packages/druck-engine/src/frontpage.test.ts packages/druck-css/feed.css
```
then:
```bash
git commit -m "feat(engine,css): add the noir front-page look"
```

---

## Task 7: Kinetic Bento look

**Files:** Modify `frontpage.ts`, `frontpage.test.ts`; append to `feed.css`.

**Interfaces:** Produces `composeBento(rows, opts?)` registered under `bento`; emits `dfbn-head`, `dfbn-wm`, `dfbn-grid`, `dfbn-tile`, `dfbn-hero`, `dfbn-ov`, `dfbn-tag`, `dfbn-mini` under `.druck-front-page--bento`.

- [ ] **Step 1: Write the failing test**

```ts
describe('engine look: bento', () => {
  it('scopes the wrapper, renders tiles, and escapes', () => {
    const items = [
      item(0, { hot: true, title: '<script>x</script>', shareUrl: 'javascript:alert(1)' }),
      item(1), item(2), item(3), item(4), item(5),
    ];
    const html = renderFrontPage(buildFrontPage(items), { look: 'bento' });
    expect(html).toContain('druck-front-page--bento');
    expect(html).toContain('dfbn-grid');
    expect(html).toContain('dfbn-hero');
    expect(html).not.toContain('<script>x</script>');
    expect(html).not.toContain('javascript:alert(1)');
  });
});
```

- [ ] **Step 2: Run to verify it fails** — FAIL.

- [ ] **Step 3: Implement + register**

```ts
function composeBento(rows: FrontPageRow[], _opts?: RenderOptions): string {
  const { lead, cells, brief } = partitionRows(rows);
  const tiles: string[] = [];
  if (lead) {
    tiles.push(
      `<a class="dfbn-tile dfbn-hero" href="${safeHref(lead)}">` +
      `<img src="${safeImg(lead)}" alt="${escapeHtml(lead.heroImageAlt ?? lead.title)}" loading="lazy" width="1200" height="800">` +
      '<span class="dfbn-ov"></span>' +
      `<span class="dfbn-tag">${escapeHtml(lead.category)}</span>` +
      `<h3>${escapeHtml(lead.title)}</h3></a>`
    );
  }
  cells.forEach((c) => {
    tiles.push(
      `<a class="dfbn-tile" href="${safeHref(c)}"><span class="dfbn-tag">${escapeHtml(c.category)}</span>` +
      `<h4>${escapeHtml(c.title)}</h4></a>`
    );
  });
  brief.slice(0, 3).forEach((b) => {
    tiles.push(
      `<a class="dfbn-tile dfbn-mini" href="${safeHref(b)}"><span class="dfbn-tag">${escapeHtml(b.category)}</span>` +
      `<h4>${escapeHtml(b.title)}</h4></a>`
    );
  });
  return `<div class="dfbn-head"><span class="dfbn-wm">Druck</span></div><div class="dfbn-grid">${tiles.join('')}</div>`;
}
```

Register: add `bento: composeBento,` to `COMPOSERS`.

- [ ] **Step 4: Run to verify it passes** — test + typecheck green.

- [ ] **Step 5: Append the CSS**

```css
/* Kinetic bento look */
.druck-front-page--bento {
  background: #0e1016;
  color: #fff;
  font-family: Arial, Helvetica, sans-serif;
  padding: 30px clamp(14px, 3vw, 30px) 50px;
}
.druck-front-page--bento .dfbn-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
.druck-front-page--bento .dfbn-wm {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.03em;
}
.druck-front-page--bento .dfbn-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 180px;
  gap: 14px;
}
.druck-front-page--bento .dfbn-tile {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  color: #fff;
  text-decoration: none;
  background: #181b24;
  border: 1px solid #262a36;
  animation: dfbn-rise linear both;
  animation-timeline: view();
  animation-range: entry 2% cover 34%;
}
@keyframes dfbn-rise {
  from { opacity: 0; transform: translateY(26px) scale(0.985); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .druck-front-page--bento .dfbn-tile { animation: none; }
}
@supports not (animation-timeline: view()) {
  .druck-front-page--bento .dfbn-tile { animation: none; }
}
.druck-front-page--bento .dfbn-hero {
  grid-column: span 2;
  grid-row: span 2;
  background: #222;
}
.druck-front-page--bento .dfbn-hero img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.druck-front-page--bento .dfbn-ov {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(10,12,22,0.1), rgba(10,12,22,0.85));
}
.druck-front-page--bento .dfbn-tag {
  position: absolute;
  top: 14px;
  left: 18px;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.85;
}
.druck-front-page--bento .dfbn-hero h3 {
  position: relative;
  margin: 0;
  font-size: clamp(22px, 2.8vw, 34px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
}
.druck-front-page--bento .dfbn-tile h4 {
  position: relative;
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
}
.druck-front-page--bento .dfbn-tile:nth-child(3n) { background: linear-gradient(150deg, #3b2bd0, #7b2ff7); border: 0; }
.druck-front-page--bento .dfbn-tile:nth-child(4n) { background: linear-gradient(150deg, #0ea5a5, #155e75); border: 0; }
@media (max-width: 800px) {
  .druck-front-page--bento .dfbn-grid { grid-template-columns: 1fr; grid-auto-rows: 200px; }
  .druck-front-page--bento .dfbn-hero { grid-column: auto; grid-row: auto; min-height: 240px; }
}
```

- [ ] **Step 6: Controller visual check** — asymmetric dark tiles, large hero tile, gradient accent tiles, scroll-reveal on scroll (and static under reduced-motion), single-column collapse.

- [ ] **Step 7: Commit**

```bash
git add packages/druck-engine/src/frontpage.ts packages/druck-engine/src/frontpage.test.ts packages/druck-css/feed.css
```
then:
```bash
git commit -m "feat(engine,css): add the kinetic bento front-page look"
```

---

## Task 8: Almanac look

**Files:** Modify `frontpage.ts`, `frontpage.test.ts`; append to `feed.css`.

**Interfaces:** Produces `composeAlmanac(rows, opts?)` registered under `almanac`; emits `dfal-top`, `dfal-est`, `dfal-leadtitle`, `dfal-orn`, `dfal-cols`, `dfal-entry` under `.druck-front-page--almanac`.

- [ ] **Step 1: Write the failing test**

```ts
describe('engine look: almanac', () => {
  it('scopes the wrapper, renders columns, and escapes', () => {
    const items = [
      item(0, { hot: true, title: '<script>x</script>', shareUrl: 'javascript:alert(1)' }),
      item(1), item(2), item(3), item(4), item(5),
    ];
    const html = renderFrontPage(buildFrontPage(items), { look: 'almanac' });
    expect(html).toContain('druck-front-page--almanac');
    expect(html).toContain('dfal-cols');
    expect(html).toContain('dfal-top');
    expect(html).not.toContain('<script>x</script>');
    expect(html).not.toContain('javascript:alert(1)');
  });
});
```

- [ ] **Step 2: Run to verify it fails** — FAIL.

- [ ] **Step 3: Implement + register**

```ts
function composeAlmanac(rows: FrontPageRow[], _opts?: RenderOptions): string {
  const { lead, cells, brief } = partitionRows(rows);
  const parts: string[] = ['<div class="dfal-top">The Druck Almanac</div><div class="dfal-est">Compiled from the wire</div>'];
  if (lead) {
    parts.push(`<a class="dfal-leadtitle" href="${safeHref(lead)}"><h2>${escapeHtml(lead.title)}</h2></a>`);
    parts.push('<div class="dfal-orn">&sect; &mdash; &sect;</div>');
  }
  const stories = [...cells, ...brief];
  if (stories.length) {
    parts.push('<div class="dfal-cols">' + stories.map((s) =>
      `<div class="dfal-entry"><a href="${safeHref(s)}"><b>${escapeHtml(s.title)}</b></a> ${escapeHtml(s.subtitle)}</div>`
    ).join('') + '</div>');
  }
  return parts.join('');
}
```

Register: add `almanac: composeAlmanac,` to `COMPOSERS`.

- [ ] **Step 4: Run to verify it passes** — test + typecheck green.

- [ ] **Step 5: Append the CSS**

```css
/* Almanac look */
.druck-front-page--almanac {
  background: #efe7d0;
  color: #352c1c;
  font-family: Georgia, "Times New Roman", serif;
  padding: 26px clamp(16px, 4vw, 40px) 56px;
}
.druck-front-page--almanac .dfal-top {
  text-align: center;
  border-top: 2px solid #352c1c;
  border-bottom: 1px solid #352c1c;
  padding: 6px 0;
  font-size: clamp(26px, 4vw, 44px);
  font-weight: 700;
  font-variant: small-caps;
  letter-spacing: 0.05em;
}
.druck-front-page--almanac .dfal-est {
  text-align: center;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #7a6c4d;
  margin: 6px 0 18px;
}
.druck-front-page--almanac .dfal-leadtitle {
  color: inherit;
  text-decoration: none;
}
.druck-front-page--almanac .dfal-leadtitle h2 {
  margin: 0;
  text-align: center;
  font-size: clamp(28px, 4.4vw, 50px);
  font-weight: 700;
  line-height: 1.04;
  max-width: 20ch;
  margin: 0 auto;
  text-wrap: balance;
}
.druck-front-page--almanac .dfal-orn {
  text-align: center;
  letter-spacing: 0.3em;
  margin: 12px 0 18px;
}
.druck-front-page--almanac .dfal-cols {
  columns: 2;
  column-gap: 28px;
  column-rule: 1px solid #c4b78f;
  font-size: 14px;
  line-height: 1.5;
  text-align: justify;
  hyphens: auto;
}
.druck-front-page--almanac .dfal-entry {
  margin: 0 0 12px;
  break-inside: avoid;
}
.druck-front-page--almanac .dfal-entry a {
  color: inherit;
}
@media (max-width: 700px) {
  .druck-front-page--almanac .dfal-cols { columns: 1; }
}
```

- [ ] **Step 6: Controller visual check** — antique small-caps masthead, ornamental rules, centered lead, dense justified two-column body, single-column collapse.

- [ ] **Step 7: Commit**

```bash
git add packages/druck-engine/src/frontpage.ts packages/druck-engine/src/frontpage.test.ts packages/druck-css/feed.css
```
then:
```bash
git commit -m "feat(engine,css): add the almanac front-page look"
```

---

## Self-Review

**Spec coverage:** All seven remaining engine looks from the spec's engine-look list are implemented (Swiss, Helvetica, Broadsheet, Luxury, Noir, Bento, Almanac), each a registered composer + scoped CSS theme. The shared-base pattern for style-led looks is realized via `composeHeroBlocks` (Luxury + Noir). Scroll-driven motion (Bento) is gated by `@supports` + `prefers-reduced-motion`, satisfying the zero-JS + progressive-enhancement constraint. The Brutalist refactor preserves byte-identical output (the existing Brutalist tests are the regression guard). The twelve landing-only spectacle looks and the immersive showcase remain deferred to Part 3 — out of this plan's scope by design.

**Placeholder scan:** No TBD/TODO. Every composer, CSS block, and test is complete code. The one judgment note (Broadsheet drop-cap possibly landing on the category `h3`) names the exact follow-up trigger rather than leaving an ambiguous instruction.

**Type consistency:** Every composer has signature `(rows: FrontPageRow[], opts?: RenderOptions) => string` matching `FrontPageComposer`. `partitionRows`/`safeHref`/`safeImg` (Task 1) are consumed by every later composer with the names defined. Each look's emitted `df{xx}-` class names match its CSS block's selectors. Registry keys (`swiss`, `helvetica`, `broadsheet`, `luxury`, `noir`, `bento`, `almanac`) are all members of the `FrontPageLook` union defined in Part 1.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-20-druck-front-page-looks-part2.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, controller review + visual check between tasks.
2. **Inline Execution** — tasks run in this session with checkpoints.

Which approach?
