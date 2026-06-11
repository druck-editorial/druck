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

- No source-file comments. Naming carries meaning. (Exception: the SPDX license header is required attribution, not commentary.)
- No emojis in code or commits.
- No external CDN deps. Self-host everything.
- Edit existing files over creating new ones.
- Early returns over nested conditionals.
- Immutable data patterns.
## State (2026-06-10)

- Published: GitHub `druck-editorial/druck` (public), npm `@druck-editorial/engine@0.1.1`, `css@0.1.3`, `widget@0.1.2`, `analytics@0.1.1` (all four published; bump per-package on change). The `@druck` npm scope is taken by an unrelated user. npm publish uses a saved automation token in `~/.npmrc` (no OTP).
- Deployed live at `https://sonto.tech/druck/` (trailing-slash canonical). `pnpm deploy:druck` from apps/druck-app runs `build:druck` (build + `DRUCK_BASE=/druck/ node scripts/apply-base.mjs` rewrites root-absolute paths in HTML/CSS/JS/JSON) then rsyncs dist to the `sonto-news` container docroot. The rsync uses `--exclude=data/` so the CORS test endpoint at `/druck/data/` survives; the sonto-news `build.sh` has `--exclude='druck/'` so its own deploy doesn't wipe `/druck`. See [[druck-deploy-sonto-tech]].
- Landing: seven bands (hero+facts, surfaces, in-the-wild+LEDGERLINE, front page, range, analytics, colophon). The analytics band ends on the free/MIT line (the planned-paid tiers were removed — do not re-add vapor). Lighthouse 100x4 + transfer <= 250 KB enforced via `node scripts/audit.mjs`. Has full OG/Twitter/canonical/JSON-LD meta (og image `public/img/druck-og.png`).
- Demo imagery: each demo has its own thematic image set in `public/img/demo/` (music-*, dev-*, atelier-*, news-skyline, blackrock-crypto, ethereum) — feeds reference distinct files per card, no within-feed repeats. Music uses real Unsplash photos. New images: crop with `magick … -resize WxH^ -gravity center -extent WxH` then `cwebp -q 78`.
- CSS ships via `<link>` tags in index.html head (no FOUC); reveal-hiding rules are gated behind the `html.js` class added by main.ts. The LEDGERLINE band is a Telegram pastiche (photo posts mirror card images; the Fed card demos the automatic `card-thumb--placeholder` for missing heroImage). Dev server serves /demos/* and the demo article via vite middleware.
- Front-page band renders live sonto data: `<druck-feed layout="front-page">` fetches `https://sonto.tech/data/druck-feed.json` (CORS-enabled, refreshed by sonto's 2h cron, pre-mapped to ArticleData), falls back to `public/sample-data/sonto-snapshot.json` (refreshed at build by `prerender/fetch-snapshot.mjs`), and below that to the prerendered light DOM inside the element.
- `build` copies `packages/druck-css/feed.css` and `src/styles/fonts.css` into `public/` — edit the package sources, never the copies.
- Visual baselines cover 5 bands x 5 viewports x 2 themes; front-page snapshots route-abort sonto.tech for determinism. Regenerate with `pnpm exec playwright test visual.spec.ts --update-snapshots` from apps/druck-app.
