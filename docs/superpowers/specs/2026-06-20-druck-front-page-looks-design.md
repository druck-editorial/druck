# Druck Front-Page Looks — design

Date: 2026-06-20
Status: approved design, pre-implementation
Repo: druck (`@druck-editorial`)

## Summary

Give druck's front-page renderer a library of signature looks so one feed renders as
many different publications, each pushed to the craft ceiling and shipping zero client
JavaScript inside druck's performance budget.

Two tiers:

- **Engine looks (supported, documented, on npm):** `classic` (the current renderer,
  unchanged) plus eight core editorial looks — Swiss, Helvetica, Broadsheet, Brutalist,
  Luxury, Noir, Bento, Almanac. Any embedder uses these as `look="brutalist"`.
- **Landing showcase looks (spectacle, not engine API):** roughly twelve more — Tabloid,
  Letterpress, Neubrutalism, Bauhaus, Risograph, Memphis, Ransom-note zine, Terminal/CRT,
  Bloomberg data, Aqua, Aero, Vaporwave. Real and rendered, but they live only in the
  landing's immersive showcase, not in the supported engine surface.

The headline claim: award-tier editorial design, zero bytes of script. The brutalist
reference mockup validated 2026-06-20 sets the quality bar for every look.

## Goal

- Lift the front page from one fixed composition (hero/feature/triple/brief) to a library
  of distinct, intentional editorial designs.
- Keep the engine's defining constraints: render by construction, zero client JS in
  output, self-hosted assets, no CDN, within budget.
- Make look selection a first-class option on the engine and the widget for the eight
  core looks.
- Ship a landing showcase — "one feed, twenty ways" — as a click-to-launch immersive
  scroll experience. The calling-card artifact.

## Non-goals (this pass)

- The article page (`renderArticle`). Separate surface, separate pass.
- Any JavaScript motion layer in rendered output. All motion is CSS-only. The landing may
  use its existing island JS for the launch and close of the showcase, but the rendered
  looks and the scroll-morph motion are CSS.
- Auto-pick-by-content (a model choosing the look from the feed). Selection stays explicit
  plus an optional date-seeded rotation.
- Promoting the twelve showcase looks into the supported engine API. They stay landing-only
  until there is a reason to graduate one.

## Architecture

### The seam that makes this cheap

`buildFrontPage(items)` already separates editorial ranking from rendering. It returns a
semantic row model (hero/feature/triple/brief). `renderFrontPage(rows, opts)` turns rows
into HTML. Looks plug into the render half. The ranking is computed once and stays correct
across every look. We re-dress the magazine, we do not rebuild it.

### Enriched semantic model

Enrich the row model so composers do not re-derive editorial facts:

- each item carries `role: 'lead' | 'feature' | 'brief'`
- `hasImage: boolean` (a usable hero is present)
- `hot: boolean` (already present)

`buildFrontPage` stays the single ranker. `BRIEF_MAX` and the hot-to-lead promotion stay
as they are.

### Composer registry (engine looks)

```ts
export type FrontPageLook =
  'classic' | 'swiss' | 'helvetica' | 'broadsheet' | 'brutalist'
  | 'luxury' | 'noir' | 'bento' | 'almanac';

type Composer = (rows: FrontPageRow[], opts?: RenderOptions) => string;

const COMPOSERS: Record<FrontPageLook, Composer> = { /* ... */ };

// renderFrontPage(rows, opts) -> COMPOSERS[opts.look ?? 'classic'](rows, opts)
```

- `classic` is the current renderer, unchanged. Existing callers see no difference.
- Style-led looks (Swiss, Helvetica, Luxury, Noir) share a base composer plus a theme
  stylesheet.
- Structure-led looks (Brutalist, Broadsheet, Bento, Almanac) get their own composer
  because their layout is structural, not paintable.

### Look scoping

