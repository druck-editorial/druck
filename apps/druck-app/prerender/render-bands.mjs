import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildFrontPage, escapeHtml, renderArticle, renderFrontPage } from '@druck/engine';
import { GITHUB_PROFILE, GITHUB_URL, INSTALL_CMD } from './constants.mjs';

const TOKENS = {
  INSTALL_CMD,
  GITHUB_URL,
  GITHUB_PROFILE,
};

function applyTokens(html) {
  return Object.entries(TOKENS).reduce(
    (out, [name, value]) => out.replaceAll(`__DRUCK_${name}__`, value),
    html,
  );
}

const TOP_LEVEL_KEY_PATTERN = /^\s{2}"([a-zA-Z]+)"/;
const HERO_JSON_MAX_LINES = 22;
const SPECIMEN_LANGS = ['en', 'de', 'fr', 'es', 'ja'];
const SPECIMEN_FORMATS = ['feature', 'quick_take', 'wire'];

const SPECIMEN_STAT =
  '<div class="specimen-stat"><span class="ss-value">$14,250/month</span>' +
  '<span class="ss-label">average savings reported after moving inference to small models</span></div>';

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
  const lines = source.split('\n').slice(0, HERO_JSON_MAX_LINES);
  return lines
    .map((line) => {
      const keyMatch = TOP_LEVEL_KEY_PATTERN.exec(line);
      const keyAttr = keyMatch ? ` data-key="${keyMatch[1]}"` : '';
      return `<span class="jl"${keyAttr}>${tokenizeLine(line)}</span>`;
    })
    .join('\n');
}

function titleWithAccent(title, accentWord) {
  const safe = escapeHtml(title);
  if (!accentWord) return safe;
  const safeWord = escapeHtml(accentWord);
  if (!safe.includes(safeWord)) return safe;
  return safe.replace(safeWord, () => `<em class="accent-word">${safeWord}</em>`);
}

function firstChapterExcerpt(data) {
  const body = data.chapters?.[0]?.bodyHtml ?? data.bodyHtml ?? '';
  const firstParagraph = /<p>.*?<\/p>/s.exec(body);
  return firstParagraph ? firstParagraph[0] : '';
}

export function renderHeroMagazinePane(data) {
  return (
    `<div class="hero-mag article-shell cat-${escapeHtml(data.category)}">` +
    `<div class="hx article-kicker" data-step="1">${escapeHtml(data.category)} <span class="sep">&middot;</span> ${data.format === 'feature' ? 'Feature' : ''}</div>` +
    `<h2 class="hx hero-mag-title" data-step="2">${titleWithAccent(data.title, data.titleAccentWord)}</h2>` +
    `<p class="hx article-deck" data-step="3">${escapeHtml(data.subtitle)}</p>` +
    `<figure class="hx hero-mag-img" data-step="4"><img src="${escapeHtml(data.heroImage)}" alt="${escapeHtml(data.heroImageAlt ?? data.title)}" width="${data.heroImageWidth ?? 1920}" height="${data.heroImageHeight ?? 1080}" loading="eager" fetchpriority="high"></figure>` +
    `<div class="hx hero-mag-body" data-step="5">${firstChapterExcerpt(data)}</div>` +
    '</div>'
  );
}

async function readFixture(dir, name) {
  const raw = await readFile(join(dir, name), 'utf8');
  try {
    return { raw, data: JSON.parse(raw) };
  } catch (error) {
    throw new Error(`fixture ${name} is not valid JSON: ${error.message}`);
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
  return `<div class="rings">${rings}</div><p class="colophon-method">${method}</p>`;
}

function renderRangePanel(specimen, format, visible) {
  const shortBody = `${specimen.body.split('. ')[0]}.`;
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
          `<p class="specimen-body">${escapeHtml(shortBody)}</p>`;
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

async function renderFrontPageBand(fixturesDir) {
  const snapshot = await readFixture(fixturesDir, 'sonto-snapshot.json');
  return renderFrontPage(buildFrontPage(snapshot.data));
}

export async function buildLandingHtml(template, fixturesDir, auditSummary = null) {
  const [feature, frontPage, rangePanels] = await Promise.all([
    readFixture(fixturesDir, 'feature.json'),
    renderFrontPageBand(fixturesDir),
    renderRangePanels(fixturesDir),
  ]);
  return applyTokens(template)
    .replace('<!--druck:hero-json-->', () => tokenizeJsonForPane(feature.raw))
    .replace('<!--druck:hero-magazine-->', () => renderHeroMagazinePane(feature.data))
    .replace('<!--druck:front-page-->', () => frontPage)
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
