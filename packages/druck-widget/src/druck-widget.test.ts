// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
// @vitest-environment happy-dom

import { describe, test, expect, vi, beforeAll, afterAll } from 'vitest';
import { DruckArticleElement } from './druck-widget.js';
import { DruckFeedElement } from './druck-feed.js';

describe('DruckArticleElement', () => {
  beforeAll(() => {
    if (!customElements.get('druck-article')) {
      customElements.define('druck-article', DruckArticleElement);
    }
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  test('does not fetch unsafe src URLs', async () => {
    const el = document.createElement('druck-article') as DruckArticleElement;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));

    el.setAttribute('src', 'javascript:alert(1)');
    document.body.appendChild(el);

    await new Promise((r) => setTimeout(r, 10));

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
    el.remove();
  });

  test('keeps the light DOM slotted until the shadow stylesheet settles', async () => {
    const el = document.createElement('druck-article') as DruckArticleElement;
    el.innerHTML = '<article class="prerendered">static</article>';
    const data = {
      title: 'Test Story', subtitle: 'A subtitle', metaDescription: 'meta', slug: 'test-story',
      format: 'feature', category: 'ai', publishedAt: '2026-06-09', readingTime: '3 min read',
      heroImage: '/img/test.webp', chapters: [{ title: 'One', bodyHtml: '<p>Body</p>' }],
    };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(data)));

    el.setAttribute('src', '/article.json');
    document.body.appendChild(el);

    expect(el.shadowRoot!.innerHTML).toContain('<slot>');
    await new Promise((resolve) => el.addEventListener('druck:rendered', resolve, { once: true }));
    expect(el.shadowRoot!.innerHTML).toContain('Test Story');
    expect(el.shadowRoot!.innerHTML).not.toContain('<slot>');
    fetchSpy.mockRestore();
    el.remove();
  });

  test('escapes error messages in fallback UI', async () => {
    const el = document.createElement('druck-article') as DruckArticleElement;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('<script>'));

    el.setAttribute('src', '/safe.json');
    document.body.appendChild(el);

    await new Promise((r) => setTimeout(r, 10));

    expect(el.shadowRoot!.innerHTML).toContain('&lt;script&gt;');
    expect(el.shadowRoot!.innerHTML).not.toContain('<script>');
    fetchSpy.mockRestore();
    el.remove();
  });
});

describe('DruckFeedElement', () => {
  beforeAll(() => {
    if (!customElements.get('druck-feed')) {
      customElements.define('druck-feed', DruckFeedElement);
    }
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  test('does not fetch unsafe src URLs', async () => {
    const el = document.createElement('druck-feed') as DruckFeedElement;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]'));

    el.setAttribute('src', 'data:text/html,<script>');
    document.body.appendChild(el);

    await new Promise((r) => setTimeout(r, 10));

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
    el.remove();
  });

  test('escapes error messages in fallback UI', async () => {
    const el = document.createElement('druck-feed') as DruckFeedElement;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('<script>alert(1)</script>'));

    el.setAttribute('src', '/feed.json');
    document.body.appendChild(el);

    await new Promise((r) => setTimeout(r, 10));

    expect(el.shadowRoot!.innerHTML).toContain('&lt;script&gt;');
    expect(el.shadowRoot!.innerHTML).not.toContain('<script>');
    fetchSpy.mockRestore();
    el.remove();
  });
});
