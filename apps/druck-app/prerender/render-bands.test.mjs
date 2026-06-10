import { describe, expect, test } from 'vitest';
import { join } from 'node:path';
import {
  tokenizeJsonForPane,
  renderHeroMagazinePane,
  buildLandingHtml,
  renderColophonScores,
} from './render-bands.mjs';

const MARKER_TEMPLATE = [
  '__DRUCK_INSTALL_CMD__',
  '__DRUCK_GITHUB_URL__',
  '__DRUCK_GITHUB_PROFILE__',
  '<!--druck:hero-json-->',
  '<!--druck:hero-magazine-->',
  '<!--druck:front-page-->',
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

describe('renderHeroMagazinePane', () => {
  test('produces five stepped slots from article data', () => {
    const data = {
      title: 'A Story',
      titleAccentWord: 'Story',
      subtitle: 'Deck text',
      category: 'ai',
      format: 'feature',
      readingTime: '8 min read',
      heroImage: '/img/slm-hero.webp',
      heroImageAlt: 'alt',
      heroImageWidth: 1920,
      heroImageHeight: 1047,
      chapters: [{ title: 'One', bodyHtml: '<p>First chapter prose.</p>' }],
    };
    const html = renderHeroMagazinePane(data);
    for (const step of [1, 2, 3, 4, 5]) {
      expect(html).toContain(`data-step="${step}"`);
    }
    expect(html).toContain('accent-word');
    expect(html).toContain('width="1920"');
  });
});

describe('buildLandingHtml', () => {
  test('replaces every marker and token against real fixtures', async () => {
    const html = await buildLandingHtml(MARKER_TEMPLATE, FIXTURES_DIR);
    expect(html).not.toContain('<!--druck:');
    expect(html).not.toContain('__DRUCK_');
    expect(html).toContain('druck-front-page');
    expect(html).toContain('specimen-panel');
    expect(html).toContain('pnpm add @druck-editorial/engine');
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
