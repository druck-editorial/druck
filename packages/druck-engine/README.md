# @druck/engine

Editorial rendering engine. Takes structured `ArticleData` JSON and returns magazine-quality HTML strings.

## Install

```bash
pnpm add @druck/engine
```

## API

```ts
import { renderArticle, renderCard, buildFrontPage, renderFrontPage } from '@druck/engine';
import type { ArticleData, RenderOptions } from '@druck/engine';
```

### renderArticle

Renders a full article page shell with hero, chapters, key points, and related articles.

```ts
const html = renderArticle(
  {
    title: 'The infrastructure gap',
    subtitle: 'Why deployment costs diverged from benchmark results in 2025.',
    metaDescription: 'A look at the growing gap between frontier model benchmarks and production deployment.',
    slug: 'infrastructure-gap-2025',
    format: 'feature',
    category: 'ai',
    publishedAt: '2025-11-14T09:00:00Z',
    heroImage: 'https://example.com/hero.webp',
    chapters: [
      {
        title: 'The economics',
        bodyHtml: '<p>Running GPT-4-class inference at scale costs between $12-30 per million tokens.</p>',
      },
    ],
  },
  { lang: 'en', theme: 'light' }
);
```

`format` is `'feature' | 'quick_take' | 'wire'`. Feature articles use the full chapter + key-points layout. Wire uses a single `bodyHtml` block.

### renderCard

Renders a card tile for use in a feed grid.

```ts
const cardHtml = renderCard(articleData, options);
```

### buildFrontPage + renderFrontPage

`buildFrontPage` groups an array of `ArticleData` into layout rows (`hero`, `feature`, `triple`, `brief`). `renderFrontPage` turns those rows into HTML.

```ts
const rows = buildFrontPage(items);
const html = renderFrontPage(rows, { lang: 'de' });
```

## RenderOptions

| Field | Type | Description |
|---|---|---|
| `lang` | `string` | Sets `lang` attribute on the article shell. |
| `theme` | `'light' \| 'dark'` | Sets `data-theme` on the shell. |
| `accentColor` | `string` | CSS value applied to `--accent`. |
| `siteName` | `string` | Site name shown in byline and colophon. |
| `siteUrl` | `string` | Used for share and canonical links. |
| `canonicalUrl` | `string` | Override for the canonical URL. |
| `ogImageUrl` | `string` | Override for the OG image meta tag. |
