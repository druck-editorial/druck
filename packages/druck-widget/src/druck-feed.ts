// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import type { ArticleData, RenderOptions } from '@druck-editorial/engine';
import { buildFrontPage, renderCard, renderFrontPage, safeUrl, escapeHtml } from '@druck-editorial/engine';

const CSS_URL_ATTR = 'css-url';
const DEFAULT_FEED_CSS_URL = 'https://unpkg.com/@druck-editorial/css/feed.css';
const FETCH_TIMEOUT_MS = 4000;

class DruckFeedElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['src', 'lang', 'theme', 'accent', CSS_URL_ATTR, 'columns', 'layout', 'fallback-src'];
  }

  #shadow: ShadowRoot;
  #feedContainer: HTMLDivElement;
  #cssLink: HTMLLinkElement;
  #cssReady: Promise<void>;
  #renderGeneration = 0;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
    this.#feedContainer = document.createElement('div');
    this.#feedContainer.className = 'druck-feed';
    this.#feedContainer.innerHTML = '<slot></slot>';
    this.#cssLink = document.createElement('link');
    this.#cssLink.rel = 'stylesheet';
    this.#cssLink.href = this.#getCssUrl();
    this.#cssReady = new Promise((resolve) => {
      this.#cssLink.addEventListener('load', () => resolve(), { once: true });
      this.#cssLink.addEventListener('error', () => resolve(), { once: true });
    });
    this.#shadow.appendChild(this.#cssLink);
    this.#shadow.appendChild(this.#feedContainer);
  }

  connectedCallback(): void {
    const src = this.getAttribute('src');
    if (src) void this.#loadAndRender(src);
  }

  attributeChangedCallback(name: string, _old: string, _new: string): void {
    if (name === 'src' && _new && this.isConnected) {
      void this.#loadAndRender(_new);
    } else if (name === CSS_URL_ATTR) {
      this.#cssLink.href = this.#getCssUrl();
    } else if (name === 'lang' || name === 'theme' || name === 'accent') {
      this.#applyContainerAttrs();
    } else if (name === 'columns') {
      this.#feedContainer.setAttribute('data-columns', _new || '3');
    }
  }

  #getCssUrl(): string {
    const attr = this.getAttribute(CSS_URL_ATTR);
    return (attr ? safeUrl(attr) : '') || DEFAULT_FEED_CSS_URL;
  }

  #applyContainerAttrs(): void {
    const lang = this.getAttribute('lang');
    const theme = this.getAttribute('theme');
    const accent = this.getAttribute('accent');
    if (lang) this.#feedContainer.setAttribute('lang', lang);
    if (theme) this.#feedContainer.setAttribute('data-theme', theme);
    if (accent) this.#feedContainer.style.setProperty('--accent', accent);
  }

  async #fetchItems(src: string): Promise<ArticleData[]> {
    const safeSrc = safeUrl(src);
    if (!safeSrc) throw new Error('Invalid source URL');
    const fetchOpts: RequestInit =
      typeof AbortSignal.timeout === 'function'
        ? { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
        : {};
    const res = await fetch(safeSrc, fetchOpts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items: ArticleData[] = await res.json();
    if (!Array.isArray(items)) throw new Error('Expected JSON array');
    return items;
  }

  async #loadAndRender(src: string): Promise<void> {
    const gen = ++this.#renderGeneration;
    try {
      const items = await this.#fetchItems(src);
      if (gen !== this.#renderGeneration) return;
      await this.#render(items, gen);
    } catch (primaryError) {
      const fallback = this.getAttribute('fallback-src');
      if (fallback) {
        try {
          const items = await this.#fetchItems(fallback);
          if (gen !== this.#renderGeneration) return;
          await this.#render(items, gen);
          return;
        } catch {}
      }
      if (gen !== this.#renderGeneration) return;
      this.#renderFailure((primaryError as Error).message);
    }
  }

  async #render(items: ArticleData[], gen: number): Promise<void> {
    await this.#cssReady;
    if (gen !== this.#renderGeneration) return;
    this.#applyContainerAttrs();
    const opts: RenderOptions = {
      lang: this.getAttribute('lang') ?? undefined,
      theme: (this.getAttribute('theme') as RenderOptions['theme']) ?? undefined,
      accentColor: this.getAttribute('accent') ?? undefined,
    };
    const layout = this.getAttribute('layout');
    if (layout === 'front-page') {
      this.#feedContainer.className = 'druck-feed-host';
      this.#feedContainer.removeAttribute('role');
      this.#feedContainer.innerHTML = renderFrontPage(buildFrontPage(items), opts);
    } else {
      this.#feedContainer.className = 'druck-feed';
      this.#feedContainer.setAttribute('role', 'list');
      if (layout === 'list') {
        this.#feedContainer.setAttribute('data-layout', 'list');
        this.#feedContainer.removeAttribute('data-columns');
      } else {
        this.#feedContainer.removeAttribute('data-layout');
        this.#feedContainer.setAttribute('data-columns', this.getAttribute('columns') || '3');
      }
      this.#feedContainer.innerHTML = items
        .map((data) => `<div role="listitem">${renderCard(data, opts)}</div>`)
        .join('');
    }
    this.dispatchEvent(new CustomEvent('druck:feed-rendered', { bubbles: true, detail: { count: items.length } }));
  }

  #renderFailure(message: string): void {
    const hasPrerendered = this.innerHTML.trim().length > 0;
    if (hasPrerendered) {
      this.#feedContainer.innerHTML = '<slot></slot>';
    } else {
      this.#feedContainer.innerHTML =
        `<div style="padding:24px;color:#999;font-family:system-ui">Failed to load feed: ${escapeHtml(message)}</div>`;
    }
    this.dispatchEvent(new CustomEvent('druck:feed-error', {
      bubbles: true,
      detail: { error: escapeHtml(message), recovered: hasPrerendered },
    }));
  }
}

if (!customElements.get('druck-feed')) {
  customElements.define('druck-feed', DruckFeedElement);
}

export { DruckFeedElement };
