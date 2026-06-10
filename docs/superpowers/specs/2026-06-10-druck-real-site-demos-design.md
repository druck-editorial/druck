# Druck Real-Site Demo Pages — Design Spec

2026-06-10. Extends the five-band landing (spec `2026-06-10-druck-landing-recut-design.md`).

## Goal

Show how druck output looks inside real-world sites. Five full-page demo scenarios, each a hand-built pastiche of a recognizable site archetype with a druck article or front page inside. The wild band on the landing becomes a click-through teaser for them.

## Decisions

| Question | Decision |
|---|---|
| Fidelity | Recognizable pastiche: hand-built skeletons of known archetypes (Pitchfork-like, Vogue-like, personal dev blog, corporate newsroom, Telegram brief). No copied code, no real logos, no real names. |
| Placement | Full pages at `/demos/<slug>/`, wild-band frames link to them. |
| Data boundary | druck stays a renderer. Customers convert their own data to ArticleData JSON (bot, script, CMS export). The Telegram demo states this explicitly and shows a mapping example. |
| Rendering | Pages are prerendered by the engine at build time. No client JS on demo pages. |

## Pages

Five static pages emitted at build into `dist/demos/<slug>/index.html`:

| Slug | Pastiche | Brand (invented) | Druck content |
|---|---|---|---|
| `music-review` | Pitchfork-like music review site: near-black header, all-caps sans logotype, large numeric score in the article header (score is page chrome, not engine schema) | PHONOGRAPH | `renderArticle`, quick_take (`frame-music.json`) |
| `fashion-magazine` | Vogue-like: Didone display type, centered masthead, generous whitespace | ATELIER | `renderArticle`, feature-style (`frame-fashion.json`) |
| `dev-blog` | Personal dev blog / Substack-like: narrow column, system-ui, subscribe box | deploy.log | `renderArticle`, wire (`wire.json`) |
| `newsroom` | Corporate SaaS press room: blue header, breadcrumbs, press-contact sidebar | NORTHWIND | `renderArticle` (`frame-markets.json` or a new newsroom fixture) |
| `telegram-brief` | Markets daily published from a Telegram channel | LEDGERLINE | `renderFrontPage(buildFrontPage(...))` from a new feed fixture |

Common page anatomy:
- Pastiche chrome: header, nav, footer of the fake site. Each page owns one stylesheet at `public/demos/<slug>.css` (~150 lines, self-hosted fonts already in `public/fonts/`).
- The druck content links `/article.css` (or `/feed.css`) exactly as an embedder would.
- A thin attribution strip fixed at the very top of the page: "A druck demo — this publication does not exist. &larr; druck" linking back to `/`. The pastiche header sits below it.
- Footer shows the one-line embed snippet (script tag + element) that would produce the same result at runtime.
- `<meta name="robots" content="noindex">` on demo pages (they are demos, not content).

## Build

Extend the existing vite `closeBundle` hook: a `renderDemoPages(fixturesDir)` module in `apps/druck-app/prerender/` exports one render function per page (shared helpers for the attribution strip and embed-snippet footer), writes the five HTML files. Broken fixtures fail the build, same as today. The existing demo article page emitter moves into the same module.

## Wild band changes (landing)

- Frame mastheads/typography updated to match the upgraded pastiches. The four frames stay PHONOGRAPH / ATELIER / deploy.log / LEDGERLINE; NORTHWIND exists only as a page, linked inline from the band lede ("...and a corporate newsroom &rarr;").
- Each `frame-caption` becomes a link: "Open the full site &rarr;" pointing at the matching `/demos/<slug>/`.
- Band lede gains a sentence that the frames click through to full pages.

## Telegram-brief page (the "channel in, magazine out" showcase)

- Desktop: left rail ~340px styled as a TG channel (8 static posts as bubbles with timestamps, channel header `t.me/ledgerline`), right side: the prerendered front page.
- Below: "How the posts became JSON" strip — three steps: a post bubble, a ~10-line JavaScript mapping example (customer-side bot code mapping a post to ArticleData fields), the resulting JSON fragment.
- Explicit copy: "druck does not import Telegram. Your bot does. druck renders what you give it."
- Mobile: the rail collapses to a horizontal scroll strip above the front page.

## Fixtures (new)

- `public/sample-data/demo-feed-markets.json` — 10 ArticleData items (markets/crypto register, invented but realistic numbers).
- `public/sample-data/tg-posts.json` — 8 channel posts `{ time, text }` that plausibly correspond to the feed items.

Existing `frame-*.json` fixtures are reused for the article pages. A `newsroom` fixture is added only if `frame-markets.json` reads wrong in a press-release context (implementer judgment; prefer reuse).

## Gates

- `scripts/check-links.mjs`: derive checked pages from `dist/demos/*/index.html` plus `dist/index.html` and the demo article page (replaces the hardcoded two-page list; closes the prior review's LOW finding).
- E2E: one new spec — each demo page responds 200 via preview, contains the rendered article/front-page content, the attribution strip links back to `/`, no `__DRUCK_` residue.
- Visual: 5 pages × desktop + mobile (10 snapshots), light only (pages carry fixed palettes, no theme toggle).
- Lighthouse gate stays landing-only. Demo pages are covered by link check + E2E.
- The page-height budget applies to the landing only; the wild band must not grow taller than its current capped height.

## Out of scope

- Real Telegram API or any importer.
- Theme toggles or localization on demo pages.
- Adding rating/score fields to the engine schema (the music score is page chrome).
- New npm releases (no package code changes expected; if widget/css change, that is a separate release decision).
