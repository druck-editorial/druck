# @druck-editorial/css

Editorial stylesheet for druck. Covers article, weekly recap, feed grid, and per-language typography for EN, DE, FR, ES, and JA.

## Install

```bash
pnpm add @druck-editorial/css
```

## Usage

### Barrel import (all partials in cascade order)

Link the barrel in HTML:

```html
<link rel="stylesheet" href="/node_modules/@druck-editorial/css/article.css">
```

Or import in a CSS bundler:

```css
@import "@druck-editorial/css/article.css";
```

`article.css` imports the partials in the correct cascade order: tokens, hero, body, components, wire, weekly, language, theme. Do not reorder them.

### Individual partials

```css
@import "@druck-editorial/css/tokens.css";
@import "@druck-editorial/css/hero.css";
@import "@druck-editorial/css/body.css";
```

### Feed widget

`feed.css` is standalone and intended for use with `<druck-feed>`. It does not depend on the article barrel.

```html
<link rel="stylesheet" href="/node_modules/@druck-editorial/css/feed.css">
```

## Per-language typography

Apply a `lang` attribute to the article shell and the stylesheet activates the correct hyphenation, quote glyphs, and line-height for that language.

```html
<div class="article-shell" lang="de">...</div>
```

Supported: `en`, `de`, `fr`, `es`, `ja`.
