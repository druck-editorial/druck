import { describe, expect, test } from 'vitest';
import { join } from 'node:path';
import {
  tokenizeJsonForPane,
  renderHeroMagazinePane,
  renderSpecimenPanel,
  buildLandingHtml,
  renderColophonScores,
} from './render-bands.mjs';

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

describe('renderSpecimenPanel', () => {
  test('scopes language and shows the css rule', () => {
    const html = renderSpecimenPanel({
      lang: 'de',
      label: 'Deutsch',
      headline: 'Kopfzeile',
      body: 'Text',
      quote: 'Zitat',
      rule: 'hyphens: auto;',
      ruleLabel: 'Trennung',
    });
    expect(html).toContain('lang="de"');
    expect(html).toContain('hyphens: auto;');
  });
});

describe('buildLandingHtml', () => {
  test('replaces every marker against real fixtures', async () => {
    const template = [
      '<!--druck:hero-json-->',
      '<!--druck:hero-magazine-->',
      '<!--druck:format-panels-->',
      '<!--druck:specimens-->',
      '<!--druck:band4-article-->',
    ].join('\n');
    const html = await buildLandingHtml(template, FIXTURES_DIR);
    expect(html).not.toContain('<!--druck:');
    expect(html).toContain('article-shell');
    expect(html).toContain('specimen-panel');
  });

  test('throws on a missing fixture directory', async () => {
    await expect(buildLandingHtml('<!--druck:band4-article-->', '/nonexistent')).rejects.toThrow();
  });

  test('first specimen panel is visible and the other four are hidden', async () => {
    const template = [
      '<!--druck:hero-json-->',
      '<!--druck:hero-magazine-->',
      '<!--druck:format-panels-->',
      '<!--druck:specimens-->',
      '<!--druck:band4-article-->',
    ].join('\n');
    const html = await buildLandingHtml(template, FIXTURES_DIR);
    expect((html.match(/specimen-panel"[^>]* hidden>/g) ?? []).length).toBe(4);
    expect(html).not.toMatch(/lang="en"[^>]* hidden>/);
  });
});

describe('renderColophonScores', () => {
  test('renders four rings with measured values', () => {
    const html = renderColophonScores({
      scores: { performance: 100, accessibility: 100, 'best-practices': 100, seo: 100 },
      totalTransferKB: 212,
      lighthouseVersion: '13.0.0',
      measuredAt: '2026-06-09',
    });
    expect(html.match(/class="ring"/g)).toHaveLength(4);
    expect(html).toContain('212');
    expect(html).toContain('13.0.0');
  });

  test('renders pending state when no summary exists', () => {
    const html = renderColophonScores(null);
    expect(html.match(/class="ring"/g)).toHaveLength(4);
    expect(html).toContain('not yet measured');
  });
});
