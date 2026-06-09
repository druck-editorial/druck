import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { renderArticle } from '@druck/engine';

const TOP_LEVEL_KEY_PATTERN = /^\s{2}"([a-zA-Z]+)"/;
const HERO_JSON_MAX_LINES = 22;
const FORMAT_SLUGS = ['feature', 'slm-quick-take', 'slm-wire'];
const SPECIMEN_LANGS = ['en', 'de', 'fr', 'es', 'ja'];

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

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

export function renderSpecimenPanel(specimen, visible = false) {
  return (
    `<article class="specimen-panel" lang="${escapeHtml(specimen.lang)}" data-lang="${escapeHtml(specimen.lang)}"${visible ? '' : ' hidden'}>` +
    `<h3 class="specimen-headline">${escapeHtml(specimen.headline)}</h3>` +
    `<p class="specimen-body">${escapeHtml(specimen.body)}</p>` +
    `<blockquote class="specimen-quote">${escapeHtml(specimen.quote)}</blockquote>` +
    `<p class="specimen-rule-label">${escapeHtml(specimen.ruleLabel)}</p>` +
    `<code class="specimen-rule">${escapeHtml(specimen.rule)}</code>` +
    '</article>'
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

function renderFormatPanel(slug, data, checked) {
  return (
    `<div class="format-panel" id="format-panel-${escapeHtml(data.format)}" data-format="${escapeHtml(data.format)}" role="tabpanel"${checked ? '' : ' hidden'}>` +
    renderArticle(data) +
    '</div>'
  );
}

export async function buildLandingHtml(template, fixturesDir) {
  const feature = await readFixture(fixturesDir, 'feature.json');

  const formatPanels = [];
  for (const [index, slug] of FORMAT_SLUGS.entries()) {
    const fixture = await readFixture(fixturesDir, `${slug}.json`);
    formatPanels.push(renderFormatPanel(slug, fixture.data, index === 0));
  }

  const specimensHtml = SPECIMEN_LANGS.map((lang, i) => {
    return readFixture(fixturesDir, `specimen.${lang}.json`).then(
      (fixture) => renderSpecimenPanel(fixture.data, i === 0),
    );
  });
  const specimensRendered = (await Promise.all(specimensHtml)).join('');

  const heroJson = tokenizeJsonForPane(feature.raw);
  const heroMagazine = renderHeroMagazinePane(feature.data);
  const formatPanelsHtml = formatPanels.join('');
  const band4 = renderArticle(feature.data);

  return template
    .replace('<!--druck:hero-json-->', () => heroJson)
    .replace('<!--druck:hero-magazine-->', () => heroMagazine)
    .replace('<!--druck:format-panels-->', () => formatPanelsHtml)
    .replace('<!--druck:specimens-->', () => specimensRendered)
    .replace('<!--druck:band4-article-->', () => band4);
}
