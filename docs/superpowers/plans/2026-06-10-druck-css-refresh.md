# Druck CSS Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `packages/druck-css/article.css` (1,785 lines) into 8 maintainable partials + barrel, then refresh landing page ledes.

**Architecture:** Pure file decomposition — no selector renames, no behavior changes. The barrel `article.css` imports 8 partials in cascade-preserving order. Existing consumers (widget CDN URL, app import, article templates) continue to reference `article.css` unchanged.

**Tech Stack:** Vite 6, pnpm workspaces, Playwright visual regression, vitest.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `packages/druck-css/tokens.css` | Create | Base tokens, palette, reset, typography tokens |
| `packages/druck-css/hero.css` | Create | Hero section, hero image, inline figure, print-reveal filter |
| `packages/druck-css/body.css` | Create | Article body, chapters, key points, quotes, know cards, progress rail, chapter number, stat animations |
| `packages/druck-css/components.css` | Create | Read-next, similar cards/grid, article footer, share buttons, end-of-article share bar, lang-switcher |
| `packages/druck-css/wire.css` | Create | Post-simple layout, wire pull-quote, why-it-matters, related context, wire language polish |
| `packages/druck-css/weekly.css` | Create | Weekly recap accents, hero, body, controls, similar cards, mobile adjustments |
| `packages/druck-css/language.css` | Create | Per-language tier tokens (DE/FR/ES/NL/FI/PL/IT/JA/ZH/KO), editorial typography polish, quote glyphs, hyphenation |
| `packages/druck-css/theme.css` | Create | Dark theme overrides, grain overlay, source-filter image filters |
| `packages/druck-css/article.css` | Modify | Barrel: `@import` the 8 partials in order |
| `packages/druck-css/package.json` | Modify | Add 8 partials to `files` array |
| `apps/druck-app/index.html` | Modify | Refresh 4 lede sublines + hero h1 |

---

## Source File Boundary Reference

The following line ranges from `packages/druck-css/article.css` (as of 2026-06-10) map to each new partial. Copy each block verbatim — preserve comments, whitespace, and selector order exactly.

### tokens.css
- Lines 1–71: base tokens, per-category palette, reset, typography tokens

### hero.css
- Lines 73–76: `.article-progress` (legacy sticky bar)
- Lines 77–129: hero section, kicker, title, accent-word, deck, byline, hero image, inline figure
- Lines 802–818: print-reveal image filter animation

### body.css
- Lines 131–176: article-body, chapter-panel, chapter-reveal animation, chapter-head, chapter-title, chapter-body, end-mark, reduced-motion media query
- Lines 177–182: editor's note
- Lines 183–190: key-points
- Lines 191–200: article-stat
- Lines 202–209: source-quote
- Lines 211–221: know-cards
- Lines 336–350: vertical rhythm tightening for `.article-shell`
- Lines 789–800: reading-progress rail
- Lines 820–846: oversized chapter number in margin (CSS counter)
- Lines 935–955: `aside[data-stat]` / `blockquote[data-source]` scroll animations

### components.css
- Lines 223–234: read-next-feature
- Lines 235–294: similar-section, similar-head, similar-articles, similar-grid
- Lines 351–393: article-sources, article-byline-bar, article-byline-bottom
- Lines 394–464: similar-grid standalone tiles
- Lines 446–463: article footer
- Lines 733–775: share-btn (base + dark rules — keep together)
- Lines 870–933: end-of-article share bar
- Lines 1616–1785: lang-switcher

### wire.css
- Lines 466–731: post-simple layout, wire pull-quote, why-it-matters, related context, post-simple footer, source list
- Lines 1166–1259: wire/post-simple per-language polish (JA, FR, ES, DE)

### weekly.css
- Lines 331–335: display-none rules that show key-points only in weekly
- Lines 957–1110: weekly recap section accents, weekly body, weekly controls, weekly typography, key-points overrides
- Lines 1431–1615: weekly recap thesis, section narrative, JA-specific weekly rules, missing-thumbnail fallbacks, recap-more similar cards

### language.css
- Lines 1091–1165: language-tier token overrides (DE/FR/ES/NL/FI/PL/IT/JA/ZH/KO)
- Lines 1260–1426: editorial typography polish for EN/DE/FR/ES/JA (article-body, chapter-body, recap surfaces, quotes, headlines)
- Lines 1507–1548: JA-specific weekly body rules (word-break, overflow-wrap, line-break)

### theme.css
- Lines 296–330: dark theme token overrides for article-shell/post-simple
- Lines 848–868: page grain overlay (`body::after`)
- Lines 1038–1089: source-filter image filters (base + dark variants)

---

## Task 1: Create tokens.css

**Files:**
- Create: `packages/druck-css/tokens.css`

