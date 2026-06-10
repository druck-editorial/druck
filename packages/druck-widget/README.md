# @druck-editorial/widget

Custom elements that render druck articles and front pages anywhere. Registers `<druck-article>` and `<druck-feed>` as web components.

## Install

```bash
pnpm add @druck-editorial/widget
```

Or load from a self-hosted bundle:

```html
<script type="module" src="/assets/druck-widget.js"></script>
```

Or from a CDN, version-pinned with subresource integrity:

```html
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@druck-editorial/widget@0.1.0/dist/druck-widget.js"
  integrity="sha384-XJ0XvPb20yRQfswItj7AkAygMHH8HSAF/OpkbJ/K+xHj0YznMbKrQw+bJEiEDYC8"
  crossorigin="anonymous"></script>
```

unpkg works too: `https://unpkg.com/@druck-editorial/widget@0.1.0/dist/druck-widget.js` with the same integrity hash.

## druck-article

Fetches `ArticleData` JSON from `src` and renders a full article.

```html
<druck-article
  src="/data/story.json"
  lang="en"
  theme="light"
  accent="#b84a34"
  css-url="/assets/article.css"
></druck-article>
```

| Attribute | Description |
|---|---|
| `src` | URL of an `ArticleData` JSON file. Required. |
| `css-url` | URL of the stylesheet to load inside the shadow root. Defaults to the unpkg CDN path for `@druck-editorial/css`; a jsDelivr URL (`https://cdn.jsdelivr.net/npm/@druck-editorial/css/article.css`) works the same way. Set this to a self-hosted URL in production. |
| `lang` | Sets the `lang` attribute on the article container. |
| `theme` | `'light'` or `'dark'`. Sets `data-theme` on the container. |
| `accent` | CSS color value applied to `--accent`. |

Fires `druck:rendered` on success (`detail.slug`) and `druck:error` on failure (`detail.error`).

## druck-feed

Fetches an array of `ArticleData` JSON from `src` and renders a card grid or front-page layout.

```html
<druck-feed
  layout="front-page"
  src="/data/feed.json"
  fallback-src="/data/feed-cache.json"
  lang="en"
  theme="light"
  css-url="/assets/feed.css"
></druck-feed>
```

| Attribute | Description |
|---|---|
| `src` | URL of a JSON array of `ArticleData`. Required. |
| `layout` | `'grid'` (default) or `'front-page'`. Front-page uses `buildFrontPage` row layout. |
| `fallback-src` | Secondary URL fetched when `src` fails. |
| `columns` | Number of columns in grid layout. Default `3`. |
| `css-url` | Stylesheet URL for the shadow root. |
| `lang` | Sets `lang` on the feed container. |
| `theme` | `'light'` or `'dark'`. |
| `accent` | CSS color value applied to `--accent`. |

Fires `druck:feed-rendered` on success (`detail.count`) and `druck:feed-error` on failure (`detail.error`, `detail.recovered`).

### Light-DOM prerender fallback

If the fetch fails and the element has existing child HTML, `druck-feed` exposes that content via a `<slot>` instead of showing an error. This lets you prerender static HTML server-side and have the component upgrade it when data is available.

## Notes

This package has `"sideEffects": true` because importing it registers the custom elements as a side effect.
