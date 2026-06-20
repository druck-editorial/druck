// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { describe, expect, it, test } from 'vitest';
import { join } from 'node:path';
import {
  tokenizeJsonForPane,
  tokenizeJsonForFeedPane,
  buildLandingHtml,
  renderColophonScores,
  renderFeaturedLooks,
  renderShowcase,
} from './render-bands.mjs';

const MARKER_TEMPLATE = [
  '__DRUCK_INSTALL_CMD__',
  '__DRUCK_GITHUB_URL__',
  '__DRUCK_GITHUB_PROFILE__',
  '<!--druck:hero-json-->',
  '<!--druck:hero-json-note-->',
  '<!--druck:hero-front-page-->',
  '<!--druck:hero-render-ms-->',
  '<!--druck:surfaces-json-->',
  '<!--druck:surfaces-sheets-->',
  '<!--druck:ledgerline-bubbles-->',
  '<!--druck:front-page-->',
  '<!--druck:showcase-->',
  '<!--druck:featured-looks-->',
  '<!--druck:range-panels-->',
  '<!--druck:colophon-scores-->',
].join('\n');

const FIXTURES_DIR = join(import.meta.dirname, '../public/sample-data');

describe('tokenizeJsonForPane', () => {
  test('wraps each line and tags top-level keys', () => {
    const html = tokenizeJsonForPane('{\n  "title": "Hello",\n  "category": "ai"\n}');
    expect(html).toContain('data-key="title"');
    expect(html).toContain('data-key="category"');
    expect(html).toContain('class="jl"');
  });

  test('escapes embedded markup', () => {
    const html = tokenizeJsonForPane('{\n  "bodyHtml": "<script>alert(1)</script>"\n}');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  test('emits jk and js classes for keys and string values', () => {
    const html = tokenizeJsonForPane('{\n  "title": "Hello"\n}');
    expect(html).toContain('class="jk"');
    expect(html).toContain('class="js"');
  });
});

describe('tokenizeJsonForFeedPane', () => {
  const SOURCE = JSON.stringify(
    [
      { title: 'A', category: 'ai' },
      { title: 'B', category: 'dev' },
      { title: 'C', category: 'science' },
      { title: 'D', category: 'general' },
    ],
    null,
    2,
  );

  test('renders a complete, valid JSON array capped at maxItems', () => {
    const { html, shown, total } = tokenizeJsonForFeedPane(SOURCE, 3);
    expect(shown).toBe(3);
    expect(total).toBe(4);
    expect(html).toContain('data-key="title"');
    expect(html).toContain('data-key="category"');
    expect(html).not.toContain('"D"');
    const text = html.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"');
    expect(() => JSON.parse(text)).not.toThrow();
    expect(JSON.parse(text)).toHaveLength(3);
  });

  test('keeps no truncation pseudo-lines', () => {
    const { html } = tokenizeJsonForFeedPane(SOURCE, 2);
    expect(html).not.toContain('more stories');
    expect(html).not.toContain('muted');
  });
});

describe('buildLandingHtml', () => {
  test('replaces every marker and token against real fixtures', async () => {
    const html = await buildLandingHtml(MARKER_TEMPLATE, FIXTURES_DIR);
    expect(html).not.toContain('<!--druck:');
    expect(html).not.toContain('__DRUCK_');
    expect(html).toContain('druck-front-page');
    expect(html).toContain('df-row--hero');
    expect(html).toContain('specimen-panel');
    expect(html).toContain('pnpm add @druck-editorial/engine');
    expect(html).toContain('surface-sheet');
    expect(html).toContain('data-keys=');
    expect(html).toContain('tg-msg');
    expect(html).toContain('tg-msg-meta');
    expect(html).toContain('data-index=');
    expect(html).toContain('sc-intro');
    expect(html).toContain('druck-front-page--brutalist');
    expect(html).toContain('look-tiles');
    expect(html).toContain('look-tile-frame');
  });

  test('throws on a missing fixture directory', async () => {
    await expect(buildLandingHtml('<!--druck:front-page-->', '/nonexistent')).rejects.toThrow();
  });

  test('only the en feature specimen panel is visible', async () => {
    const html = await buildLandingHtml(MARKER_TEMPLATE, FIXTURES_DIR);
    const panels = html.match(/<article class="specimen-panel"[^>]*>/g) ?? [];
    expect(panels).toHaveLength(15);
    const visible = panels.filter((tag) => !tag.includes(' hidden'));
    expect(visible).toHaveLength(1);
    expect(visible[0]).toContain('data-lang="en"');
    expect(visible[0]).toContain('data-format="feature"');
  });
});

describe('renderColophonScores', () => {
  test('renders four rings with measured values', () => {
    const html = renderColophonScores({
      scores: { performance: 100, accessibility: 100, 'best-practices': 100, seo: 100 },
      totalTransferKB: 212,
      lighthouseVersion: '13.0.0',
      measuredAt: '2026-06-09',
      profile: 'local-preview',
    });
    expect(html.match(/class="ring"/g)).toHaveLength(4);
    expect(html).toContain('212');
    expect(html).toContain('13.0.0');
    expect(html).toContain('local preview profile');
  });

  test('renders pending state when no summary exists', () => {
    const html = renderColophonScores(null);
    expect(html.match(/class="ring"/g)).toHaveLength(4);
    expect(html).toContain('not yet measured');
  });
});

describe('renderFeaturedLooks', () => {
  const items = [
    { title: 'Lead', subtitle: 'S', category: 'ai', publishedAt: 'Jun 10, 2026', heroImage: 'https://e.com/a.webp', shareUrl: 'https://e.com/a/', hot: true },
    { title: 'Two', subtitle: 'S2', category: 'startup', publishedAt: 'Jun 10, 2026', heroImage: 'https://e.com/b.webp', shareUrl: 'https://e.com/b/' },
    { title: 'Three', subtitle: 'S3', category: 'science', publishedAt: 'Jun 09, 2026', heroImage: 'https://e.com/c.webp', shareUrl: 'https://e.com/c/' },
  ];
  it('returns a look-tiles container with three tiles', () => {
    const html = renderFeaturedLooks(items);
    expect(html).toContain('look-tile');
    expect((html.match(/class="look-tile"/g) ?? []).length).toBe(3);
  });
  it('links brutalist to ms-0', () => {
    const html = renderFeaturedLooks(items);
    expect(html).toContain('href="#ms-0"');
  });
  it('links vaporwave to ms-10', () => {
    const html = renderFeaturedLooks(items);
    expect(html).toContain('href="#ms-10"');
  });
  it('links neubrutalism to ms-19', () => {
    const html = renderFeaturedLooks(items);
    expect(html).toContain('href="#ms-19"');
  });
  it('renders correct display names', () => {
    const html = renderFeaturedLooks(items);
    expect(html).toContain('Brutalist');
    expect(html).toContain('Vaporwave');
    expect(html).toContain('Neubrutalism');
  });
});

describe('renderShowcase', () => {
  const items = [
    { title: 'Lead', subtitle: 'S', category: 'ai', publishedAt: 'Jun 10, 2026', heroImage: 'https://e.com/a.webp', shareUrl: 'https://e.com/a/', hot: true },
    { title: 'Two', subtitle: 'S2', category: 'startup', publishedAt: 'Jun 10, 2026', heroImage: 'https://e.com/b.webp', shareUrl: 'https://e.com/b/' },
    { title: 'Three', subtitle: 'S3', category: 'science', publishedAt: 'Jun 09, 2026', heroImage: 'https://e.com/c.webp', shareUrl: 'https://e.com/c/' },
  ];
  it('renders engine and spectacle look sections inside the overlay', () => {
    const html = renderShowcase(items);
    expect(html).toContain('class="sc-intro"');
    expect(html).toContain('druck-front-page--brutalist');
    expect(html).toContain('druck-front-page--almanac');
    expect(html).toContain('sx-aqua');
    expect(html).toContain('sx-aero');
    expect(html).toContain('class="sc-close"');
  });

  it('renders the themes nav with jump-links and section ids', () => {
    const html = renderShowcase(items);
    expect(html).toContain('class="sc-nav"');
    expect(html).toContain('href="#ms-0"');
    expect(html).toContain('id="ms-0"');
  });
});
