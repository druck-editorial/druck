# Druck Landing Page CSS Refresh — Design Spec

2026-06-10

## What this covers

1. CSS architecture refactor: split `article.css` (1,785 lines) into 8 partials + barrel.
2. Landing page messaging refresh: replace lede sublines with Steve Jobs-style one-liners.
3. Build verification and release.

What is **not** in scope: before/after scrubber, scroll-driven hero, localized chrome, per-language articles, repo-public prep.

---

## 1. CSS Architecture Refactor

### Why now

`packages/druck-css/article.css` has grown to 1,785 lines. It covers tokens, hero, body, components, wire, weekly, language-specific typography, and theme overrides. The file is too large to hold in context during edits, and the language/theme sections are far from the selectors they modify. Splitting into partials keeps each file under ~400 lines and groups related rules.

### Target files (in `packages/druck-css/`)

| File | Responsibility | Line target |
|------|---------------|-------------|
| `tokens.css` | Design tokens, CSS reset, base typography, utility classes | ~200 |
| `hero.css` | Hero section layout, image treatment, print-reveal animation, bottom scrim, text-shadow readability rules | ~180 |
| `body.css` | Article body, chapter panels, key points, pull-quotes, know-cards, editor's note, reading-progress rail | ~350 |
| `components.css` | Similar-card grid, share bars, end-of-article share pill, lang-switcher chip, sticky header | ~280 |
| `wire.css` | Wire/post-simple layout, related-context cards, archive cards, missing-thumbnail fallbacks | ~180 |
| `weekly.css` | Weekly recap accents, recap hero, section styling, recap controls, thesis drop-cap, hairline separators | ~220 |
| `language.css` | Per-language typographic rules: `html[lang="de"]`, `html[lang="fr"]`, `html[lang="es"]`, `html[lang="ja"]` selectors covering body, headlines, quotes, hyphenation, line-height, CJK spacing | ~200 |
| `theme.css` | Dark theme overrides, grain overlay (`body::after`), image filters (`brightness`, `contrast`), sticky-header logo inversion | ~155 |
| `article.css` | Barrel: `@import` the 8 partials above, in order | ~10 |

### Split rules

- **No selector renames.** Every existing selector stays byte-identical. This is a pure file move.
- **No behavior changes.** The computed output of the 9 files combined must match the current monolith.
- **Order matters.** The barrel `@import` sequence must preserve the current cascade: tokens → hero → body → components → wire → weekly → language → theme. Language comes after weekly so per-lang headline rules outrank cat-weekly defaults.
- **Backfill compatibility.** The existing `backfill_article_css_v<N>.py` pattern (bump `?v=N` in templates and backfill rendered HTML) stays unchanged. After the split, if a CSS change requires a version bump, the bump happens in the barrel `article.css` query string and the backfill script updates rendered pages.
- **Build pipeline.** `article.css` is the file referenced by article/weekly templates (`/assets/css/article.css?v=N`). The build copies `packages/druck-css/article.css` to `apps/druck-app/public/article.css` and `apps/druck-app/dist/article.css`. The partials do not need to be copied individually — only the barrel matters at runtime.

### Verification

- `pnpm build` must pass.
- `pnpm test` must pass (64 unit tests, 54 E2E, 60 visual snapshots).
- `pnpm run test:visual` must show zero diffs (no unintended visual changes from the split).

---

## 2. Landing Page Messaging Refresh

### Copy changes in `apps/druck-app/index.html`

Only `<p class="band-lede">` sublines and the hero `<h1>` change. Band `<h2>` titles stay.

| Section | Element | Current text | New text |
|---------|---------|-------------|----------|
| Hero | `h1.demo-hero-h1` | `Structure in,<br><em>magazine out</em>` | `Paste JSON. Get a magazine.` |
| Hero | `p.demo-hero-body` | Full paragraph about Druck | *(keep existing — this is the body copy, not a lede)* |
| Formats | `p.band-lede` | "The same JSON, three editorial registers. The engine decides layout; you decide judgment." | `Same news. Three registers.` |
| Article | `p.band-lede` | "Rendered by the engine at build time. Pick an accent — every category carries its own." | `Drop one line of HTML. Your article renders anywhere.` |
| Feed | `p.band-lede` | "A living feed rendered by the engine — cards from structured JSON, not copy-pasted markup." | `Your stories. Their brand. Zero conflict.` |

The hero `h1` change drops the `<em>` and `<br>` — it becomes a single-line plain sentence. No markup changes beyond swapping text content.

### Verification

- Open `index.html` in browser after build.
- Confirm each band displays the new text.
- Confirm no layout breakage from shorter text (one-liners are shorter than the current paragraphs, so padding/rhythm should still hold).

---

## 3. Implementation Order

1. **CSS split** — read `article.css`, partition into 8 files, write barrel.
2. **Build + test** — verify zero visual regression.
3. **Messaging** — edit `index.html` lede texts.
4. **Final build + test** — full verification.
5. **Commit** — two commits:
   - `refactor: split article.css into 8 partials`
   - `feat: refresh landing page ledes`

---

## 4. Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Selector order changes during split, breaking cascade | Import order in barrel matches current file top-to-bottom; verify with visual regression |
| Duplicate `@media` or `@font-face` rules after split | Only tokens.css holds `@font-face`; only theme.css holds dark `@media` — no duplicates |
| Landing page one-liners break layout at narrow widths | Text is shorter, not longer — safe. Still verify 320px breakpoint |

---

## 5. Post-MVP Deferred (not in this spec)

- Before/after scrubber for the hero stage
- Scroll-driven hero variant
- Localized UI chrome (language switcher for landing page strings)
- Per-language full articles on landing
- Make repo public
