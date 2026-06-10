import { describe, expect, it } from 'vitest';
import { buildFrontPage, renderFrontPage } from './frontpage.js';
import type { ArticleData } from './types.js';

function item(n: number, extra: Partial<ArticleData> = {}): ArticleData {
  return {
    title: `Story ${n}`,
    subtitle: `Subtitle ${n}`,
    metaDescription: `Meta ${n}`,
    slug: `story-${n}`,
    format: 'wire',
    category: 'ai',
    publishedAt: 'Jun 10, 2026',
    heroImage: `https://example.com/${n}.webp`,
    shareUrl: `https://example.com/articles/story-${n}/`,
    ...extra,
  };
}

const eleven = Array.from({ length: 11 }, (_, i) => item(i));

describe('buildFrontPage', () => {
  it('produces hero, feature, triple, brief for 11 items', () => {
    const rows = buildFrontPage(eleven);
    expect(rows.map((r) => r.type)).toEqual(['hero', 'feature', 'triple', 'brief']);
    expect(rows.map((r) => r.items.length)).toEqual([1, 2, 3, 5]);
  });

  it('is deterministic', () => {
    expect(buildFrontPage(eleven)).toEqual(buildFrontPage(eleven));
  });

  it('promotes the first hot item to the hero', () => {
    const items = [item(0), item(1), item(2, { hot: true })];
    const rows = buildFrontPage(items);
    expect(rows[0].items[0].slug).toBe('story-2');
  });

  it('degrades gracefully on sparse input', () => {
    expect(buildFrontPage([])).toEqual([]);
    expect(buildFrontPage([item(0)]).map((r) => r.type)).toEqual(['hero']);
    expect(buildFrontPage([item(0), item(1)]).map((r) => r.type)).toEqual(['hero', 'brief']);
    expect(buildFrontPage(eleven.slice(0, 3)).map((r) => r.type)).toEqual(['hero', 'feature']);
  });

  it('caps brief at 5 and ignores overflow', () => {
    const twenty = Array.from({ length: 20 }, (_, i) => item(i));
    const rows = buildFrontPage(twenty);
    expect(rows.at(-1)?.items.length).toBe(5);
    expect(rows.flatMap((r) => r.items).length).toBe(11);
  });
});

describe('renderFrontPage', () => {
  it('renders row wrappers and a scrimmed hero card', () => {
    const html = renderFrontPage(buildFrontPage(eleven));
    expect(html).toContain('class="druck-front-page"');
    expect(html).toContain('df-row--hero');
    expect(html).toContain('df-row--feature');
    expect(html).toContain('df-row--triple');
    expect(html).toContain('df-row--brief');
    expect(html).toContain('df-hero-scrim');
  });

  it('renders a HOT badge only for hot heroes', () => {
    const hot = renderFrontPage(buildFrontPage([item(0, { hot: true })]));
    const cold = renderFrontPage(buildFrontPage([item(0)]));
    expect(hot).toContain('df-hot');
    expect(cold).not.toContain('df-hot');
  });

  it('escapes content and drops unsafe URLs', () => {
    const evil = item(0, {
      title: '<script>x</script>',
      shareUrl: 'javascript:alert(1)',
    });
    const html = renderFrontPage(buildFrontPage([evil]));
    expect(html).not.toContain('<script>x');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('href="#"');
  });

  it('guards an empty hero image src', () => {
    const html = renderFrontPage(buildFrontPage([item(0, { heroImage: '' })]));
    expect(html).not.toContain('src=""');
  });
});
