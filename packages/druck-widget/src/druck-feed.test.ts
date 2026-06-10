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

describe('druck-feed front-page mode', () => {
  beforeEach(() => { vi.restoreAllMocks(); });
  afterEach(() => { document.body.innerHTML = ''; });

  it('renders front-page rows when layout="front-page"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(ITEMS)));
    const el = document.createElement('druck-feed');
    el.setAttribute('layout', 'front-page');
    el.setAttribute('src', 'https://example.com/feed.json');
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 0));
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
    await new Promise((r) => setTimeout(r, 0));
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
    await new Promise((r) => setTimeout(r, 0));
    expect(el.shadowRoot!.innerHTML).toContain('prerendered');
  });

  it('keeps light DOM visible when no src is set (no shadow attached)', () => {
    const el = document.createElement('druck-feed');
    el.innerHTML = '<div class="druck-front-page">static</div>';
    document.body.appendChild(el);
    expect(el.shadowRoot).toBeNull();
  });
});
