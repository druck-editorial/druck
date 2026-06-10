# 🪶 Druck

Structured article JSON in, magazine pages out.

Druck renders articles the way a print magazine sets them: three formats (feature, quick take, wire), real typesetting rules for English, German, French, Spanish, and Japanese, and a front-page layout for feeds. The rendered output is plain HTML and needs no JavaScript on the client. It was extracted from [Sonto](https://sonto.tech), where it has rendered thousands of production articles.

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
  metaDescription: 'The growing gap between frontier model benchmarks and production deployment economics.',
  slug: 'infrastructure-gap-2025',
  format: 'feature',
  category: 'ai',
  publishedAt: 'Nov 14, 2025',
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

Pair it with the stylesheet: `pnpm add @druck-editorial/css`, then link `article.css`.

## Web components

One line of HTML renders an article or a whole front page anywhere, in any CSS environment. The widget runs in shadow DOM, so host styles cannot break it.

```html
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@druck-editorial/widget@0.1.0/dist/druck-widget.js"
  integrity="sha384-XJ0XvPb20yRQfswItj7AkAygMHH8HSAF/OpkbJ/K+xHj0YznMbKrQw+bJEiEDYC8"
  crossorigin="anonymous"></script>

<druck-article src="story.json"></druck-article>

<druck-feed layout="front-page" src="feed.json"></druck-feed>
```

The same file is on unpkg at `https://unpkg.com/@druck-editorial/widget@0.1.0/dist/druck-widget.js`. For production, self-host the bundle.

## Packages

| Package | What it is |
|---|---|
| `@druck-editorial/engine` | The renderer. JSON to HTML: articles, cards, front pages. |
| `@druck-editorial/css` | The stylesheet. Tokens, article chrome, weekly recaps, feeds, per-language typography. |
| `@druck-editorial/widget` | `<druck-article>` and `<druck-feed>` custom elements. |
| `@druck-editorial/analytics` | Reading depth and active time. Data stays on the page unless you set an endpoint. |

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## License

MIT. Copyright 2026 Artem Iagovdik.
