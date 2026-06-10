# Druck Landing Recut + Real Publication — Design Spec

2026-06-10. Supersedes the band structure of `2026-06-09-druck-landing-transformation-design.md`; everything not changed here (fonts, islands architecture, prerender plugin, audit gate, copyright) carries over.

## Goal

The page is a calling card aimed at one viewer: a hiring CTO/engineer who scans for 90 seconds. Success: "I want to talk to this person." Conversion surface: a quiet author signature, not a hire-me banner. Every promise on the page must be real — both CTAs currently 404.

## Decisions (brainstorm outcomes)

| Question | Decision |
|---|---|
| Primary audience | Hiring CTO/engineer (others benefit incidentally) |
| Conversion | Quiet signature in colophon: name, provenance line, contacts |
| Dead links (GitHub 404, npm 404) | Publish for real as part of this iteration |
| Page structure | Approach A "trailer": cut to 5 bands, full article leaves the page |
| Feed band | Front-page mode widget rendering live sonto.tech with snapshot fallback |

## Current state (measured 2026-06-10, viewport 1512px)

- Page: 21,719px ≈ 24 screens. Band heights: hero 913, formats 6,141, langs 925, article 6,350, feed 1,284, wild 5,060, colophon 792.
- The SLM demo article renders in full twice (formats + article bands = 58% of the page); its title appears 4 times.
- "In the wild" — the strongest material — starts at 72% scroll depth.
- `$14,250/month` stat breaks mid-number inside its 592px container.
- Colophon Lighthouse rings show "—" (unmeasured). GitHub link → 404. `pnpm add @druck-editorial/engine` → npm 404. No author contact anywhere.

## New structure — 5 bands, ~9,500px target

### Band 1 — Hero (unchanged)

"Paste JSON. Get a magazine." + JSON→rendered side-by-side stays as is. Only change: both CTAs point at things that exist (see Publication).

### Band 2 — In the wild (promoted, trimmed)

Moves to position 2. PHONOGRAPH / ATELIER / deploy.log / LEDGERLINE frames and captions unchanged. Frame viewports get a max-height (~60vh) with inner scroll: band shrinks 5,060px → ~2,200px. The Telegram strip on LEDGERLINE stays.

### Band 3 — Front page (new flagship)

`<druck-feed layout="front-page" src="https://sonto.tech/data/druck-feed.json" fallback-src="/sample-data/sonto-snapshot.json">` renders an editorial front page from the live sonto.tech feed. Caption: "This is sonto.tech, live, rendered by one widget. Druck was extracted from its pipeline — now it renders its parent." Cards link to real sonto articles (`rel="noopener"`).

### Band 4 — Range (three old bands merged)

One compact specimen panel (~1.5 screens) with three switcher rows: format (feature / quick_take / wire) × language (EN/DE/FR/ES/JA) × accent (8 categories). Lede math: "One JSON, 120 magazines." Specimen content: title + lede + one stat + pull quote — short excerpt, not a full article. The `$14,250/month` stat lives here, with the wrap fixed. Link out: "Read a full issue →" to the prerendered demo article page at `/articles/quiet-revolution-small-language-models/` (full feature format, built from existing fixtures by the existing prerender path) — the inspectable artifact.

### Band 5 — Colophon

- Lighthouse rings with real measured values (audit gate wired into the build).
- Zero-JS claim + view-source + copy snippet (unchanged).
- One live analytics line replacing the old dashboard band: "@druck-editorial/analytics watched you read this page: NN% depth, NNs active. Nothing left this page." The analytics island re-targets the landing page itself.
- Quiet signature block: **Artem Iagovdik** — "Extracted from Sonto, where this engine rendered thousands of production articles in five languages." Links: email (artyom.yagovdik@gmail.com), GitHub profile, LinkedIn. LinkedIn URL supplied by owner before merge; if absent at merge time, ship email + GitHub only.
- MIT, `pnpm add @druck-editorial/engine`.

### Cut entirely

band-formats (6,141px), band-article (6,350px), the standalone analytics dashboard, the flat feed band. The format captions' copy (three registers) migrates into Band 4's switcher captions.

## Front-page widget design