The wrapper element becomes `druck-front-page druck-front-page--{look}`, mirroring the
existing category and theme scoping. Every look's CSS lives behind that class so looks
never collide.

### Selection (engine looks)

- Engine: `RenderOptions.look?: FrontPageLook`, default `classic`.
- Widget: `<druck-feed look="brutalist">`. The attribute reflects to the option.
  `look="auto"` picks a look from a date seed, a deterministic daily redress with no
  client state.
- Rendered front pages carry no script.

### Showcase looks (landing only)

The twelve spectacle looks are landing-local compositions in the druck-app prerender
layer, not engine composers. They consume the same feed but render through landing
templates. They are explicitly experimental, undocumented as engine API, and exist to
power the immersive showcase. Keeping them out of the engine keeps the supported surface
small and honest while the landing still shows twenty.

## The looks

Reference bar: the brutalist mockup approved 2026-06-20. The five-look switcher and the
scroll-morph demo (2026-06-20) prototype the rest.

### Engine looks (8 + classic)

1. **Swiss / International** — strict 12-column grid, flush-left, one red accent, generous
   whitespace, grotesque heavy weight with tiny uppercase labels. `text-wrap: balance`,
   hairline rules.
2. **Helvetica** — pure black-on-white, type only, no color, no rules. Minimalist
   confidence. Tight tracking, one display weight.
3. **Classic Broadsheet** — serif masthead, real CSS multi-column lead, drop-cap, dateline,
   hairline column rules, Didone at display optical size. `columns`, `::first-letter`,
   small-caps.
4. **Brutalist** — oversized condensed display that bleeds off the edge, monospace meta,
   one acid accent, duotone hero. Built and validated. Scale contrast, `mix-blend-mode`
   duotone, overflow bleed, `box-decoration-break` highlight.
5. **Luxury Editorial** — full-bleed hero with scrim, oversized thin italic Didone,
   tracked-out kickers, large margins. Optical-size axis, scroll-driven hero parallax.
6. **Noir** — dark luxury. Black and gold, thin italic serif, cinematic restraint.
7. **Kinetic Bento** — asymmetric `grid-template-areas` tiles, one large numeral tile,
   image tiles. Bento grid, staggered scroll-driven reveals via `animation-timeline: view()`,
   gated by `@supports` and `prefers-reduced-motion`.
8. **Almanac** — antique serif, ornamental rules, dense two-column body, small-caps.
   Old-paper authority.

### Landing showcase looks (~12, spectacle)

Tabloid, Letterpress broadside, Neubrutalism, Bauhaus / constructivist, Risograph,
Memphis, Ransom-note zine, Terminal / CRT (scanlines), Bloomberg data terminal, Aqua
(Mac OS X glass), Aero (Windows glass), Vaporwave / Y2K. Each is a CSS treatment of the
same feed. The glass, halftone, duotone, scanline, and perspective-grid effects are all
zero-JS modern CSS.

## Showcase — "one feed, twenty ways"

Interaction: **click-to-launch immersive** (chosen 2026-06-20).

- The landing carries a compact teaser band (band 04) with a prominent CTA, "See all 20".
- The click triggers a prominent transition into a fullscreen scroll-morph experience: an
  intro panel ("scroll to transform"), then each look as a full-viewport section that rises
  into place as it enters (`scroll-snap` plus `animation-timeline: view()`), capped by an
  outro ("20 looks, 0 KB JavaScript"). An exit control returns to the landing.
- The eight engine looks render through the widget/engine. The twelve showcase looks render
  through landing-local compositions. The scroll-morph motion is CSS. The launch and close
  may use the landing's existing island JS. A zero-JS fallback (anchor / `:target` overlay)
  is possible if we want the experience itself fully scriptless.

This is the share-and-screenshot artifact and the strongest calling-card surface.

## Typography

Engine looks draw on three self-hosted variable woff2, subset:

