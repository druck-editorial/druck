# Druck Landing — The Transformation

Date: 2026-06-09
Status: approved, amended same day after review (embed showcase band, scroll surfaces, type themes, font sourcing)
Scope: redesign of the druck-app landing page (apps/druck-app) into a live feature-demonstration page. Engine, CSS, widget, and analytics packages change only where this page needs small additive extensions.

## Context

The current landing has a hero, four static showcase cards, an inert category-chip strip, one rendered article, and a reading-analytics panel. The cards describe features instead of demonstrating them. The page is fully client-rendered, references fonts that are never loaded, hot-links hero images from Unsplash, and shipped with a broken `feature.json` that left the only demo on an infinite spinner.

The redesign makes the page demonstrate the product instead of describing it, and makes the page itself the proof of two claims: Lighthouse 100 across all four categories, and magazine-grade accessibility.

## Positioning

Druck occupies the gap between three clusters:

- Structured-content renderers (Portable Text, Tiptap static renderer, Editor.js) — engines that output unstyled markup. No editorial opinion.
- Editorial stylesheets (Tufte CSS, gwern-style sidenotes) — taste without an engine. No schema, no formats, no multilingual rules.
- Storytelling SaaS (Shorthand, Vev, Ceros) — both, but closed, hosted, enterprise-priced.

Druck ships the editorial taste as code: schema + renderer + typography + analytics, MIT, extracted from a pipeline that already rendered thousands of production articles. The landing page must communicate this in one screen and prove it in five.

## Goals

1. The hero demonstrates the core transformation: structured JSON becoming a magazine page, live.
2. Every feature claim on the page is interactive proof, not copy.
3. The page scores 100 in all four Lighthouse categories, measured against the production build, and the score is displayed with method and date.
4. WCAG 2.2 AA in both themes, including reduced-motion and keyboard paths.
5. The existing visual direction is preserved: cream paper surface, clay accent, editorial serif display, dot grain, both themes.

## Non-goals

- No localized UI chrome (page chrome stays English).
- No CMS adapters, hosted service, or pricing content.
- No scroll-scrubbed animation. The hero sequence is stepped autoplay; the surface shift is a class transition, not a scrub.
- No runtime CDN dependencies of any kind. Bunny Fonts and Fontshare are download sources only; every byte serves from our origin.
- Repo publication and the GitHub org are out of scope; CTA hrefs stay pointed at github.com/druck-editorial/druck.

## Page architecture

One scrolling page, six bands inside `main`, each band a `section` with `aria-labelledby`:

1. Nav (persistent): wordmark, theme toggle. The Feature/Wire tabs leave the nav; format switching moves to band 2 where it has context. Reading-progress rail stays.
2. Band 1 — Hero: the transformation.
3. Band 2 — One story, three formats.
4. Band 3 — Five languages, real rules.
5. Band 4 — Full rendered article + live category accents + reading analytics.
6. Band 5 — In the wild: live widget embeds in three contrasting publications.
7. Band 6 — Colophon.
8. Footer (one line, unchanged in spirit).

Mobile is first-class: every band defines its under-768 layout (hero panes stack with a six-line JSON excerpt, format control goes full-width, specimens and frames stack single-column with reduced fixed heights, colophon rings form a two-by-two grid). Lighthouse is measured on the mobile profile. Touch targets stay at or above 44px and nothing scrolls horizontally at 320px.

Surface system: each band declares `data-surface="paper"` or `data-surface="ink"`. Bands 1–4 are paper (they follow the global theme). Band 5 and band 6 are ink — dark editorial surfaces in both themes, by art direction. An IntersectionObserver eases the page background and text tokens between surfaces as a dark band approaches (a 400ms class transition on the root, background and color only). Under `prefers-reduced-motion` the switch is instant. The global theme toggle keeps working: paper bands follow it, ink bands stay ink. Contrast is audited per surface.

