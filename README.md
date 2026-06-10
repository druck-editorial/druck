# 🪶 Druck

Structured article JSON in { }, magazine pages out </>.

Druck renders articles the way a print magazine sets them: three formats (feature, quick take, wire), real typesetting rules for English, German, French, Spanish, and Japanese, and a front-page layout for feeds. The rendered output is plain HTML and needs no JavaScript on the client. It was extracted from [Sonto](https://sonto.tech), where it has rendered thousands of production articles.

## Quick start: one script tag, no build step

```html
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@druck-editorial/widget@0.1.0/dist/druck-widget.js"
  integrity="sha384-XJ0XvPb20yRQfswItj7AkAygMHH8HSAF/OpkbJ/K+xHj0YznMbKrQw+bJEiEDYC8"
  crossorigin="anonymous"></script>
<druck-article src="story.json"></druck-article>
```

The widget fetches your JSON, renders it in shadow DOM, and host styles cannot break it. `<druck-feed layout="front-page" src="feed.json">` does the same for a whole front page.

## The engine, via npm

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

## Web components, pinned and verified

For production, pin the version and add the integrity hash:

```html
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@druck-editorial/widget@0.1.0/dist/druck-widget.js"
  integrity="sha384-XJ0XvPb20yRQfswItj7AkAygMHH8HSAF/OpkbJ/K+xHj0YznMbKrQw+bJEiEDYC8"
  crossorigin="anonymous"></script>

<druck-article src="story.json"></druck-article>

<druck-feed layout="front-page" src="feed.json"></druck-feed>
```

The same file is on unpkg at `https://unpkg.com/@druck-editorial/widget@0.1.0/dist/druck-widget.js`. For production, self-host the bundle. When a new widget version is published, recompute the integrity hash: `curl -s <cdn-url> | openssl dgst -sha384 -binary | openssl base64 -A`.

Articles without a `heroImage` render an automatic category-tinted placeholder on cards, so partial feeds still produce a complete front page.

## Packages

| Package | What it is |
|---|---|
| `@druck-editorial/engine` | The renderer. JSON to HTML: articles, cards, front pages. |
| `@druck-editorial/css` | The stylesheet. Tokens, article chrome, weekly recaps, feeds, per-language typography. |
| `@druck-editorial/widget` | `<druck-article>` and `<druck-feed>` custom elements. |
| `@druck-editorial/analytics` | Reading depth and active time. Data stays on the page unless you set an endpoint. |

## Free and paid

Everything in this repository is MIT and self-hostable: the engine, the stylesheet, the widgets, and the reading tracker. There are no locked features and no tiers in the code you install.

The paid layer is hosted infrastructure, planned and in progress (see [docs/MONETIZATION.md](docs/MONETIZATION.md) for the full boundary):

- **Druck Dashboard** — aggregation and visualization for reading analytics. Freemium by event volume.
- **Druck Feed API** — RSS/API/CSV converted into hosted `ArticleData[]` with edge caching.
- **Telegram Channel Importer** — a bot that turns channel posts into wire articles.
- **Enterprise setup** — custom renderers, self-hosted dashboard license, SLA.

The MIT tracker keeps working without any of it. If you run your own endpoint, you never need a token.

### Analytics site tokens

The hosted endpoint identifies sites by token. Pass it as `siteToken`; the tracker sends it as the `x-druck-site` header with every event batch:

```js
import { ReadingTracker } from '@druck-editorial/analytics';

new ReadingTracker(root, slug, {
  endpoint: 'https://ingest.example.com/events',
  siteToken: 'tok_yoursite',
});
```

Requests with a missing or unregistered token get `401`. Self-hosters point `endpoint` at their own server and omit `siteToken` entirely — the header is simply not sent.

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## License

MIT. Copyright 2026 Artem Iagovdik. Client packages are MIT; the hosted dashboard, feed API, and importer are proprietary. The Druck name and wordmark are trademarks of the project author.
