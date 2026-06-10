# @druck/css

Editorial stylesheet for druck. Covers article, weekly recap, feed grid, and per-language typography for EN, DE, FR, ES, and JA.

## Install

```bash
pnpm add @druck/css
```

## Usage

### Barrel import (all partials in cascade order)

Link the barrel in HTML:

```html
<link rel="stylesheet" href="/node_modules/@druck/css/article.css">
```

Or import in a CSS bundler:

```css
@import "@druck/css/article.css";
```

`article.css` imports the partials in the correct cascade order: tokens, hero, body, components, wire, weekly, language, theme. Do not reorder them.

### Individual partials

```css
@import "@druck/css/tokens.css";
@import "@druck/css/hero.css";
@import "@druck/css/body.css";
```

### Feed widget

`feed.css` is standalone and intended for use with `<druck-feed>`. It does not depend on the article barrel.

```html
<link rel="stylesheet" href="/node_modules/@druck/css/feed.css">
```

## Per-language typography

Apply a `lang` attribute to the article shell and the stylesheet activates the correct hyphenation, quote glyphs, and line-height for that language.

```html
<div class="article-shell" lang="de">...</div>
```

Supported: `en`, `de`, `fr`, `es`, `ja`.
