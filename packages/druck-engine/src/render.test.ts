// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { describe, expect, test } from 'vitest';
import { renderArticle, renderCard } from './render.js';
import type { ArticleData } from './types.js';

function buildArticle(overrides: Partial<ArticleData> = {}): ArticleData {
  return {
    title: 'Test Story',
    subtitle: 'A subtitle',
    metaDescription: 'meta',
    slug: 'test-story',
    format: 'feature',
    category: 'ai',
    publishedAt: '2026-06-09',
    readingTime: '3 min read',
    heroImage: '/img/test.webp',
    chapters: [{ title: 'One', bodyHtml: '<p>Body</p>' }],
    ...overrides,
  };
}

describe('hero image attributes', () => {
  test('emits provided alt text and dimensions on feature heroes', () => {
    const html = renderArticle(
      buildArticle({ heroImageAlt: 'Abstract circuitry', heroImageWidth: 1920, heroImageHeight: 1047 })
    );
    expect(html).toContain('alt="Abstract circuitry"');
    expect(html).toContain('width="1920"');
    expect(html).toContain('height="1047"');
  });

  test('falls back to title alt and template dimensions when fields absent', () => {
    const html = renderArticle(buildArticle());
    expect(html).toContain('alt="Test Story"');
    expect(html).toContain('width="1920"');
    expect(html).toContain('height="1080"');
  });

  test('emits provided dimensions on wire heroes', () => {
    const html = renderArticle(
      buildArticle({ format: 'wire', bodyHtml: '<p>Wire body</p>', heroImageWidth: 1920, heroImageHeight: 1049 })
    );
    expect(html).toContain('width="1920"');
    expect(html).toContain('height="1049"');
  });

  test('escapes html-special characters in heroImageAlt', () => {
    const html = renderArticle(buildArticle({ heroImageAlt: '"onload="alert(1)' }));
    expect(html).not.toContain('"onload=');
    expect(html).toContain('&quot;');
  });

  test('rejects non-numeric hero dimensions to prevent attribute injection', () => {
    const malicious = { heroImageWidth: '800" onload="alert(1)' } as unknown as Partial<ArticleData>;
    const html = renderArticle(buildArticle(malicious));
    expect(html).not.toContain('onload=');
    expect(html).toContain('width="1920"');
  });

  test('falls back to wire template dimensions when fields absent', () => {
    const html = renderArticle(buildArticle({ format: 'wire', bodyHtml: '<p>Wire body</p>', chapters: undefined }));
    expect(html).toContain('width="1600"');
    expect(html).toContain('height="900"');
  });
});

describe('renderCard', () => {
  test('emits card markup with category class and kicker', () => {
    const html = renderCard(buildArticle({ format: 'quick_take' }));
    expect(html).toContain('class="druck-card cat-ai"');
    expect(html).toContain('class="card-thumb"');
    expect(html).toContain('class="card-title"');
    expect(html).toContain('ai');
    expect(html).toContain('Quick Take');
    expect(html).toContain('Test Story');
    expect(html).toContain('A subtitle');
  });

  test('renders an automatic placeholder thumb when heroImage is missing', () => {
    const html = renderCard(buildArticle({ heroImage: undefined }));
    expect(html).toContain('card-thumb--placeholder');
    expect(html).toContain('class="thumb-mark"');
    expect(html).not.toContain('<img');
  });

  test('uses shareUrl as href when present', () => {
    const html = renderCard(buildArticle({ shareUrl: '/articles/test/' }));
    expect(html).toContain('href="/articles/test/"');
  });

  test('falls back to slug hash when shareUrl absent', () => {
    const html = renderCard(buildArticle());
    expect(html).toContain('href="#test-story"');
  });

  test('escapes title and subtitle in card output', () => {
    const html = renderCard(buildArticle({ title: '<script>', subtitle: '"alert"' }));
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&quot;alert&quot;');
  });

  test('strips javascript: URLs from card href', () => {
    const html = renderCard(buildArticle({ shareUrl: 'javascript:alert(1)' }));
    expect(html).not.toContain('javascript:');
    expect(html).toContain('href="\#"');
  });

  test('strips data: URLs from hero image src', () => {
    const html = renderArticle(buildArticle({ heroImage: 'data:image/svg+xml,<svg></svg>' }));
    expect(html).not.toContain('data:');
    expect(html).toContain('src=""');
  });

  test('preserves safe relative and absolute URLs', () => {
    const html = renderCard(buildArticle({ shareUrl: '/articles/safe/', heroImage: 'https://example.com/img.webp' }));
    expect(html).toContain('href="/articles/safe/"');
    expect(html).toContain('src="https://example.com/img.webp"');
  });

  test('omits the reading-time span when readingTime is absent', () => {
    const html = renderCard(buildArticle({ readingTime: undefined }));
    expect(html).not.toContain('<span></span>');
    expect(html).toContain('<time>');
  });

  test('accepts the widened category union', () => {
    const html = renderCard(buildArticle({ category: 'infrastructure' }));
    expect(html).toContain('cat-infrastructure');
  });
});

