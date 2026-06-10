# Druck

Structured article JSON in, magazine-quality pages out.

Druck is an editorial rendering system extracted from [Sonto](https://sonto.tech), where it has rendered thousands of production articles in five languages. The renderer, stylesheet, web components, and reading tracker are each published as standalone packages under `@druck-editorial/*`.

## Quick start

```bash
pnpm add @druck-editorial/engine
```

```js
import { renderArticle } from '@druck-editorial/engine';

const html = renderArticle({
  title: 'The infrastructure gap',
  titleAccentWord: 'infrastructure',
  subtitle: 'Why deployment costs diverged from benchmark results in 2025.',
  metaDescription: 'A look at the growing gap between frontier model benchmarks and production deployment economics.',
  slug: 'infrastructure-gap-2025',
  format: 'feature',
  category: 'ai',
  publishedAt: '2025-11-14T09:00:00Z',
  heroImage: 'https://example.com/hero.webp',
  chapters: [
    {
      title: 'The economics',
      bodyHtml: '<p>Running GPT-4-class inference at scale costs between $12-30 per million tokens...</p>',
    },
  ],
});

document.getElementById('article').innerHTML = html;
```

## Web components

```html
<script type="module" src="https://unpkg.com/@druck-editorial/widget/dist/druck-widget.js"></script>

<druck-article src="story.json"></druck-article>

<druck-feed layout="front-page" src="feed.json"></druck-feed>
```

## Packages

| Package | Description |
|---|---|
| `@druck-editorial/engine` | Editorial rendering engine: structured article JSON in, magazine-quality pages out. |
| `@druck-editorial/css` | Editorial stylesheet: article, weekly, feed, and per-language typography. |
| `@druck-editorial/widget` | Custom elements that render druck articles and front pages anywhere: `druck-article`, `druck-feed`. |
| `@druck-editorial/analytics` | Local-first reading analytics: depth, active time, chapters. |

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## License

MIT. Copyright 2025 Artem Iagovdik.
