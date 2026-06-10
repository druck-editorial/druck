import type { ArticleData, RenderOptions } from '@druck/engine';
import { buildFrontPage, renderCard, renderFrontPage, safeUrl, escapeHtml } from '@druck/engine';

const CSS_URL_ATTR = 'css-url';
const DEFAULT_FEED_CSS_URL = 'https://unpkg.com/@druck/css/feed.css';
const FETCH_TIMEOUT_MS = 4000;

class DruckFeedElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['src', 'lang', 'theme', 'accent', CSS_URL_ATTR, 'columns', 'layout', 'fallback-src'];
  }

  #shadow: ShadowRoot | null = null;
  #feedContainer!: HTMLDivElement;
  #cssLink!: HTMLLinkElement;

  #ensureShadow(): void {
    if (this.#shadow) return;
    this.#shadow = this.attachShadow({ mode: 'open' });
    this.#feedContainer = document.createElement('div');
    this.#feedContainer.className = 'druck-feed';
    this.#feedContainer.setAttribute('role', 'list');
    this.#cssLink = document.createElement('link');
    this.#cssLink.rel = 'stylesheet';
    this.#cssLink.href = this.#getCssUrl();
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
    } else if (name === CSS_URL_ATTR && this.#shadow) {
      this.#cssLink.href = this.#getCssUrl();
    } else if ((name === 'lang' || name === 'theme' || name === 'accent') && this.#shadow) {
      this.#applyContainerAttrs();
    } else if (name === 'columns' && this.#shadow) {
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
    try {
      this.#render(await this.#fetchItems(src));
    } catch (primaryError) {
      const fallback = this.getAttribute('fallback-src');
      if (fallback) {
        try {
          this.#render(await this.#fetchItems(fallback));
          return;
        } catch {}
      }
      this.#renderFailure((primaryError as Error).message);
    }
  }

  #render(items: ArticleData[]): void {
    this.#ensureShadow();
    this.#applyContainerAttrs();
    const opts: RenderOptions = {
      lang: this.getAttribute('lang') ?? undefined,
      theme: (this.getAttribute('theme') as RenderOptions['theme']) ?? undefined,
      accentColor: this.getAttribute('accent') ?? undefined,
    };
    if (this.getAttribute('layout') === 'front-page') {
      this.#feedContainer.className = 'druck-feed-host';
      this.#feedContainer.innerHTML = renderFrontPage(buildFrontPage(items), opts);
    } else {
      this.#feedContainer.className = 'druck-feed';
      this.#feedContainer.setAttribute('data-columns', this.getAttribute('columns') || '3');
      this.#feedContainer.innerHTML = items
        .map((data) => `<div role="listitem">${renderCard(data, opts)}</div>`)
        .join('');
    }
    this.dispatchEvent(new CustomEvent('druck:feed-rendered', { bubbles: true, detail: { count: items.length } }));
  }

  #renderFailure(message: string): void {
    this.#ensureShadow();
    const prerendered = this.innerHTML.trim();
    if (prerendered) {
      this.#feedContainer.innerHTML = prerendered;
    } else {
      this.#feedContainer.innerHTML =
        `<div style="padding:24px;color:#999;font-family:system-ui">Failed to load feed: ${escapeHtml(message)}</div>`;
    }
    this.dispatchEvent(new CustomEvent('druck:feed-error', { bubbles: true, detail: { error: escapeHtml(message) } }));
  }
}

if (!customElements.get('druck-feed')) {
  customElements.define('druck-feed', DruckFeedElement);
}

export { DruckFeedElement };