- a grotesque (Swiss, Helvetica, Bento, Brutalist headline)
- a high-contrast Didone-ish serif (Luxury, Noir, Broadsheet, Almanac)
- a monospace (Brutalist meta, kickers, colophons)

Every engine voice comes from weight, optical-size, and italic axes. No per-look font files.
This holds the budget and keeps the engine looks visually related.

Showcase looks may use a small number of extra display faces where a look demands it (a
condensed wood-type face for Tabloid, the system UI faces for Aqua/Aero). Because they are
landing-only, their font weight is scoped to the launched showcase, not the engine package
or the base landing transfer.

The existing per-language typography rules (DE hyphenation, FR thin-nbsp quotes, JA CJK
stack) keep applying inside every engine look. Looks set display type. They do not override
body language rules.

## Shared primitives

A small zero-JS toolkit every composer reuses:

- type tokens (the three fonts, a fluid clamp scale, optical-size bindings)
- an SVG / gradient grain layer (the sonto pattern)
- a scroll-reveal utility (`animation-timeline: view()`, behind `@supports` and
  reduced-motion)
- the hero scrim readability rule
- a `view-transition` cross-fade for look switching

## Performance and constraints

- Zero JS in rendered output. The showcase's launch/close may use the landing's existing
  island JS. The morph motion is CSS.
- All motion via CSS scroll-timeline, gated by `@supports` and `prefers-reduced-motion`
  with static fallbacks.
- CSS packaging: keep one `feed.css` with look-scoped blocks for the engine looks. Showcase
  CSS lives in the landing app, loaded with the launched experience, not on first paint.
- `audit.mjs` gains a per-look transfer measurement. Lighthouse 100x4 stays a gate for the
  base landing. The launched showcase is measured separately.

## Testing

- `visual.spec` baselines extended to the eight engine looks across the existing viewport
  and theme matrix, plus a representative set of showcase looks. This multiplies the
  snapshot count. Budget for it as druck's existing discipline.
- unit tests: enriched `buildFrontPage` roles, composer dispatch by look, look-scoping
  class output, `auto` date-seed determinism.
- `audit.mjs` per-look transfer plus Lighthouse on the base landing.

## Build order

1. Ranker enrichment, composer registry, look plumbing on engine and widget. `classic`
   output unchanged. Tests green.
2. Shared primitives: type tokens, grain, scroll-reveal, view-transition switch.
3. Engine looks, hardest first to hold the bar: Bento, then Brutalist (port the validated
   mockup), then Swiss, Helvetica, Luxury, Noir, Broadsheet, Almanac. Each lands with
   baselines.
4. Landing showcase: the click-to-launch immersive scroll-morph, wiring the eight engine
   looks plus the twelve landing-local spectacle compositions.
5. `auto` date-seed rotation, docs, README, npm version bumps (engine, css, widget together
   per the existing publish discipline).

## Risks

- Scope. Twenty looks is large. Mitigate by tiering: the eight engine looks are the
  shippable commitment, the twelve showcase looks are landing-local and can land
  incrementally without blocking an engine release.
- Budget creep from the engine looks' CSS and three variable fonts. Mitigate with shared
  primitives, subset fonts, and per-look transfer measurement.
- `scroll-timeline` and `view-transition` browser support. Mitigate with progressive
  enhancement. The static layout is the baseline. Motion is additive.
- Maintenance. Mitigate with one ranker, shared primitives, and baseline coverage.
- Per-language typography interacting with display looks. Mitigate by scoping looks to
  display type only and keeping language rules on the body.

## Open questions

- The three concrete variable font families. Resolve in phase 2.
- The exact final membership of the eight engine looks versus the twelve showcase looks
  (Almanac and Tabloid sit near the boundary).
- The default look for new embedders. `classic` is assumed for back-compat. Confirm whether
  the docs should steer new users toward a more striking default.
- Whether the launched showcase should be fully zero-JS (`:target` overlay) or may use the
  landing's island JS for launch and close.
