# Druck Landing Premium Polish — Design Spec

2026-06-10. Builds on `2026-06-10-druck-landing-recut-design.md` and `2026-06-10-druck-real-site-demos-design.md`. Triggered by an external design review; every recommendation was checked against the actual page before adoption.

## Goal

Feed-first, cinematic premium pass on the landing. The feed widget is the protagonist; article pages are the depth behind it. Two theatrical moments, both real: the hero prints a front page out of a JSON feed, and the page measures itself being read. Every claim on the page is measured at build, measured at runtime, or verifiable by link.

## Hard rules

- Facts only. No aspirational adjectives. Numbers come from build-time measurement (tokens), runtime measurement (live meters), or linked proof (MIT license, GitHub, audit summary). Roadmap items are labeled "Planned".
- No new accent colors. No violet. Technical register = monospace + gray; JSON syntax keeps the existing terracotta/slate/ochre tokens.
- Budgets hold: Lighthouse 100x4, initial transfer <= 250 KB, page height <= 10,000px, no new runtime dependencies. Interactivity stays islands + IntersectionObserver.
- All motion is transform/opacity only, zero CLS, no scroll-jacking. `prefers-reduced-motion: reduce` disables every choreography item.
- Both themes are first-class. The paper/ink band alternation is part of the composition.

## Page structure

01 ENGINE (hero + facts strip, paper) -> 02 SURFACES (paper) -> 03 IN THE WILD (ink) -> 04 FRONT PAGE (paper) -> 05 RANGE (paper) -> 06 ANALYTICS (ink) -> 07 COLOPHON (ink).

Two "cut to black" moments: into 03 and into 06+07. Estimated height ~9,300px (budget 10,000).

## 01 ENGINE — hero becomes JSON feed -> front page

- Stage grid changes 5fr/7fr -> 4fr/8fr. JSON pane narrower, text slightly muted (~0.9 opacity); output pane dominant: soft warm-white outer glow in dark theme, strengthened layered shadow in light, 1px top-edge highlight.
- JSON pane shows a feed array: first ArticleData item in full, then a closing pseudo-line `… 11 more stories` (tokenizer gains a muted style for it). New fixture `hero-feed.json`, 12 items.
- Output pane renders `renderFrontPage(buildFrontPage(items))` of the same fixture. The existing step sequence reveals rows in order: hero card -> feature row -> triple -> In brief. Replay button stays. Final step: pane develops from `blur(1.2px)` to sharp (print-develop), opacity/filter only.
- Pane chrome labels: left `feed.json`, right `front page`. A connector between panes carries the labels "one structured feed" -> "rendered front page".
- Badge on the output pane corner: `static HTML · rendered in {N} ms`. N is measured in prerender with `performance.now()` around the actual `renderFrontPage(buildFrontPage(...))` call, baked as token `__DRUCK_RENDER_MS__` (one decimal below 10 ms).
- Proof line under the CTA row: "Already rendering the sonto.tech front page from live data — band 04." with an in-page anchor to the front-page band.
- Hero subline reordered feed-first: front pages and cards named before article pages; the provenance sentence (thousands of production articles) stays.

## Facts strip (inside band 01, below hero)

Full-width hairline-bound strip, magazine "by the numbers" register: numerals large (clamp ~28-44px), labels small mono caps. Four facts, equal billing, each an anchor to its proof:

| Fact | Source | Anchor |
|---|---|---|
| `{WIDGET_KB} kB` gzipped widget | gzipSync of the real bundle at build (existing token) | colophon snippet |
| `0 · 0 · 0` cookies, trackers, consent banners | demonstrated live in band 06 | analytics band |
| `100 × 4` Lighthouse perf/a11y/best-practices/SEO | `audit/summary.json`; en-dashes if unmeasured (same honesty rule as rings) | colophon rings |
| `MIT` open source | repo license | GitHub URL |

## 02 SURFACES — One story, many surfaces (new band)

- Headline: "One story, many *surfaces*". Left: compact single-item JSON (existing tokenizer; top-level keys already carry `data-key`). Right: a fanned stack of "printed sheets" — real engine renders of the same `feature.json` item, produced at build, feed surfaces first:
  1. front-page hero card
  2. grid card (`renderCard`)
  3. In brief row
  4. full article page miniature (scaled)
  5. embed snippet (code)
  6. analytics event JSON (a real `ReadingEvent` shape)
