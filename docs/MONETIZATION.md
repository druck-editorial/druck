# Monetization Boundary

Druck is open-source editorial software with a hosted SaaS layer. This document defines what is free, what is paid, and why.

Status as of 2026-06-10: all four client packages exist and are MIT (`engine`, `css`, `widget` are on npm at 0.1.0; `analytics` is in-repo, npm publish planned). Every hosted service below is planned — none of it is built or sold yet. Lines marked TBD have no implementation.

## Philosophy

The line is simple. Code that runs in your browser is MIT and free forever. Code that runs on our servers is paid. Open source earns the trust and the audience. The hosted services earn the money.

## Open source (MIT)

| Package | What it does | Why free |
|---|---|---|
| `@druck-editorial/engine` | JSON schema → editorial HTML renderer | Adoption. Every CMS and static site generator benefits from a renderer proven in production. |
| `@druck-editorial/css` | Editorial stylesheet with per-language typography | Trust and remixing. Designers fork themes, and the credit line spreads the name. |
| `@druck-editorial/widget` | Embeddable `<druck-article>` and `<druck-feed>` web components | Distribution. The more sites embed Druck, the larger the audience for the hosted layer. |
| `@druck-editorial/analytics` | Client-side reading tracker | Auditability. A tracking script must be inspectable. The script only collects; it does not store or visualize. |

## Hosted / proprietary (paid) — all TBD, not yet built

| Service | What it does | Pricing model | Status |
|---|---|---|---|
| Druck Dashboard | Aggregates analytics events, visualizes funnels, cohorts, A/B headline results | Freemium by event volume | TBD |
| Druck Feed API | Converts RSS/API/CSV into hosted `ArticleData[]` with edge caching | Per-1K impressions or flat per site | TBD |
| Telegram Channel Importer | Bot that turns channel posts into wire articles with auto-summary | Per-channel monthly or per-article | TBD |
| Enterprise Setup | Custom renderer, self-hosted dashboard license, CMS integration, SLA | Project-based $5–15K | TBD |

## How the boundary works

### Analytics token gate

Client side — implemented and tested: `@druck-editorial/analytics` accepts a `siteToken` config value and sends it as the `x-druck-site` header with every event batch. Without a token, no header is sent.

Server side — TBD (no hosted endpoint exists yet). When it ships, it validates:

1. Token exists and matches a registered site.
2. `Origin` header matches the registered domain(s) for that token.
3. Rate limits are not exceeded.

Invalid or missing tokens receive `401`. Self-hosters can point `endpoint` at their own server and omit `siteToken` entirely.

### Why this is fair

- You can read and fork every line of the client code.
- The paid value is the servers: storage, aggregation, dashboards. The tracker itself stays free.
- A lone blogger can self-host a small endpoint and keep the raw data. A newsroom pays for dashboards, cohort analysis, and support.

## Trademark

The name **Druck**, the Druck wordmark, and associated marks are trademarks of the project author. You may use them to refer to the project accurately. You may not use them to identify a competing product or service. The code is MIT; the brand is not.

## License summary

| Layer | License |
|---|---|
| Client packages (`engine`, `css`, `widget`, `analytics`) | MIT |
| Dashboard backend, Feed API, Telegram importer | Proprietary / not published |
| Landing page, documentation, specs | MIT |
