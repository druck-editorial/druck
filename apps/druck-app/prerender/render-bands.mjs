// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { buildFrontPage, escapeHtml, renderArticle, renderCard, renderFrontPage, safeUrl } from '@druck-editorial/engine';
import { GITHUB_PROFILE, GITHUB_URL, INSTALL_CMD, WIDGET_CDN_URL } from './constants.mjs';
import { SPECTACLE } from './spectacle.mjs';

function widgetGzipKb() {
  try {
    const bundle = readFileSync(join(import.meta.dirname, '../../../packages/druck-widget/dist/druck-widget.js'));
    return (gzipSync(bundle).length / 1024).toFixed(1);
  } catch {
    return '5';
  }
}

const TOKENS = {
  INSTALL_CMD,
  GITHUB_URL,
  GITHUB_PROFILE,
  WIDGET_CDN_URL,
  WIDGET_KB: widgetGzipKb(),
};

function applyTokens(html) {
  return Object.entries(TOKENS).reduce(
    (out, [name, value]) => out.replaceAll(`__DRUCK_${name}__`, value),
    html,
  );
}

const OBJECT_KEY_PATTERN = /^ {2}"([a-zA-Z]+)"/;
const ARRAY_ITEM_KEY_PATTERN = /^ {4}"([a-zA-Z]+)"/;
const HERO_JSON_MAX_ITEMS = 1;
const SPECIMEN_LANGS = ['en', 'de', 'fr', 'es', 'ja'];
const SPECIMEN_FORMATS = ['feature', 'quick_take', 'wire'];

function tokenizeJsonLines(text, keyPattern) {
  return text
    .split('\n')
    .map((line) => {
      const keyMatch = keyPattern.exec(line);
      const keyAttr = keyMatch ? ` data-key="${keyMatch[1]}"` : '';
      return `<span class="jl"${keyAttr}>${tokenizeLine(line)}</span>`;
    })
    .join('\n');
}

export function tokenizeJsonForFeedPane(source, maxItems = HERO_JSON_MAX_ITEMS) {
  const items = JSON.parse(source);
  const shown = items.slice(0, maxItems);
  const html = tokenizeJsonLines(JSON.stringify(shown, null, 2), ARRAY_ITEM_KEY_PATTERN);
  return { html, shown: shown.length, total: items.length };
}

const SPECIMEN_STAT =
  '<div class="specimen-stat"><span class="ss-value">66 ch</span>' +
  '<span class="ss-label">the measure this column holds at every viewport</span></div>';

function tokenizeLine(line) {
  const pattern = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+\.?\d*)|([{}\[\],:])/g;
  let lastIndex = 0;
  let result = '';
  let match;
  while ((match = pattern.exec(line)) !== null) {
    result += escapeHtml(line.slice(lastIndex, match.index));
    const [whole, str, colon, num, punct] = match;
    if (str && colon) result += `<i class="jk">${escapeHtml(str)}</i>${colon}`;
    else if (str) result += `<i class="js">${escapeHtml(str)}</i>`;
    else if (num) result += `<i class="jn">${escapeHtml(num)}</i>`;
    else if (punct) result += `<i class="jp">${escapeHtml(punct)}</i>`;
    else result += escapeHtml(whole);
    lastIndex = match.index + whole.length;
  }
  return result + escapeHtml(line.slice(lastIndex));
}

export function tokenizeJsonForPane(source) {
  return tokenizeJsonLines(source, OBJECT_KEY_PATTERN);
}

export function renderHeroFrontPagePane(items, lang = 'en') {
  const t0 = performance.now();
  const html = renderFrontPage(buildFrontPage(items), { lang });
  const ms = performance.now() - t0;
  const formatted = ms < 1 ? ms.toFixed(2) : ms < 10 ? ms.toFixed(1) : Math.round(ms).toString();
  const stepped = html
    .replace('<div class="df-row df-row--hero">', '<div class="df-row df-row--hero hx" data-step="1">')
    .replace('<div class="df-row df-row--feature">', '<div class="df-row df-row--feature hx" data-step="2">')
    .replace('<div class="df-row df-row--triple">', '<div class="df-row df-row--triple hx" data-step="3">')
    .replace('<div class="df-row df-row--brief">', '<div class="df-row df-row--brief hx" data-step="4">');
  const demoted = stepped.replace(/<h3\b/g, '<div').replace(/<\/h3>/g, '</div>');
  const eager = demoted.replace(/<img class="df-hero-img"([^>]*) loading="lazy"/, '<img class="df-hero-img"$1 loading="eager" fetchpriority="high"');
  return { html: eager + '<div class="hx" data-step="5" aria-hidden="true" style="display:none;"></div>', ms: formatted };
}