- Link by light, not lines: hover/focus on a sheet lights the matching JSON keys (`data-key` spans get a `.lit` class). No SVG connector geometry (fragile across breakpoints).
- Sheets reveal with a 50ms IO stagger. Mobile: JSON collapses to key lines, sheets stack vertically.

## 03 IN THE WILD — three frames, feed-led

- Top row, two frames:
  - TUNING FORK: its **front page** inline — `druck-feed layout="front-page"` on a trimmed fixture (`frame-tuning-feed.json`, ~5 items) under the 62vh cap + fade. The Pitchfork-like feed is visible without clicking.
  - ATELIER: single article render, unchanged (the article surface, "articles too").
- Full-width below: **LEDGERLINE conversion pipeline**, the Telegram showcase, on the landing itself:
  - left: rail of 4-5 real channel posts (from `tg-posts.json`) styled as TG bubbles;
  - center: compact mapped ArticleData JSON (~7 lines, tokenizer) for one of the posts;
  - right: `druck-feed layout="grid"` (2 columns) on a matching trimmed fixture — **1:1 bubble-to-card mapping**, the same 4-5 stories as cards.
  - Hover/focus on a bubble highlights its card (shared `data-index` pairing). On IO entry the scene plays: bubbles appear sequentially, then JSON, then cards. Mobile: steps stack vertically.
  - Caption: "They post in Telegram. Your bot maps it. Druck renders it." + link to the full demo. Cards link to the demo site articles (articles are the second beat).
- deploy.log frame is removed. `/demos/dev-blog/` page stays live, linked from the lede next to the newsroom.
- Lede: "Three publications that do not exist. One renderer that does." + the demo-links sentence.
- With this band the landing shows all three widget modes: `grid` (LEDGERLINE), `front-page` (TUNING FORK, sonto band), `article` (ATELIER). The hero pane shows the same front-page output rendered by the engine at build time, not through the widget.

### feed.css: container queries (prerequisite)

`feed.css` layout breakpoints migrate from viewport media queries to container queries (`druck-feed-host` gets `container-type: inline-size`) so front pages adapt to their container — a ~550px frame gets the compact layout on a desktop viewport. Verify no regression on the sonto band and demo pages (container ≈ viewport there). This is a `druck-css` package change; the landing consumes the local copy immediately, npm patch release is a separate later decision.

## 04 FRONT PAGE — live proof

- H2: "The front page is just another *render*."
- Card hover polish in `feed.css` (shared with embedders): image scale 1.025, title translateY(-2px), border brightens; applies to `.druck-card` and `.df-hero-card`, both themes, transform/opacity only.

## 05 RANGE — printing console

- Recipe rail beside the stage, mono register: current `Format / Language / Accent` values, `Output: static HTML`, and a counter `specimen N of 120` (real index over the 3x5x8 grid, computed by the switcher island).
- Re-typeset transition replaces the instant toggle: outgoing panel 200ms (opacity -> 0.4, y -6) then hidden; incoming 420ms (opacity 0 -> 1, y 12 -> 0, scale 0.985 -> 1), easing `cubic-bezier(0.16, 1, 0.3, 1)`. The stage reserves height per breakpoint so nothing jumps. Reduced motion: instant toggle (current behavior).
- Switcher island gains an `onChange`-driven transition + rail update; keyboard behavior and `aria-live="polite"` on the stage unchanged.

## 06 ANALYTICS — "Static pages. Live reading *memory*." (new band)

- Three cards driven by one `ReadingTracker` instance (the colophon-line island moves here and extends):
  1. Depth — live percent + thin progress bar
  2. Active time — ticking m:ss
  3. Sections read — N/7 with dots, via the tracker's stock `onChapterRead`
- Honesty mechanics for card 3: each band's heading block (chapter marker + h2 + lede) is wrapped as `.chapter-panel` with the h2 also carrying `.chapter-title`, so the tracker counts sections with its production API after a real 3s dwell.
- **Required package fix**: `ReadingTracker` passes `root: articleRoot` to IntersectionObserver; a non-scrollable root makes every target intersect immediately, so chapters would count without scrolling. Default root changes to the viewport (`null`), overridable via config; regression test added. `@druck-editorial/analytics` is in-repo only (unpublished), so no npm coordination.
- Cards are not `aria-live` (ticking values must not spam screen readers); each value has a static label.
- Integration infographic — "Where the reading signal can go", three real paths, rendered at build (HTML/CSS, both themes), each with a one-line snippet:
  1. Default: nowhere. No endpoint configured; the numbers die with the tab.
  2. Your stack: callbacks forward into GA4 / GTM / Plausible already on the host page — `new ReadingTracker(el, slug, { onDepth: d => gtag('event', 'read_depth', { value: d }) })`.
  3. Your endpoint: `{ endpoint: '/ingest', sendOn: 'pagehide' }` — sessions POST via `sendBeacon`.