- [ ] **Step 1: Write tokens.css**

Copy lines 1–71 from `packages/druck-css/article.css` into the new file verbatim.

```css
/* === Druck article — base tokens === */
.article-shell {
  --color-bg: #f6f4f1;
  --color-surface: #ffffff;
  --color-text: #1a1612;
  --color-text-secondary: #4a463f;
  --color-text-muted: #6b665d;
  --color-text-faint: #8a857a;
  --color-hairline: rgba(0, 0, 0, 0.06);
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
  --shadow-card-hover: 0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
  --font-heading: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif;
  --font-body: 'General Sans', -apple-system, "SF Pro Text", system-ui, sans-serif;
  --font-accent: "Times New Roman", Georgia, serif;
  --font-serif: 'Source Serif 4', Charter, 'Iowan Old Style', Georgia, serif;

  --accent: #3A5A6D;
  --accent-tint: rgba(58, 90, 109, 0.05);
  --accent-wash: rgba(58, 90, 109, 0.11);
}

/* === Per-category palette === */
.article-shell.cat-ai,             .post-simple.cat-ai             { --accent:#5F5AAF; --accent-tint:rgba(95,90,175,0.05);   --accent-wash:rgba(95,90,175,0.12); }
.article-shell.cat-security,       .post-simple.cat-security       { --accent:#9D3F2E; --accent-tint:rgba(157,63,46,0.05);   --accent-wash:rgba(157,63,46,0.12); }
.article-shell.cat-dev-tools,      .post-simple.cat-dev-tools      { --accent:#477259; --accent-tint:rgba(71,114,89,0.05);  --accent-wash:rgba(71,114,89,0.12); }
.article-shell.cat-infrastructure, .post-simple.cat-infrastructure { --accent:#20756D; --accent-tint:rgba(32,117,109,0.05);   --accent-wash:rgba(32,117,109,0.12); }
.article-shell.cat-business,       .post-simple.cat-business       { --accent:#805F00; --accent-tint:rgba(128,95,0,0.05);  --accent-wash:rgba(128,95,0,0.12); }
.article-shell.cat-big-tech,       .post-simple.cat-big-tech       { --accent:#20756D; --accent-tint:rgba(32,117,109,0.05);   --accent-wash:rgba(32,117,109,0.12); }
.article-shell.cat-policy,         .post-simple.cat-policy         { --accent:#5F4425; --accent-tint:rgba(95,68,37,0.05);   --accent-wash:rgba(95,68,37,0.12); }
.article-shell.cat-science,        .post-simple.cat-science        { --accent:#216B61; --accent-tint:rgba(33,107,97,0.05);  --accent-wash:rgba(33,107,97,0.12); }
.article-shell.cat-weekly,          .post-simple.cat-weekly          { --accent:#40546A; --accent-tint:rgba(64,84,106,0.05);   --accent-wash:rgba(64,84,106,0.12); }

/* === Reset === */
.article-shell, .article-shell *, .article-shell *::before, .article-shell *::after { box-sizing: border-box; }
.article-shell { background: var(--color-bg); color: var(--color-text); font-family: var(--font-body); -webkit-font-smoothing: antialiased; overflow-wrap: anywhere; }

/* === Typography tokens === */
.article-shell, .post-simple {
  --type-headline-font: var(--font-heading);
  --type-headline-scale: 1;
  --type-headline-tracking: -0.045em;
  --type-headline-leading: 1.02;
  --type-headline-weight: 800;
  --type-headline-max: 18ch;

  --type-accent-font: var(--font-accent);
  --type-accent-style: italic;
  --type-accent-weight: 400;
  --type-accent-tracking: -0.02em;

  --type-deck-leading: 1.45;
  --type-deck-weight: 400;

  --type-body-font: var(--font-body);
  --type-body-weight: 400;
  --type-body-leading: 1.78;

  --type-lead-weight: 500;
  --type-lead-tracking: -0.012em;
  --type-lead-leading: 1.5;

  --type-meta-tracking-wide: 0.32em;
  --type-meta-tracking-med: 0.22em;
  --type-meta-tracking-narrow: 0.18em;

  --type-section-tracking: -0.03em;
  --type-section-leading: 1.1;
  --type-section-weight: 720;
  --type-section-max: 24ch;
}
```

- [ ] **Step 2: Verify tokens.css standalone syntax**

Run: `npx stylelint packages/druck-css/tokens.css || echo "stylelint not installed, skipping"`
Expected: No parse errors (stylelint is optional).

---

## Task 2: Create hero.css

**Files:**
- Create: `packages/druck-css/hero.css`

- [ ] **Step 1: Write hero.css**

Copy lines 73–76 and 77–129 and 802–818 from `packages/druck-css/article.css` into the new file, preserving order.