function extractHeroCard(frontPageHtml) {
  const match = frontPageHtml.match(/<a class="df-hero-card[\s\S]*?<\/a>/);
  return match ? match[0] : '';
}

function renderBriefRow(data) {
  const href = escapeHtml(safeUrl(data.shareUrl ?? '') ?? '#');
  return (
    `<div class="df-row df-row--brief">` +
    `<div class="df-brief-label">In brief</div>` +
    `<ul><li><a href="${href}"><span class="df-brief-title">${escapeHtml(data.title)}</span><time>${escapeHtml(data.publishedAt)}</time></a></li></ul>` +
    `</div>`
  );
}

function renderAnalyticsEventJson(data) {
  const event = {
    type: 'chapter_read',
    articleSlug: data.slug,
    timestamp: 1718000000000,
    depthPercent: 42,
    detail: data.chapters?.[0]?.title ?? '',
  };
  return escapeHtml(JSON.stringify(event, null, 2));
}

function renderEmbedSnippet(data) {
  return (
    `<pre class="json-pane"><code>` +
    escapeHtml(`<script type="module" src="${WIDGET_CDN_URL}"></script>\n<druck-article src="${data.slug}.json"></druck-article>`) +
    `</code></pre>`
  );
}

export function renderSurfacesSheets(data, lang = 'en') {
  const heroCard = extractHeroCard(renderFrontPage(buildFrontPage([data]), { lang }));
  const card = renderCard(data, { lang });
  const brief = renderBriefRow(data);
  const articleMini = `<div class="surface-article-mini">${renderArticle(data, { lang })}</div>`;
  const embed = renderEmbedSnippet(data);
  const analytics = `<pre class="json-pane"><code>${renderAnalyticsEventJson(data)}</code></pre>`;

  const sheets = [
    { html: heroCard, keys: 'title,heroImage,subtitle,category,shareUrl', label: 'Front-page hero card', cls: 'surface-sheet--hero' },
    { html: card, keys: 'title,category,heroImage,shareUrl', label: 'Grid card', cls: 'surface-sheet--card' },
    { html: brief, keys: 'title,publishedAt,shareUrl', label: 'In brief row', cls: 'surface-sheet--brief' },
    { html: articleMini, keys: 'title,subtitle,heroImage,chapters,keyPoints,shareUrl', label: 'Full article', cls: 'surface-sheet--article' },
    { html: embed, keys: 'slug,title', label: 'Embed snippet', cls: 'surface-sheet--embed' },
    { html: analytics, keys: 'slug,title', label: 'Analytics event', cls: 'surface-sheet--analytics' },
  ];

  return sheets
    .map(
      (s, i) =>
        `<div class="surface-sheet ${s.cls}" data-keys="${s.keys}" data-index="${i}" aria-label="${s.label}" tabindex="0">${s.html}</div>`,
    )
    .join('');
}

async function readFixture(dir, name, lang = 'en') {
  const file = lang === 'de' ? name.replace(/\.json$/, '.de.json') : name;
  const raw = await readFile(join(dir, file), 'utf8');
  try {
    return { raw, data: JSON.parse(raw) };
  } catch (error) {
    throw new Error(`fixture ${file} is not valid JSON: ${error.message}`);
  }
}

const RING_CATEGORIES = [
  ['performance', 'Performance'],
  ['accessibility', 'Accessibility'],
  ['best-practices', 'Best Practices'],
  ['seo', 'SEO'],
];
const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function renderRing(label, score) {
  const value = score ?? null;
  const dash = value === null ? 0 : (value / 100) * RING_CIRCUMFERENCE;
  const display = value === null ? '&ndash;' : String(value);
  return (
    `<figure class="ring" role="img" aria-label="Lighthouse ${label}: ${value === null ? 'not yet measured' : value}">` +
    `<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">` +
    `<circle cx="32" cy="32" r="${RING_RADIUS}" class="ring-track"/>` +
    `<circle cx="32" cy="32" r="${RING_RADIUS}" class="ring-fill" stroke-dasharray="${dash.toFixed(1)} ${RING_CIRCUMFERENCE.toFixed(1)}"/>` +
    `<text x="32" y="37" text-anchor="middle" class="ring-value">${display}</text>` +
    `</svg>` +
    `<figcaption>${label}</figcaption>` +
    `</figure>`
  );
}

function auditProfileLabel(profile) {
  if (profile === 'local-preview') return 'local preview profile';
  return 'mobile profile';
}

export function renderColophonScores(summary) {
  const rings = RING_CATEGORIES.map(([key, label]) => renderRing(label, summary?.scores?.[key] ?? null)).join('');
  const method = summary
    ? `Measured with Lighthouse ${escapeHtml(summary.lighthouseVersion)}, ${auditProfileLabel(summary.profile)}, static production build, ${escapeHtml(summary.measuredAt)}. Initial transfer ${escapeHtml(String(summary.totalTransferKB))} KB.`
    : 'Scores not yet measured for this revision. Run node scripts/audit.mjs.';
  return `<div class="colophon-card"><div class="rings">${rings}</div></div><p class="colophon-method">${method}</p>`;
}

function renderRangePanel(specimen, format, visible) {
  const inner =
    format === 'feature'
      ? `<h3 class="specimen-headline">${escapeHtml(specimen.headline)}</h3>` +
        `<p class="specimen-body">${escapeHtml(specimen.body)}</p>` +
        SPECIMEN_STAT +
        `<blockquote class="specimen-quote">${escapeHtml(specimen.quote)}</blockquote>` +
        `<p class="specimen-rule-label">${escapeHtml(specimen.ruleLabel)}</p>` +
        `<code class="specimen-rule">${escapeHtml(specimen.rule)}</code>`
      : format === 'quick_take'
        ? `<h3 class="specimen-headline">${escapeHtml(specimen.headline)}</h3>` +
          `<p class="specimen-body">${escapeHtml(specimen.body)}</p>` +
          `<blockquote class="specimen-quote">${escapeHtml(specimen.quote)}</blockquote>`
        : `<div class="specimen-kicker">wire</div>` +
          `<h3 class="specimen-headline">${escapeHtml(specimen.headline)}</h3>` +
          `<p class="specimen-body">${escapeHtml(specimen.body)}</p>`;
  return (
    `<article class="specimen-panel" lang="${escapeHtml(specimen.lang)}" data-lang="${escapeHtml(specimen.lang)}" data-format="${escapeHtml(format)}"${visible ? '' : ' hidden'}>` +
    inner +
    '</article>'
  );
}

async function renderRangePanels(fixturesDir) {
  const fixtures = await Promise.all(
    SPECIMEN_LANGS.map((lang) => readFixture(fixturesDir, `specimen.${lang}.json`)),
  );
  return SPECIMEN_LANGS.flatMap((lang, i) =>
    SPECIMEN_FORMATS.map((format) =>
      renderRangePanel(fixtures[i].data, format, lang === 'en' && format === 'feature'),
    ),
  ).join('');
}

const SHOWCASE_ENGINE_LOOKS = ['brutalist', 'swiss', 'helvetica', 'broadsheet', 'luxury', 'noir', 'bento', 'almanac'];

export function renderShowcase(items) {
  const engineSections = SHOWCASE_ENGINE_LOOKS.map((look) => ({
    name: `${look} (engine)`,
    html: renderFrontPage(buildFrontPage(items), { look }),
  }));
  const spectacleSections = SPECTACLE.map(({ key, name, render }) => ({
    name: `${name} (spectacle)`,
    html: render(items),
  }));
  const sections = [...engineSections, ...spectacleSections];
  const morph = sections
    .map((s, i) =>
      `<section class="ms"><div class="ms-label">${String(i + 1).padStart(2, '0')} / ${escapeHtml(s.name)}</div>` +
      `<div class="ms-look reveal">${s.html}</div></section>`,
    )
    .join('');
  return (
    '<a class="sc-close" href="#" aria-label="Close showcase">Close</a>' +
    '<section class="sc-intro"><div><div class="sc-eye">One feed</div>' +
    '<h2>Twenty ways to print the same news.</h2>' +
    '<p>The same stories. Scroll, and watch the front page transform.</p>' +
    '<div class="sc-dn">scroll</div></div></section>' +
    morph +
    '<section class="sc-outro"><div><div class="sc-big">20 looks</div><p>Zero bytes of JavaScript.</p></div></section>'
  );
}

async function renderFrontPageBand(fixturesDir) {
  const snapshot = await readFixture(fixturesDir, 'sonto-snapshot.json');
  return renderFrontPage(buildFrontPage(snapshot.data));
}

const TG_EYE_SVG =
  '<svg class="tg-eye" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.2C4.7 3.2 2 5.2.9 8c1.1 2.8 3.8 4.8 7.1 4.8s6-2 7.1-4.8C14 5.2 11.3 3.2 8 3.2zm0 8a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM8 6.1a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8z"/></svg>';

function renderLedgerlineBubbles(tgPosts) {
  const max = Math.min(tgPosts.length, 5);
  return tgPosts
    .slice(0, max)
    .map(
      (post, i) =>
        `<div class="tg-msg${post.image ? ' tg-msg--photo' : ''}" data-index="${i}" tabindex="0" style="--msg-i:${i}">` +
        (post.image
          ? `<img class="tg-msg-img" src="${escapeHtml(post.image)}" alt="" loading="lazy" width="${post.imageWidth ?? 1200}" height="${post.imageHeight ?? 800}">`
          : '') +
        `<p class="tg-msg-text">${escapeHtml(post.text)}</p>` +
        `<span class="tg-msg-meta">${TG_EYE_SVG}${escapeHtml(post.views)}<span class="tg-msg-time">${escapeHtml(post.time)}</span></span>` +
        '</div>',
    )
    .join('');
}

export async function buildLandingHtml(template, fixturesDir, auditSummary = null, lang = 'en') {
  const [heroFeed, feature, snapshot, rangePanels, tgPosts] = await Promise.all([
    readFixture(fixturesDir, 'hero-feed.json', lang),
    readFixture(fixturesDir, 'feature.json', lang),
    readFixture(fixturesDir, 'sonto-snapshot.json'),
    renderRangePanels(fixturesDir),
    readFixture(fixturesDir, 'tg-posts.json', lang),
  ]);
  const frontPage = renderFrontPage(buildFrontPage(snapshot.data));
  const showcase = renderShowcase(snapshot.data);
  const heroFrontPage = renderHeroFrontPagePane(heroFeed.data, lang);
  const heroJson = tokenizeJsonForFeedPane(heroFeed.raw);
  const surfacesSheets = renderSurfacesSheets(feature.data, lang);
  const storiesNote = lang === 'de'
    ? `${heroJson.shown} von ${heroJson.total} Storys`
    : `${heroJson.shown} of ${heroJson.total} stories`;
  const htmlTag = lang === 'de'
    ? '<html lang="de" data-lang="de"'
    : '<html lang="en" data-lang="en"';
  return applyTokens(template)
    .replace('<html lang="en"', htmlTag)
    .replace('<!--druck:hero-json-->', () => heroJson.html)
    .replace('<!--druck:hero-json-note-->', () => storiesNote)
    .replace('<!--druck:hero-front-page-->', () => heroFrontPage.html)
    .replace('<!--druck:hero-render-ms-->', () => heroFrontPage.ms)
    .replace('<!--druck:surfaces-json-->', () => tokenizeJsonForPane(feature.raw))
    .replace('<!--druck:surfaces-sheets-->', () => surfacesSheets)
    .replace('<!--druck:ledgerline-bubbles-->', () => renderLedgerlineBubbles(tgPosts.data))
    .replace('<!--druck:front-page-->', () => frontPage)
    .replace('<!--druck:showcase-->', () => showcase)
    .replace('<!--druck:range-panels-->', () => rangePanels)
    .replace('<!--druck:colophon-scores-->', () => renderColophonScores(auditSummary));
}

export async function renderDemoArticlePage(fixturesDir) {
  const feature = await readFixture(fixturesDir, 'feature.json');
  const article = renderArticle(feature.data);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(feature.data.title)} — Druck demo</title>
<meta name="description" content="${escapeHtml(feature.data.metaDescription)}">
<meta name="robots" content="index, follow">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/source-serif-4-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/fonts.css">
<link rel="stylesheet" href="/article.css">
<script>(function(){try{var t=localStorage.getItem('druck-theme');if(!t&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)t='dark';if(t)document.documentElement.dataset.theme=t;}catch(e){}})()</script>
<style>body{margin:0;background:#f6f4f1}html[data-theme="dark"] body{background:#0c0c0e}</style>
</head>
<body>
${article}
<footer class="demo-article-footer"><a href="/">&larr; druck — the engine that rendered this page</a></footer>
</body>
</html>`;
}
