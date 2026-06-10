# Druck

The editorial rendering layer extracted from Sonto. Takes structured article data and turns it into magazine-quality web articles.

## Workspace

```
druck/
├── apps/
│   └── druck-app/         # Landing + demo, vanilla islands, vite prerender (@druck-editorial/app)
├── packages/
│   ├── druck-engine/     # Types + renderers: renderArticle, renderCard, buildFrontPage/renderFrontPage (@druck-editorial/engine)
│   ├── druck-css/        # Editorial stylesheet: article.css + feed.css (@druck-editorial/css)
│   ├── druck-widget/     # <druck-article> + <druck-feed> web components (@druck-editorial/widget)
│   └── druck-analytics/  # Reading metrics (@druck-editorial/analytics)
```

## Commands

- `pnpm dev` — start demo app
- `pnpm build` — build demo app for production
- `pnpm typecheck` — type-check all packages
- `pnpm test` — run all tests

## Rules

- No source-file comments. Naming carries meaning.
- No emojis in code or commits.
- No external CDN deps. Self-host everything.
- Edit existing files over creating new ones.
- Early returns over nested conditionals.
- Immutable data patterns.
## State (2026-06-10)

- Published: GitHub `druck-editorial/druck` (public), npm `@druck-editorial/{engine,css,widget}` at 0.1.0. The `@druck` npm scope is taken by an unrelated user.
- Landing: five bands (hero, in-the-wild, front page, range, colophon), ~7,300px, Lighthouse 100x4 enforced via `node scripts/audit.mjs` + `pnpm run check:links`.
- Front-page band renders live sonto data: `<druck-feed layout="front-page">` fetches `https://sonto.tech/data/druck-feed.json` (CORS-enabled, refreshed by sonto's 2h cron, pre-mapped to ArticleData), falls back to `public/sample-data/sonto-snapshot.json` (refreshed at build by `prerender/fetch-snapshot.mjs`), and below that to the prerendered light DOM inside the element.
- `build` copies `packages/druck-css/feed.css` and `src/styles/fonts.css` into `public/` — edit the package sources, never the copies.
- Visual baselines cover 5 bands x 5 viewports x 2 themes; front-page snapshots route-abort sonto.tech for determinism. Regenerate with `pnpm exec playwright test visual.spec.ts --update-snapshots` from apps/druck-app.
