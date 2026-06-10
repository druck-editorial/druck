# Monetization Boundary

Druck is open-source editorial software with a hosted SaaS layer. This document defines what is free, what is paid, and why.

## Philosophy

Open source drives adoption and trust. The hosted layer drives revenue. The boundary is architectural: code that renders in the browser is MIT; code that runs on our servers is proprietary.

## Open source (MIT)

| Package | What it does | Why free |
|---|---|---|
| `@druck-editorial/engine` | JSON schema → editorial HTML renderer | Adoption. Every CMS and static site generator benefits from a battle-tested editorial renderer. |
| `@druck-editorial/css` | Editorial stylesheet with per-language typography | Trust and remixing. Designers fork themes; provenance spreads the name. |
| `@druck-editorial/widget` | Embeddable `<druck-article>` and `<druck-feed>` web components | Distribution. The more sites embed Druck, the larger the audience for the hosted layer. |
| `@druck-editorial/analytics` | Client-side reading tracker | Auditability. A tracking script must be inspectable. The script only collects; it does not store or visualize. |

## Hosted / proprietary (paid)

| Service | What it does | Pricing model |
|---|---|---|
| Druck Dashboard | Aggregates analytics events, visualizes funnels, cohorts, A/B headline results | Freemium by event volume |
| Druck Feed API | Converts RSS/API/CSV into hosted `ArticleData[]` with edge caching | Per-1K impressions or flat per site |
| Telegram Channel Importer | Bot that turns channel posts into wire articles with auto-summary | Per-channel monthly or per-article |
| Enterprise Setup | Custom renderer, self-hosted dashboard license, CMS integration, SLA | Project-based $5–15K |

## How the boundary works

### Analytics token gate

`@druck-editorial/analytics` sends `x-druck-site` header with every event batch. The hosted endpoint validates:

1. Token exists and matches a registered site.
2. `Origin` header matches the registered domain(s) for that token.
3. Rate limits are not exceeded.

Invalid or missing tokens receive `401`. Self-hosters can point `endpoint` at their own server and omit `siteToken` entirely.

### Why this is fair

- The client SDK is auditable and forkable.
- The value is in aggregation, visualization, and infrastructure — not in the tracker itself.
- A lone blogger can self-host a simple endpoint and get raw data. A newsroom pays for dashboards, cohort analysis, and SLA.

## Trademark

The name **Druck**, the Druck wordmark, and associated marks are trademarks of the project author. You may use them to refer to the project accurately. You may not use them to identify a competing product or service. The code is MIT; the brand is not.

## License summary

| Layer | License |
|---|---|
| Client packages (`engine`, `css`, `widget`, `analytics`) | MIT |
| Dashboard backend, Feed API, Telegram importer | Proprietary / not published |
| Landing page, documentation, specs | MIT |