- Privacy block ("What the analytics see", including the GA4/GTM paragraph) moves here from the colophon.
- Pricing & roadmap micro-block (owner confirms wording at spec review): "Everything on this page is free and MIT: engine, css, widget, analytics. Self-hosted, no tiers, no locked features. Planned: an optional hosted endpoint with a reading dashboard (paid — the MIT tracker keeps working without it), and publishing `@druck-editorial/analytics` to npm."

## 07 COLOPHON — slimmed

Keeps: Lighthouse rings, claim, embed snippet + copy button, method line, signature, links row. Loses: privacy block and the live analytics line (moved to band 06).

## Chapter system

- Above each band title: red dot + `NN / NAME` (mono, caps, muted) plus an oversized faint numeral (clamp ~64-110px) beside the title — the cinematic editorial signature. The numeral shows at >= 1024px and hides below; the small marker line shows everywhere.
- Names: 01 ENGINE, 02 SURFACES, 03 IN THE WILD, 04 FRONT PAGE, 05 RANGE, 06 ANALYTICS, 07 COLOPHON. The facts strip belongs to 01 and is unnumbered.
- Heading blocks double as the tracker's `.chapter-panel` targets (band 06 mechanics).

## Motion language

- Band-entry reveal: heading block + key content rise from opacity 0 / y +14px over ~550ms, 60ms stagger, once, IO threshold 0.2.
- Hero print-develop blur; console re-typeset; LEDGERLINE scene sequence; copy buttons flip to "Copied" with a 1.2s printer-flash sweep.
- Everything gated by `prefers-reduced-motion`; the existing reduced-motion block extends to all new items.

## Micro-polish

- Copy buttons: "Copied" state + flash sweep.
- Contrast sweep over secondary text on both surfaces (keep >= 7:1 where already achieved; fix faint stragglers).
- Logo unchanged (PNG). No violet anywhere. Headlines keep exactly one italic serif accent word.

## Repo-wide: license headers

- Every source file in the repo starts with the two-line SPDX header:
  ```
  // SPDX-License-Identifier: MIT
  // Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
  ```
  CSS uses one `/* ... */` line; HTML uses one `<!-- ... -->` line before the doctype. Name and email match LICENSE and package.json.
- Scope: `.ts`, `.mjs`, `.css`, `.html` under `packages/`, `apps/`, `scripts/`, including tests and configs. Excluded: `.json` (no comment syntax), `.md` (LICENSE and README carry attribution), binary assets, `dist/`.
- Published artifacts carry it too: `druck-engine` dist inherits headers through tsc (comments preserved), `druck-css` ships source files, the widget bundle gets an esbuild `banner` (a `/*! ... */` legal comment survives minification; ~70 bytes on the wire).
- Enforcement: `scripts/check-license-headers.mjs` verifies headers on all tracked in-scope files and runs in the standard gate chain; a one-shot adder script backfills existing files.
- `CLAUDE.md`'s "No source-file comments" rule gains the explicit exception: the SPDX header is required attribution, not commentary.

## Gates

- Unit: tracker root fix regression test; switcher recipe/counter logic; render-bands tests updated (hero front-page pane, RENDER_MS token, facts tokens, surfaces sheets, LEDGERLINE pipeline markup).
- License headers: `check-license-headers.mjs` passes over the full repo.
- E2E: facts strip values present and anchored; surfaces band renders 6 sheets and key-highlight works; TUNING FORK feed renders; LEDGERLINE bubble count equals card count and hover pairing works; console recipe + `N of 120` counter correct, reduced-motion instant; analytics cards move after scripted scroll (depth > 0, time ticks, sections increment); in-page anchors resolve; no `__DRUCK_` residue.
- Visual: regenerate all baselines (light + dark, desktop + mobile, all bands).
- Lighthouse 100x4 maintained; transfer <= 250 KB (lazy feed images, trimmed frame fixtures); height <= 10,000px; check-links derives pages from dist (unchanged).

## Out of scope

- npm publishes (the `druck-css` container-query + hover patch can ship later; analytics stays in-repo).
- Demo page content changes beyond the lede links (dev-blog page survives).
- Any importer or adapter — druck stays a renderer; the Telegram mapping is shown as customer-side code.
- sonto-side changes.