- **API**: existing `<druck-feed>` gains `layout` attribute (`grid` default — current behavior and tests untouched; `front-page` new) and `fallback-src`. Both URLs gated through `safeUrl()`.
- **Engine**: `buildFrontPage(items: ArticleData[]): FrontPageRow[]` — pure, deterministic, fixed recipe: hero row (1 item, prefers `hot`) → feature row (wide + small) → triple (3) → in-brief list (4–5 headline-only). ~11 items consumed; extra items ignored. `renderFrontPage(rows, opts): string` emits HTML. Both live in `@druck-editorial/engine` so the build-time prerender and the runtime widget share one code path.
- **CSS**: `feed.css` gains `.df-row--hero`, `.df-row--feature`, `.df-row--triple`, `.df-row--brief`; collapses to single column below 800px (mirrors sonto's break).
- **Data contract**: the widget consumes `ArticleData[]` only. No client-side field mapping.
- **Fallback chain**: fetch `src` with ~4s timeout → on failure fetch `fallback-src` → on failure keep prerendered HTML. First render and no-JS render come from the build-time snapshot prerendered through the same `renderFrontPage()`; the island swaps in live data after fetch — same recipe, no layout shift.
- **Snapshot**: `sonto-snapshot.json` refreshed at druck build time from the live endpoint when reachable; the committed copy is the offline fallback. Stamped with its fetch date.
- **HOT badge**: `hot: true` items get a small badge in front-page card variants only. Optional polish, not a gate.

## Sonto-side changes (sonto-news repo, small)

- Pipeline emits `data/druck-feed.json` after the augment step: top 12 items mapped to ArticleData with absolute URLs. Mapping: `ai_title || title → title`, `ai_summary → subtitle`, `ai_category` lowercased/kebab-cased → `category` (unmapped values → omit, widget uses default accent), `date → publishedAt`, `image || placeholder_image → heroImage` (absolutized to `https://sonto.tech`), `article_url → shareUrl` (absolutized), `is_hot → hot`.
- nginx: `Access-Control-Allow-Origin` header on that path (druck origin or `*`), same 5m TTL as the rest of `/data/`.

## Publication

- **GitHub**: org `druck-editorial` (verified available 2026-06-10). Repo goes public after an opensource sanitizer pass (secrets/PII/internal-reference scan). README per package + root README. LICENSE and THIRD_PARTY_LICENSES.md already exist.
- **npm**: publish `@druck-editorial/engine`, `@druck-editorial/css`, `@druck-editorial/widget` at 0.1.0. `@druck` scope availability could not be verified anonymously (npmjs bot-wall); verify at publish time. If taken: pick fallback scope, update every printed install command and the widget's default CSS URL — the landing prints whatever actually exists, enforced by a single source-of-truth constant used by all bands.
- **Sequencing**: merge `feat/landing-transformation` → main first; the unfinished T9–T12 from the 06-09 plan (E2E/a11y, visual regression, Lighthouse audit, final sweep) fold into this iteration's quality gates.

## Also fixed in this iteration

- Stat value wrap: prevent mid-number breaks in `.article-stat` (no `break-all`-style wrapping; size steps down instead).
- Language specimen card half-empty right side: specimen layout fills the card.
- Lighthouse rings populated from a real `scripts/audit.mjs` run as part of release.
- Wild frame viewports capped with inner scroll.

## Quality gates

- `pnpm build` + full test suite green; new unit tests for `buildFrontPage`/`renderFrontPage` (recipe determinism, sparse input: 0/1/3 items degrade gracefully); E2E for the fallback chain (live fetch blocked → snapshot renders).
- Lighthouse 100×4 on the recut page; WCAG 2.2 AA checks pass.
- No-JS render shows the complete page including the snapshot front page.
- Link check in the audit script: GitHub, npm package pages, sonto links, the demo article page — all resolve.
- Page height budget: ≤ 10,000px at 1512px wide.

## Out of scope

- Telegram importer product (parked; own spec).
- Localized landing chrome; per-language article pages on the landing.
- Approach C ("the landing is itself a druck magazine") beyond the colophon's editorial tone.
- New hero art or copy changes beyond what this spec lists.

## Killer features (messaging spine, for reference)

1. Taste as an engine function — editorial judgment baked into the renderer, one line of HTML (Band 1).
2. Real multilingual typesetting — DE hyphenation, FR quote spacing, ES RAE rules, JA kinsoku/palt (Band 4).
3. A whole publication from structured data, proven live on the parent product (Bands 2–3).

Zero-JS, Lighthouse 100×4, and local-first analytics are craft proof and live in the colophon, not the pitch.
