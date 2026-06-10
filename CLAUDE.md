# Druck

The editorial rendering layer extracted from Sonto. Takes structured article data and turns it into magazine-quality web articles.

## Workspace

```
druck/
├── apps/
│   └── druck-app/         # Preact SPA demo (@druck-editorial/app)
├── packages/
│   ├── druck-engine/     # Types + renderer: renderArticle + renderCard (@druck-editorial/engine)
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