- [ ] **Step 2: Verify**

Confirm the file starts with `.article-progress` and `.article-hero` selectors and ends with the print-reveal `@media (prefers-reduced-motion: reduce)` block.

---

## Task 3: Create body.css

**Files:**
- Create: `packages/druck-css/body.css`

- [ ] **Step 1: Write body.css**

Copy lines 131–182, 183–190, 191–200, 202–209, 211–221, 336–350, 789–800, 820–846, and 935–955 from `packages/druck-css/article.css` into the new file, preserving order.

- [ ] **Step 2: Verify**

Confirm the file contains `.article-body`, `.chapter-panel`, `.editors-note`, `.key-points`, `.article-stat`, `.source-quote`, `.know-cards`, `.reading-progress`, `.chapter-panel::before` (counter), and the `aside[data-stat]` / `blockquote[data-source]` animation blocks.

---

## Task 4: Create components.css

**Files:**
- Create: `packages/druck-css/components.css`

- [ ] **Step 1: Write components.css**

Copy lines 223–234, 235–294, 351–393, 394–464, 446–463, 733–775, 870–933, and 1616–1785 from `packages/druck-css/article.css` into the new file, preserving order.

- [ ] **Step 2: Verify**

Confirm the file contains `.read-next-feature`, `.similar-section`, `.similar-grid`, `.article-sources`, `.article-byline-bottom`, `.similar-grid .similar-card`, `.article-footer`, `.share-btn`, `.article-share-bar`, and `.lang-switcher`.

---

## Task 5: Create wire.css

**Files:**
- Create: `packages/druck-css/wire.css`

- [ ] **Step 1: Write wire.css**

Copy lines 466–731 and 1166–1259 from `packages/druck-css/article.css` into the new file, preserving order.

- [ ] **Step 2: Verify**

Confirm the file contains `.post-simple`, `.wire-pull-quote`, `.wire-why-it-matters`, `.related-context`, `.rc-card`, and the per-language wire polish blocks for JA, FR, ES, DE.

---

## Task 6: Create weekly.css

**Files:**
- Create: `packages/druck-css/weekly.css`

- [ ] **Step 1: Write weekly.css**

Copy lines 331–335, 957–1110, and 1431–1615 from `packages/druck-css/article.css` into the new file, preserving order.

- [ ] **Step 2: Verify**

Confirm the file contains `.article-shell.cat-weekly` section accents, recap-hero, recap-body, recap-article, recap-footer, key-points overrides, thesis drop-cap, JA weekly rules, missing-thumbnail fallbacks, and the display override for `.key-points`.

---

## Task 7: Create language.css

**Files:**
- Create: `packages/druck-css/language.css`

- [ ] **Step 1: Write language.css**

Copy lines 1091–1165, 1260–1426, and 1507–1548 from `packages/druck-css/article.css` into the new file, preserving order.

- [ ] **Step 2: Verify**

Confirm the file contains `:root { --font-cjk: ... }`, `html:is([lang="de"], ...)` tier tokens, and the full editorial typography polish blocks for EN, DE, FR, ES, JA (including `.pull-quote`, `.article-title`, `.chapter-title`, `.recap-headline`, `.recap-section-title`, `.kp-item p`, `.know-card p`).

---

## Task 8: Create theme.css

**Files:**
- Create: `packages/druck-css/theme.css`

- [ ] **Step 1: Write theme.css**

Copy lines 296–330, 848–868, and 1038–1089 from `packages/druck-css/article.css` into the new file, preserving order.

- [ ] **Step 2: Verify**

Confirm the file contains `[data-theme="dark"] :is(.article-shell, .post-simple)` token overrides, `body::after` grain overlay, and the full source-filter image filter block (base + dark variants for filters 0/1/2).

---

## Task 9: Replace article.css with barrel

**Files:**
- Modify: `packages/druck-css/article.css`

- [ ] **Step 1: Delete old content and write barrel**

```css
@import url("tokens.css");
@import url("hero.css");
@import url("body.css");
@import url("components.css");
@import url("wire.css");
@import url("weekly.css");
@import url("language.css");
@import url("theme.css");
```

- [ ] **Step 2: Verify barrel syntax**

Run: `head -1 packages/druck-css/article.css`
Expected: `@import url("tokens.css");`

---

## Task 10: Update package.json files array

**Files:**
- Modify: `packages/druck-css/package.json`

- [ ] **Step 1: Update files array**

```json
{
  "name": "@druck-editorial/css",
  "version": "0.1.0",
  "author": "Artem Iagovdik <artyom.yagovdik@gmail.com>",
  "license": "MIT",
  "main": "article.css",
  "style": "article.css",
  "files": [
    "article.css",
    "tokens.css",
    "hero.css",
    "body.css",
    "components.css",
    "wire.css",
    "weekly.css",
    "language.css",
    "theme.css"
  ]
}
```

