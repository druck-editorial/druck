// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import type { ArticleData, RenderOptions } from '@druck-editorial/engine';
import { renderArticle, safeUrl, escapeHtml } from '@druck-editorial/engine';

const CSS_URL_ATTR = 'css-url';
const DEFAULT_CSS_URL = 'https://unpkg.com/@druck-editorial/css/article.css';

class DruckArticleElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['src', 'lang', 'theme', 'accent', CSS_URL_ATTR];
  }

  #shadow: ShadowRoot;
  #articleContainer: HTMLDivElement;
  #cssLink: HTMLLinkElement;
  #resizeObserver?: ResizeObserver;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
    this.#articleContainer = document.createElement('div');
    this.#articleContainer.className = 'druck-article-root';
    this.#cssLink = document.createElement('link');
    this.#cssLink.rel = 'stylesheet';
    this.#cssLink.href = this.#getCssUrl();
    this.#shadow.appendChild(this.#cssLink);
    this.#shadow.appendChild(this.#articleContainer);
  }

  connectedCallback(): void {
    const src = this.getAttribute('src');
    if (src) this.#loadAndRender(src);
  }

  attributeChangedCallback(name: string, _old: string, _new: string): void {
    if (name === 'src' && _new) {
      this.#loadAndRender(_new);
    } else if (name === CSS_URL_ATTR) {
      this.#cssLink.href = this.#getCssUrl();
    } else if (name === 'lang' || name === 'theme' || name === 'accent') {
      this.#applyContainerAttrs();
    }
  }

  disconnectedCallback(): void {
    this.#resizeObserver?.disconnect();
  }

  #getCssUrl(): string {
    const attr = this.getAttribute(CSS_URL_ATTR);
    return (attr ? safeUrl(attr) : '') || DEFAULT_CSS_URL;
  }

  #applyContainerAttrs(): void {
    const lang = this.getAttribute('lang');
    const theme = this.getAttribute('theme');
    const accent = this.getAttribute('accent');
    if (lang) this.#articleContainer.setAttribute('lang', lang);
    if (theme) this.#articleContainer.setAttribute('data-theme', theme);
    if (accent) this.#articleContainer.style.setProperty('--accent', accent);
  }

  async #loadAndRender(src: string): Promise<void> {
    try {
      const safeSrc = safeUrl(src);
      if (!safeSrc) throw new Error('Invalid source URL');
      const res = await fetch(safeSrc);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ArticleData = await res.json();
      this.#applyContainerAttrs();
      const opts: RenderOptions = {
        lang: this.getAttribute('lang') ?? undefined,
        theme: (this.getAttribute('theme') as RenderOptions['theme']) ?? undefined,
        accentColor: this.getAttribute('accent') ?? undefined,
      };
      this.#articleContainer.innerHTML = renderArticle(data, opts);
      this.dispatchEvent(new CustomEvent('druck:rendered', { bubbles: true, detail: { slug: data.slug } }));
    } catch (err) {
      const msg = escapeHtml((err as Error).message);
      this.#articleContainer.innerHTML =
        `<div style="padding:24px;color:#999;font-family:system-ui">Failed to load article: ${msg}</div>`;
      this.dispatchEvent(new CustomEvent('druck:error', { bubbles: true, detail: { error: msg } }));
    }
  }
}

if (!customElements.get('druck-article')) {
  customElements.define('druck-article', DruckArticleElement);
}

export { DruckArticleElement };
import './druck-feed.js';