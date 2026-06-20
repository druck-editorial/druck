// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { describe, expect, it } from 'vitest';
import { buildFrontPage, renderFrontPage, partitionRows } from './frontpage.js';
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

  it('enriches items with role and hasImage', () => {
    const rows = buildFrontPage(eleven);
    expect(rows[0].items[0].role).toBe('lead');
    expect(rows[1].items[0].role).toBe('feature');
    expect(rows[3].items[0].role).toBe('brief');
    expect(rows[0].items[0].hasImage).toBe(true);
  });

  it('marks items without a usable hero image as hasImage=false', () => {
    const rows = buildFrontPage([item(0, { heroImage: '' })]);
    expect(rows[0].items[0].hasImage).toBe(false);
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

describe('renderFrontPage look dispatch', () => {
  it('classic output is unchanged by the look parameter', () => {
    const a = renderFrontPage(buildFrontPage(eleven));
    const b = renderFrontPage(buildFrontPage(eleven), { look: 'classic' });
    expect(a).toBe(b);
    expect(a.startsWith('<div class="druck-front-page">')).toBe(true);
    expect(a).toContain('df-row--hero');
  });

  it('falls back to classic with no scoping class for an unimplemented look', () => {
    const classic = renderFrontPage(buildFrontPage(eleven), { look: 'classic' });
    const unknown = renderFrontPage(buildFrontPage(eleven), { look: 'unknown' as any });
    expect(unknown).toBe(classic);
    expect(unknown).not.toContain('druck-front-page--unknown');
  });
});

describe('partitionRows', () => {
  it('splits rows into lead, cells, and brief', () => {
    const rows = buildFrontPage(eleven);
    const p = partitionRows(rows);
    expect(p.lead?.slug).toBe(rows[0].items[0].slug);
    expect(p.cells.length).toBe(5);
    expect(p.brief.length).toBe(5);
  });

  it('returns an empty partition for no rows', () => {
    const p = partitionRows([]);
    expect(p.lead).toBeUndefined();
    expect(p.cells).toEqual([]);
    expect(p.brief).toEqual([]);
  });
});

describe('composeBrutalist', () => {
  it('scopes the wrapper and renders masthead, lead, cells and brief', () => {
    const html = renderFrontPage(buildFrontPage(eleven), { look: 'brutalist' });
    expect(html).toContain('druck-front-page--brutalist');
    expect(html).toContain('dfb-mast');
    expect(html).toContain('dfb-lead');
    expect(html).toContain('dfb-grid');
    expect(html).toContain('dfb-brief');
  });

  it('escapes titles and only emits safe hrefs', () => {
    const items = [
      item(0, { hot: true, title: '<script>x</script>', shareUrl: 'javascript:alert(1)' }),
      item(1), item(2), item(3),
    ];
    const html = renderFrontPage(buildFrontPage(items), { look: 'brutalist' });
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('javascript:alert(1)');
  });
});

describe('engine look: swiss', () => {
  it('scopes the wrapper, renders structure, and escapes', () => {
    const items = [
      item(0, { hot: true, title: '<script>x</script>', shareUrl: 'javascript:alert(1)' }),
      item(1), item(2), item(3), item(4), item(5),
    ];
    const html = renderFrontPage(buildFrontPage(items), { look: 'swiss' });
    expect(html).toContain('druck-front-page--swiss');
    expect(html).toContain('dfsw-lead');
    expect(html).toContain('dfsw-grid');
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('javascript:alert(1)');
  });
});

describe('engine look: broadsheet', () => {
  it('scopes the wrapper, renders columns, and escapes', () => {
    const items = [
      item(0, { hot: true, title: '<script>x</script>', shareUrl: 'javascript:alert(1)' }),
      item(1), item(2), item(3), item(4), item(5),
    ];
    const html = renderFrontPage(buildFrontPage(items), { look: 'broadsheet' });
    expect(html).toContain('druck-front-page--broadsheet');
    expect(html).toContain('dfbr-mast');
    expect(html).toContain('dfbr-cols');
    expect(html).not.toContain('<script>x</script>');
    expect(html).not.toContain('javascript:alert(1)');
  });
});

describe('engine look: luxury', () => {
  it('scopes the wrapper, renders hero + blocks, and escapes', () => {
    const items = [
      item(0, { hot: true, title: '<script>x</script>', shareUrl: 'javascript:alert(1)' }),
      item(1), item(2), item(3), item(4), item(5),
    ];
    const html = renderFrontPage(buildFrontPage(items), { look: 'luxury' });
    expect(html).toContain('druck-front-page--luxury');
    expect(html).toContain('dflx-hero');
    expect(html).toContain('dflx-body');
    expect(html).not.toContain('<script>x</script>');
    expect(html).not.toContain('javascript:alert(1)');
  });
});

describe('engine look: noir', () => {
  it('scopes the wrapper, renders hero + blocks, and escapes', () => {
    const items = [
      item(0, { hot: true, title: '<script>x</script>', shareUrl: 'javascript:alert(1)' }),
      item(1), item(2), item(3), item(4), item(5),
    ];
    const html = renderFrontPage(buildFrontPage(items), { look: 'noir' });
    expect(html).toContain('druck-front-page--noir');
    expect(html).toContain('dfnr-hero');
    expect(html).toContain('dfnr-body');
    expect(html).not.toContain('<script>x</script>');
    expect(html).not.toContain('javascript:alert(1)');
  });
});

describe('engine look: bento', () => {
  it('scopes the wrapper, renders tiles, and escapes', () => {
    const items = [
      item(0, { hot: true, title: '<script>x</script>', shareUrl: 'javascript:alert(1)' }),
      item(1), item(2), item(3), item(4), item(5),
    ];
    const html = renderFrontPage(buildFrontPage(items), { look: 'bento' });
    expect(html).toContain('druck-front-page--bento');
    expect(html).toContain('dfbn-grid');
    expect(html).toContain('dfbn-hero');
    expect(html).not.toContain('<script>x</script>');
    expect(html).not.toContain('javascript:alert(1)');
  });
});
