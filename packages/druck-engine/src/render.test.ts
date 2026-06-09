import { describe, expect, test } from 'vitest';
import { renderArticle } from './render.js';
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
});
