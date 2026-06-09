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
});