describe('renderArticle feature format', () => {
  test('omits reading-time span in byline when readingTime is absent', () => {
    const html = renderArticle(buildArticle({ format: 'feature', readingTime: undefined }));
    expect(html).not.toContain('<span></span>');
    expect(html).toContain('article-byline');
  });
});

describe('renderArticle wire format', () => {
  test('omits reading-time span in meta when readingTime is absent', () => {
    const html = renderArticle(buildArticle({ format: 'wire', readingTime: undefined, bodyHtml: '<p>Wire body</p>' }));
    expect(html).not.toContain('<span></span>');
    expect(html).toContain('post-simple-meta');
  });
});

describe('body sanitization', () => {
  test('strips <script> tags from chapter bodyHtml', () => {
    const html = renderArticle(buildArticle({ chapters: [{ title: 'X', bodyHtml: '<p>ok</p><script>alert(1)</script>' }] }));
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('alert(1)');
  });

  test('strips on* event handler attributes from chapter bodyHtml', () => {
    const html = renderArticle(buildArticle({ chapters: [{ title: 'X', bodyHtml: '<p onload="alert(1)">ok</p>' }] }));
    expect(html).not.toContain('onload');
    expect(html).not.toContain('alert(1)');
  });

  test('strips javascript: URLs from chapter bodyHtml', () => {
    const html = renderArticle(buildArticle({ chapters: [{ title: 'X', bodyHtml: '<a href="javascript:alert(1)">x</a>' }] }));
    expect(html).not.toContain('javascript:');
  });

  test('strips <script> tags from top-level bodyHtml', () => {
    const html = renderArticle(buildArticle({ format: 'wire', bodyHtml: '<p>Wire</p><script>alert(2)</script>', chapters: undefined }));
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('alert(2)');
  });

  test('strips dangerous tags (iframe, object, embed) from chapter bodyHtml', () => {
    const html = renderArticle(buildArticle({ chapters: [{ title: 'X', bodyHtml: '<iframe src="//evil"></iframe><p>safe</p>' }] }));
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('evil');
  });

  test('strips <style> and inline event attributes together', () => {
    const html = renderArticle(buildArticle({ chapters: [{ title: 'X', bodyHtml: '<style>body{}</style><img src=x onerror="alert(3)">' }] }));
    expect(html).not.toContain('<style');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('alert(3)');
  });

  test('preserves allowed inline markup after sanitization', () => {
    const html = renderArticle(buildArticle({ chapters: [{ title: 'X', bodyHtml: '<p><em>ok</em> <a href="/x">link</a></p>' }] }));
    expect(html).toContain('<em>ok</em>');
    expect(html).toContain('href="/x"');
  });
});