- [ ] **Step 2: Verify JSON validity**

Run: `node -e "JSON.parse(require('fs').readFileSync('packages/druck-css/package.json'))"`
Expected: No output (success).

---

## Task 11: Commit CSS refactor

- [ ] **Step 1: Stage and commit**

```bash
git add packages/druck-css/
git commit -m "refactor: split article.css into 8 partials"
```

---

## Task 12: Build and test CSS refactor

- [ ] **Step 1: Type check**

Run: `cd /var/www/druck && pnpm typecheck`
Expected: Pass (no output or `0 errors`).

- [ ] **Step 2: Build**

Run: `cd /var/www/druck/apps/druck-app && pnpm build`
Expected: Build succeeds, no errors. Verify `dist/article.css` exists.

- [ ] **Step 3: Unit tests**

Run: `cd /var/www/druck/apps/druck-app && pnpm test`
Expected: 64 tests pass.

- [ ] **Step 4: E2E tests**

Run: `cd /var/www/druck/apps/druck-app && pnpm run test:e2e`
Expected: 54 tests pass.

- [ ] **Step 5: Visual regression**

Run: `cd /var/www/druck/apps/druck-app && pnpm run test:visual`
Expected: Zero diffs on article snapshots (the split must not change computed styles).

---

## Task 13: Refresh landing page ledes

**Files:**
- Modify: `apps/druck-app/index.html`

- [ ] **Step 1: Update hero h1**

Replace:
```html
<h1 id="hero-heading" class="demo-hero-h1">Structure in,<br><em>magazine out</em></h1>
```
With:
```html
<h1 id="hero-heading" class="demo-hero-h1">Paste JSON. Get a magazine.</h1>
```

- [ ] **Step 2: Update Formats band lede**

Replace:
```html
<p class="band-lede">The same JSON, three editorial registers. The engine decides layout; you decide judgment.</p>
```
With:
```html
<p class="band-lede">Same news. Three registers.</p>
```

- [ ] **Step 3: Update Article band lede**

Replace:
```html
<p class="band-lede">Rendered by the engine at build time. Pick an accent — every category carries its own.</p>
```
With:
```html
<p class="band-lede">Drop one line of HTML. Your article renders anywhere.</p>
```

- [ ] **Step 4: Update Feed band lede**

Replace:
```html
<p class="band-lede">A living feed rendered by the engine — cards from structured JSON, not copy-pasted markup.</p>
```
With:
```html
<p class="band-lede">Your stories. Their brand. Zero conflict.</p>
```

---

## Task 14: Build and test messaging changes

- [ ] **Step 1: Build**

Run: `cd /var/www/druck/apps/druck-app && pnpm build`
Expected: Build succeeds.

- [ ] **Step 2: Serve and verify**

Run: `cd /var/www/druck/apps/druck-app && pnpm preview`
Open `http://localhost:4173` in a browser.

Verify:
- Hero h1 reads "Paste JSON. Get a magazine."
- Formats lede reads "Same news. Three registers."
- Article lede reads "Drop one line of HTML. Your article renders anywhere."
- Feed lede reads "Your stories. Their brand. Zero conflict."
- No layout breakage at 320px, 768px, 1440px breakpoints.

- [ ] **Step 3: Run full test suite**

Run: `cd /var/www/druck/apps/druck-app && pnpm test && pnpm run test:e2e`
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add apps/druck-app/index.html
git commit -m "feat: refresh landing page ledes"
```

---

## Spec Coverage Check

| Spec Requirement | Plan Task |
|-----------------|-----------|
| Split article.css into 8 partials | Tasks 1–10 |
| Preserve cascade order (tokens→hero→body→components→wire→weekly→language→theme) | Task 9 (barrel `@import` order) |
| No selector renames, no behavior changes | All copy tasks (verbatim line ranges) |
| Update `package.json` `files` array | Task 10 |
| Refresh hero h1 to "Paste JSON. Get a magazine." | Task 13 Step 1 |
| Refresh Formats lede to "Same news. Three registers." | Task 13 Step 2 |
| Refresh Article lede to "Drop one line of HTML..." | Task 13 Step 3 |
| Refresh Feed lede to "Your stories. Their brand. Zero conflict." | Task 13 Step 4 |
| Build verification (typecheck, tests, visual regression) | Tasks 12, 14 |
| Two commits (refactor, feat) | Tasks 11, 14 Step 4 |

**Placeholder scan:** No TBD, TODO, or vague steps. Every step shows exact file paths, exact commands, expected output, and exact code for changes.

**Type consistency:** All CSS selectors and file names match the existing codebase. No invented selectors or properties.