Removed: the four static showcase cards, the inert category-chip strip (chips move into band 4 and become controls), the View Demo scroll button, the mobile bottom tab bar (band 2's format control replaces its purpose on all viewports).

## Band 1 — Hero: the transformation

Layout: heading block above a split pane. Desktop split is 5/7: left pane shows the actual `feature.json` fixture in a code surface (syntax-tinted, ~18 visible lines), right pane shows the magazine page assembling. Below 768px the panes stack and the JSON pane collapses to a 6-line excerpt.

Heading block: kicker tag (Editorial Rendering, unchanged), the existing headline "Structure in, magazine out", body line, and one new provenance sentence stating the engine was extracted from a production pipeline that rendered thousands of articles. One primary CTA: a copyable `pnpm add @druck-editorial/engine` command; one ghost CTA: GitHub.

Sequence: plays once when the band enters the viewport (IntersectionObserver), total ~3.5s, five steps. Each step highlights a line group in the JSON pane with a brief accent tint while the corresponding rendered element appears on the right:

1. `category` line → kicker fades in.
2. `title` + `accentWord` lines → display headline with italic accent word.
3. `deck` line → deck paragraph.
4. `heroImage` line → image reveals using the existing print-reveal treatment.
5. `chapters[0]` lines → first chapter text pours in.

Rules: transform and opacity only; every slot pre-sized so layout never shifts (CLS 0); one Replay ghost button after the sequence finishes; sequence never blocks interaction.

Reduced motion: no animation. Both panes render in their complete final state; the persistent key tinting in the JSON pane carries the correspondence between source lines and rendered elements. The story is still told.

Failure behavior: the hero's final state is prerendered (see Technical), so it never depends on a runtime fetch. If the fixture fetch backing the animation fails, the sequence is skipped and the static final state simply stands — no error surface needed here.

## Band 2 — One story, three formats

A segmented control [Feature | Quick Take | Wire] above a preview region. The same story re-renders per format with a 200ms opacity crossfade. The preview shows enough to feel the editorial judgment: Feature shows kicker, display headline, deck, and chapter structure; Quick Take shows the compact single-chapter layout; Wire shows the utilitarian dateline and lede.

One caption line per format states the judgment in plain words (for example: Wire — two paragraphs, no chrome, costs nothing to produce).

Semantics: the control is a `radiogroup` with arrow-key navigation and visible focus rings; the preview region carries `aria-live="polite"`. Preview min-height is fixed per breakpoint so switching never shifts layout.

Failure behavior: all three format panels are prerendered at build time, so band 2 performs no runtime fetch. A broken fixture fails the build inside the prerender step with the file named — earlier and louder than any runtime error card. The only runtime fixture fetches on the page are the band-5 widgets, which carry the widget's built-in error state.

New fixture required: `quick_take.json` (same story as `feature.json`, quick_take format).

## Band 3 — Five languages, real rules

Not full translated articles: one compact specimen per language — headline, one body paragraph, one pull-quote — each chosen so the locale rule is visible:

- EN: hanging punctuation, balanced headline wrap.
- DE: a long compound hyphenating under `hyphens: auto` with tuned `hyphenate-limit-chars`.
- FR: guillemets with the no-break thin-space convention, manual headline hyphenation.
- ES: RAE quote glyphs, 1.78 body line-height.
- JA: system CJK stack, kinsoku line-breaking, bold color shift instead of italics.

Each specimen carries a small annotation naming the actual CSS rule at work (for example `hyphenate-limit-chars: 10 5 5`). Switcher: five chips [EN DE FR ES JA], instant content swap, fixed min-height. All page switchers (formats, languages, accents) share one radiogroup pattern with arrow-key navigation and 44px touch targets.

New fixtures required: `specimen.{en,de,es,fr,ja}.json`. Content drafted during implementation; DE sanity-checked by the owner. The JA specimen uses the system CJK stack — no CJK font is self-hosted (same decision as the source system, for page-weight reasons; this is acceptable because the specimen demonstrates layout rules, not a shipped font).

## Band 4 — Full article, live accents, analytics

The full rendered Feature article remains as the depth proof, prerendered at build time (see Technical).

Category accent chips relocate here, above the article, and become controls: selecting a category re-accents the article live (the engine already parameterizes accent by category). Chips are buttons with `aria-pressed` and visible focus states.

The analytics panel keeps its four metrics and gains the honest frame: a title naming what is happening (the package is tracking the visitor's own reading of the article above, right now) and one line stating that nothing leaves the page. Depth milestones (25/50/75/100) are announced through a throttled `aria-live="polite"` region; continuous values update visually without announcements.

## Band 5 — In the wild

Three miniature publications, each a believable mock site frame with its own masthead, chrome, type theme, accent, and story topic — and inside each one, the real `@druck-editorial/widget` (`<druck-article>`, Shadow DOM) rendering live. The frames' host styles deliberately clash; the article interior stays pristine. That is the embed pitch demonstrated, not described.

| Frame | Direction | Masthead (fictional) | Type theme | Accent | Story |
|---|---|---|---|---|---|
| A | Music press (Pitchfork register) | PHONOGRAPH | Archivo Black mastheads, General Sans body | hot red | Album review (quick_take) with an inline score stat |
| B | Fashion magazine | ATELIER | Bodoni Moda didone display, airy tracking | near-black | Trend essay (quick_take) |
| C | Tech blog | deploy.log | Space Grotesk display, IBM Plex Mono meta | teal | The existing wire story (model launch) |
| D | Crypto-markets daily, published from a Telegram channel | LEDGERLINE | Core families, IBM Plex Mono numbers | market green | Morning brief (wire) with stat asides; a strip of channel-post bubbles above the frame shows the source — channel in, magazine out |

Frame D carries the Telegram story: the author posts in their channel, readers get a magazine. The strip-to-frame composition makes the source visible. The full channel importer (mapping channel posts to ArticleData as a self-serve flow) is a separate follow-up product — see Deferred.

Each frame is a fixed-height browser-style window with its own internal scroll, so the page never shifts as widgets render and visitors can actually read inside the frames. Type themes are CSS custom-property overrides on the embed host (`--type-headline-font` and friends pierce the shadow boundary by inheritance); theme fonts and the widget module lazy-load when the band approaches, keeping the initial-load Lighthouse run clean. Widgets receive `css-url="/article.css"` so nothing touches unpkg. Each frame is labeled with the tokens that produced it — same engine, same schema, three different publications.

The widget's built-in error state covers fetch failures inside frames.

## Band 6 — Colophon

Styled as a fine-book colophon: hairline rule, small caps, quiet. Contents:

1. Four inline-SVG rings showing the measured Lighthouse scores (Performance, Accessibility, Best Practices, SEO), with measurement method and date printed beneath (tool version, static production build, throttling profile). Numbers are real measurements, refreshed when the page changes materially. If any category measures below 100 at release time, the real number ships and the gap becomes a tracked bug — the colophon never lies.
2. Weight receipt: the measured initial transfer size from the audit, and the line "0 KB JavaScript required for rendered output" (true of engine output; the landing's own island JS is acknowledged honestly alongside).
3. Embed snippet: one-line `<druck-article>` usage with a copy button.
4. Install command repeated, GitHub link, MIT license.
5. View-source invitation, which the prerendering makes true.

## Schema and fixture changes

- `ArticleData` gains optional `heroImageAlt`, `heroImageWidth`, `heroImageHeight`. The renderer emits `alt`, `width`, `height` on hero images when present. Backward compatible: absent fields render as today.
- All fixture images become self-hosted AVIF or WebP files under `public/`, sourced from the owner's Sonto-generated hero archive (owned art, on-brand provenance). No Unsplash hot-links remain.
- All fixtures gain `heroImageAlt` text.
- New fixtures: `slm-quick-take.json` and `slm-wire.json` (band 2 renders the same story in all three formats, so the feature story gets compact quick_take and wire versions), five `specimen.*.json`, and three band-5 frame stories (`frame-music.json`, `frame-fashion.json`, `frame-markets.json`). Frame C reuses the existing `wire.json`. Topics are deliberately diverse — music, fashion, tech, finance — so the embeds read as different publications, not one demo repeated.

## Technical architecture

Prerender: a Vite `transformIndexHtml` plugin imports `@druck-editorial/engine` and renders every band's article content from the fixtures into the page — identically in dev and build. LCP is served as static HTML and CSS. Interactivity ships as small vanilla TypeScript islands (sequence, switchers, surfaces, embeds, analytics, theme) that attach to the prerendered content without re-rendering it — the page must not flash or shift when JS arrives, and renders completely with JS disabled. Preact is removed; the islands replace the app shell.

Fonts: the CSS references three core families that were never loaded — Plus Jakarta Sans (headings), General Sans (body), Source Serif 4 (serif body and accents). All three are self-hosted as woff2, latin + latin-ext. Preload exactly two files (heading weight, serif body regular). `font-display: swap` with `size-adjust` fallback metrics so the swap causes no layout shift. Band 5 adds four theme families — Archivo Black, Bodoni Moda, Space Grotesk, IBM Plex Mono — declared in a separate stylesheet that lazy-loads when the band approaches, excluded from the initial-load budget. Bunny Fonts and Fontshare serve as download sources only (owner decision 2026-06-09); at runtime every font serves from our origin. No CDN requests.

Theme: the existing inline pre-mount theme script stays. JSON syntax tint, ring colors, and all new band surfaces define dark-theme variants; both themes are audited for contrast.

Budgets (verified by a repeatable check, runnable locally or in CI — see Testing): initial-load transfer below 250 KB excluding hero images; each hero image at or below 120 KB with explicit dimensions; initial landing JS at or below 80 KB gzipped. Band-5 lazy assets (widget module, theme fonts, frame fixtures, the shared article.css the widgets link) load on approach and are budgeted separately at or below 300 KB.

## Bug fixes folded into this work

1. `loadArticle` missing catch path (infinite spinner on any fetch/parse failure) → the class of bug is eliminated: all page content is prerendered at build time (broken fixtures fail the build), and the only runtime fetches are band-5 widgets with their built-in error state.
2. Mobile bottom tab bar visible on desktop viewports → removed entirely (superseded by band 2).
3. `favicon.ico` 404 → SVG favicon derived from the wordmark, plus fallback ico.
4. Unsplash hot-linked images → self-hosted (above).
5. Phantom font families (`General Sans`, `Source Serif 4` referenced but never loaded) → self-hosted (above).
6. Audit of the two `/assets/js/*.js` script tags inherited from the source extraction: keep only what the page uses, self-hosted, no 404s.

## Accessibility requirements

- Landmarks: `header`, `nav`, `main`, one `section[aria-labelledby]` per band, `footer`.
- Heading order: page h1 in the hero; bands use h2. The prerendered article keeps its internal h1 (valid HTML; verified non-flagging in axe and Lighthouse).
- Keyboard: all controls tabbable in visual order; radiogroup arrow keys; no traps; skip link to main content.
- Focus: visible focus rings in the editorial accent on every interactive element, both themes.
- Live regions: format/language preview changes and analytics milestones announce politely; continuous values stay silent.
- Motion: `prefers-reduced-motion` replaces the hero sequence with the static annotated state and disables print-reveal and grain animation.
- Contrast: 4.5:1 body text and 3:1 UI glyphs in both themes; muted meta text audited and corrected where it fails.
- Touch targets at or above 44px.
- Alt text on all images via the schema extension.

## Testing plan

1. Fixture validity: a vitest that JSON-parses every file in `sample-data/` (the test that would have caught the shipped parse error).
2. Prerender script test: renders fixtures and asserts expected markers exist in the output HTML.
3. Playwright visual: 320, 375, 768, 1024, 1440 — both themes — reduced-motion on and off for band 1 and the surface transition. Screenshot suite per band, including all three band-5 frames after their widgets render.
4. axe-core run with zero violations as the pass bar.
5. Lighthouse CI against the served production build: assert 100 in all four categories and assert the transfer budgets.
6. Keyboard walk-through checklist executed manually once per release of this page.

## Deferred

Before/after scrubber, scroll-driven hero variant, localized chrome, per-language full articles, repo publication, and the Telegram channel importer (channel posts mapped to ArticleData as a self-serve channel-to-magazine flow — strong product direction, needs its own spec).
