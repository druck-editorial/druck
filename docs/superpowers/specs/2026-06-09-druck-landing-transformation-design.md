# Druck Landing — The Transformation

Date: 2026-06-09
Status: approved direction, pending spec review
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
- No hostile-CSS live embed demo (snippet only; live demo deferred).
- No scroll-scrubbed animation. The hero sequence is stepped autoplay.
- Repo publication and the GitHub org are out of scope; CTA hrefs stay pointed at github.com/druck-editorial/druck.

## Page architecture

One scrolling page, five bands inside `main`, each band a `section` with `aria-labelledby`:

1. Nav (persistent): wordmark, theme toggle. The Feature/Wire tabs leave the nav; format switching moves to band 2 where it has context. Reading-progress rail stays.
2. Band 1 — Hero: the transformation.
3. Band 2 — One story, three formats.
4. Band 3 — Five languages, real rules.
5. Band 4 — Full rendered article + live category accents + reading analytics.
6. Band 5 — Colophon.
7. Footer (one line, unchanged in spirit).

Removed: the four static showcase cards, the inert category-chip strip (chips move into band 4 and become controls), the View Demo scroll button, the mobile bottom tab bar (band 2's format control replaces its purpose on all viewports).

## Band 1 — Hero: the transformation

Layout: heading block above a split pane. Desktop split is 5/7: left pane shows the actual `feature.json` fixture in a code surface (syntax-tinted, ~18 visible lines), right pane shows the magazine page assembling. Below 768px the panes stack and the JSON pane collapses to a 6-line excerpt.

Heading block: kicker tag (Editorial Rendering, unchanged), the existing headline "Structure in, magazine out", body line, and one new provenance sentence stating the engine was extracted from a production pipeline that rendered thousands of articles. One primary CTA: a copyable `pnpm add @druck/engine` command; one ghost CTA: GitHub.

Sequence: plays once when the band enters the viewport (IntersectionObserver), total ~3.5s, five steps. Each step highlights a line group in the JSON pane with a brief accent tint while the corresponding rendered element appears on the right:

1. `category` line → kicker fades in.
2. `title` + `accentWord` lines → display headline with italic accent word.
3. `deck` line → deck paragraph.
4. `heroImage` line → image reveals using the existing print-reveal treatment.
5. `chapters[0]` lines → first chapter text pours in.

Rules: transform and opacity only; every slot pre-sized so layout never shifts (CLS 0); one Replay ghost button after the sequence finishes; sequence never blocks interaction.

Reduced motion: no animation. Both panes render in their complete final state with two or three static connector annotations (line marker on the left, matching marker on the right). The story is still told.

Failure behavior: the hero's final state is prerendered (see Technical), so it never depends on a runtime fetch. If the fixture fetch backing the animation fails, the sequence is skipped and the static final state simply stands — no error surface needed here.

## Band 2 — One story, three formats

A segmented control [Feature | Quick Take | Wire] above a preview region. The same story re-renders per format with a 200ms opacity crossfade. The preview shows enough to feel the editorial judgment: Feature shows kicker, display headline, deck, and chapter structure; Quick Take shows the compact single-chapter layout; Wire shows the utilitarian dateline and lede.

One caption line per format states the judgment in plain words (for example: Wire — two paragraphs, no chrome, costs nothing to produce).

Semantics: the control is a `radiogroup` with arrow-key navigation and visible focus rings; the preview region carries `aria-live="polite"`. Preview min-height is fixed per breakpoint so switching never shifts layout.

Failure behavior: format switching is the one place the page fetches and renders fixtures at runtime. Any fetch or parse failure renders a designed error card in the preview region naming the failure (file, and position for JSON parse errors) instead of a spinner. The loading path gains a catch branch; the transition flag always resolves.

New fixture required: `quick_take.json` (same story as `feature.json`, quick_take format).

## Band 3 — Five languages, real rules

Not full translated articles: one compact specimen per language — headline, one body paragraph, one pull-quote — each chosen so the locale rule is visible:

- EN: hanging punctuation, balanced headline wrap.
- DE: a long compound hyphenating under `hyphens: auto` with tuned `hyphenate-limit-chars`.
- FR: guillemets with the no-break thin-space convention, manual headline hyphenation.
- ES: RAE quote glyphs, 1.78 body line-height.
- JA: system CJK stack, kinsoku line-breaking, bold color shift instead of italics.

Each specimen carries a small annotation naming the actual CSS rule at work (for example `hyphenate-limit-chars: 10 5 5`). Switcher: five chips [EN DE FR ES JA], instant content swap, fixed min-height. Chips are buttons with `aria-pressed`, 44px touch targets.

New fixtures required: `specimen.{en,de,es,fr,ja}.json`. Content drafted during implementation; DE sanity-checked by the owner. The JA specimen uses the system CJK stack — no CJK font is self-hosted (same decision as the source system, for page-weight reasons; this is acceptable because the specimen demonstrates layout rules, not a shipped font).

## Band 4 — Full article, live accents, analytics

The full rendered Feature article remains as the depth proof, prerendered at build time (see Technical).

Category accent chips relocate here, above the article, and become controls: selecting a category re-accents the article live (the engine already parameterizes accent by category). Chips are buttons with `aria-pressed` and visible focus states.

The analytics panel keeps its four metrics and gains the honest frame: a title naming what is happening (the package is tracking the visitor's own reading of the article above, right now) and one line stating that nothing leaves the page. Depth milestones (25/50/75/100) are announced through a throttled `aria-live="polite"` region; continuous values update visually without announcements.

## Band 5 — Colophon

Styled as a fine-book colophon: hairline rule, small caps, quiet. Contents:

1. Four inline-SVG rings showing the measured Lighthouse scores (Performance, Accessibility, Best Practices, SEO), with measurement method and date printed beneath (tool version, static production build, throttling profile). Numbers are real measurements, refreshed when the page changes materially. If any category measures below 100 at release time, the real number ships and the gap becomes a tracked bug — the colophon never lies.
2. Weight receipt: CSS size, HTML size, and the line "0 KB JavaScript required for rendered output" (true of engine output; the landing's own interactive JS is listed honestly alongside).
3. Embed snippet: one-line `<druck-article>` usage with a copy button.
4. Install command repeated, GitHub link, MIT license.
5. View-source invitation, which the prerendering makes true.

## Schema and fixture changes

- `ArticleData` gains optional `heroImageAlt`, `heroImageWidth`, `heroImageHeight`. The renderer emits `alt`, `width`, `height` on hero images when present. Backward compatible: absent fields render as today.
- All fixture images become self-hosted AVIF or WebP files under `public/`, sourced from the owner's Sonto-generated hero archive (owned art, on-brand provenance). No Unsplash hot-links remain.
- All fixtures gain `heroImageAlt` text.
- New fixtures: `quick_take.json`, five `specimen.*.json`.

## Technical architecture

Prerender: a build step (node script run after `vite build`) imports `@druck/engine`, renders the band-4 article and the hero's final-state markup from the fixtures, and injects them into the built `index.html`. LCP is served as static HTML and CSS. The Preact app hydrates interactivity (sequence, toggles, accents, analytics, theme) on top of the prerendered content without re-rendering it from scratch on boot — the page must not flash or shift when JS arrives.

Fonts: self-host woff2 subsets of General Sans (Fontshare license) and Source Serif 4 (OFL), latin + latin-ext. Preload exactly two files (display weight, body regular). `font-display: swap` with `size-adjust` fallback metrics so the swap causes no layout shift. No CDN font requests.

Theme: the existing inline pre-mount theme script stays. JSON syntax tint, ring colors, and all new band surfaces define dark-theme variants; both themes are audited for contrast.

Budgets (verified by a repeatable check, runnable locally or in CI — see Testing): total transfer below 250 KB excluding hero images; each hero image at or below 120 KB with explicit dimensions; landing JS at or below 80 KB gzipped.

## Bug fixes folded into this work

1. `loadArticle` missing catch path (infinite spinner on any fetch/parse failure) → catch branch plus the band-2 error card state; prerendered regions never depend on runtime fetch.
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
3. Playwright visual: 320, 375, 768, 1024, 1440 — both themes — reduced-motion on and off for band 1. Screenshot suite per band.
4. axe-core run with zero violations as the pass bar.
5. Lighthouse CI against the served production build: assert 100 in all four categories and assert the transfer budgets.
6. Keyboard walk-through checklist executed manually once per release of this page.

## Deferred

Hostile-CSS live embed demo, before/after scrubber, scroll-driven hero variant, localized chrome, per-language full articles, repo publication.
