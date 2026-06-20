// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import './druck-feed.js';

const ITEMS = [
  {
    title: 'Story A', subtitle: 'Sub A', metaDescription: 'M', slug: 'a',
    format: 'wire', category: 'ai', publishedAt: 'Jun 10, 2026',
    heroImage: 'https://example.com/a.webp', shareUrl: 'https://example.com/a/',
  },
];

function okResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

function waitForEvent(el: EventTarget, eventName: string): Promise<CustomEvent> {
  return new Promise((resolve) => {
    el.addEventListener(eventName, (e) => resolve(e as CustomEvent), { once: true });
  });
}

describe('druck-feed front-page mode', () => {
  beforeEach(() => { vi.restoreAllMocks(); });
  afterEach(() => { document.body.innerHTML = ''; });

  it('renders front-page rows when layout="front-page"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(ITEMS)));
    const el = document.createElement('druck-feed');
    el.setAttribute('layout', 'front-page');
    el.setAttribute('src', 'https://example.com/feed.json');
    document.body.appendChild(el);
    await waitForEvent(el, 'druck:feed-rendered');
    expect(el.shadowRoot!.innerHTML).toContain('druck-front-page');
    expect(el.shadowRoot!.innerHTML).toContain('df-row--hero');
  });

  it('falls back to fallback-src when the primary fetch fails', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(okResponse(ITEMS));
    vi.stubGlobal('fetch', fetchMock);
    const el = document.createElement('druck-feed');
    el.setAttribute('layout', 'front-page');
    el.setAttribute('fallback-src', '/snapshot.json');
    el.setAttribute('src', 'https://example.com/feed.json');
    document.body.appendChild(el);
    await waitForEvent(el, 'druck:feed-rendered');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(el.shadowRoot!.innerHTML).toContain('df-row--hero');
  });

  it('preserves prerendered light DOM when every fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const el = document.createElement('druck-feed');
    el.innerHTML = '<div class="druck-front-page">prerendered</div>';
    el.setAttribute('layout', 'front-page');
    el.setAttribute('fallback-src', '/snapshot.json');
    el.setAttribute('src', 'https://example.com/feed.json');
    document.body.appendChild(el);
    const ev = await waitForEvent(el, 'druck:feed-error') as CustomEvent;
    expect(el.shadowRoot!.innerHTML).toContain('<slot>');
    expect(el.innerHTML).toContain('prerendered');
    expect(ev.detail.recovered).toBe(true);
  });

  it('dispatches druck:feed-error with recovered=false when no light DOM and fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('gone')));
    const el = document.createElement('druck-feed');
    el.setAttribute('src', 'https://example.com/feed.json');
    document.body.appendChild(el);
    const ev = await waitForEvent(el, 'druck:feed-error') as CustomEvent;
    expect(ev.detail.recovered).toBe(false);
    expect(el.shadowRoot!.innerHTML).toContain('Failed to load feed');
  });

  it('keeps the light DOM slotted until the shadow stylesheet settles', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(ITEMS)));
    const el = document.createElement('druck-feed');
    el.innerHTML = '<div class="druck-front-page">prerendered</div>';
    el.setAttribute('layout', 'front-page');
    el.setAttribute('src', 'https://example.com/feed.json');
    document.body.appendChild(el);
    expect(el.shadowRoot!.innerHTML).toContain('<slot>');
    expect(el.shadowRoot!.innerHTML).not.toContain('df-row--hero');
    await waitForEvent(el, 'druck:feed-rendered');
    expect(el.shadowRoot!.innerHTML).toContain('df-row--hero');
    expect(el.shadowRoot!.innerHTML).not.toContain('<slot>');
  });

  it('keeps light DOM visible when no src is set (shadow shows slot)', () => {
    const el = document.createElement('druck-feed');
    el.innerHTML = '<div class="druck-front-page">static</div>';
    document.body.appendChild(el);
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot!.innerHTML).toContain('<slot>');
  });

  it('front-page layout has no role="list" on the container', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(ITEMS)));
    const el = document.createElement('druck-feed');
    el.setAttribute('layout', 'front-page');
    el.setAttribute('src', 'https://example.com/feed.json');
    document.body.appendChild(el);
    await waitForEvent(el, 'druck:feed-rendered');
    const container = el.shadowRoot!.querySelector('.druck-feed-host');
    expect(container?.getAttribute('role')).toBeNull();
  });

  it('grid layout has role="list" on the container', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(ITEMS)));
    const el = document.createElement('druck-feed');
    el.setAttribute('src', 'https://example.com/feed.json');
    document.body.appendChild(el);
    await waitForEvent(el, 'druck:feed-rendered');
    const container = el.shadowRoot!.querySelector('.druck-feed');
    expect(container?.getAttribute('role')).toBe('list');
  });

  it('re-renders with the look scoping class when look changes, without refetching', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(ITEMS));
    vi.stubGlobal('fetch', fetchMock);
    const el = document.createElement('druck-feed');
    el.setAttribute('layout', 'front-page');
    el.setAttribute('src', 'https://example.com/feed.json');
    document.body.appendChild(el);
    await waitForEvent(el, 'druck:feed-rendered');

    const rerendered = waitForEvent(el, 'druck:feed-rendered');
    el.setAttribute('look', 'brutalist');
    await rerendered;

    expect(el.shadowRoot!.innerHTML).toContain('druck-front-page--brutalist');
    expect(el.shadowRoot!.innerHTML).toContain('dfb-mast');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('list layout sets data-layout and drops data-columns', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(ITEMS)));
    const el = document.createElement('druck-feed');
    el.setAttribute('layout', 'list');
    el.setAttribute('src', 'https://example.com/feed.json');
    document.body.appendChild(el);
    await waitForEvent(el, 'druck:feed-rendered');
    const container = el.shadowRoot!.querySelector('.druck-feed');
    expect(container?.getAttribute('data-layout')).toBe('list');
    expect(container?.getAttribute('data-columns')).toBeNull();
    expect(container?.getAttribute('role')).toBe('list');
    expect(container?.querySelectorAll('[role="listitem"] .druck-card')).toHaveLength(1);
  });
});
