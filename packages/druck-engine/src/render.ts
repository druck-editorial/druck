import type {
  ArticleData,
  Chapter,
  KeyPoint,
  KnowCard,
  RelatedArticle,
  RenderOptions,
  WeeklyData,
  WeeklySection,
} from './types.js';
import { escapeHtml, sanitizeInline, transformInlineBlocks, safeUrl } from './format.js';

function safeDimension(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? Math.trunc(value as number) : fallback;
}

function titleWithAccent(title: string, accentWord?: string): string {
  const safe = escapeHtml(title);
  if (!accentWord) return safe;
  const safeWord = escapeHtml(accentWord);
  if (!safe.includes(safeWord)) return safe;
  const idx = safe.indexOf(safeWord);
  return safe.slice(0, idx) + `<em class="accent-word">${safeWord}</em>` + safe.slice(idx + safeWord.length);
}

function renderChapter(num: number, total: number, chapter: Chapter): string {
  const titleHtml = titleWithAccent(chapter.title, chapter.titleAccentWord);
  const body = transformInlineBlocks(chapter.bodyHtml);
  return (
    '<section class="chapter-panel">' +
    '<div class="chapter-head">' +
    `<div class="chapter-num">Chapter ${escapeHtml(String(num))} &middot; of ${String(total).padStart(2, '0')}</div>` +
    `<h2 class="chapter-title">${titleHtml}</h2>` +
    '</div>' +
    `<div class="chapter-body">${body}</div>` +
    '</section>'
  );
}

function renderKeyPoints(points?: KeyPoint[]): string {
  if (!points?.length) return '';
  const items = points
    .slice(0, 3)
    .map(
      (p, i) =>
        `<div class="kp-item"><div class="n">${String(i + 1).padStart(2, '0')}</div><p>${escapeHtml(p.text)}</p></div>`
    )
    .join('');
  return (
    '<section class="key-points">' +
    '<div class="lbl">Three things to know</div>' +
    `<div class="key-points-grid">${items}</div>` +
    '</section>'
  );
}

function renderKnowCard(items: string[], label: string, kind: string): string {
  const lis = items.map((x) => `<li>${escapeHtml(x)}</li>`).join('');
  return (
    `<div class="know-card ${kind}">` +
    `<div class="lbl">${label}</div>` +
    `<ul>${lis || '<li>&mdash;</li>'}</ul>` +
    '</div>'
  );
}

function renderKnowCards(known?: KnowCard, unknown?: KnowCard): string {
  const k = known?.items ?? [];
  const u = unknown?.items ?? [];
  if (!k.length && !u.length) return '';
  return (
    '<aside class="know-cards" role="note">' +
    renderKnowCard(k, 'What we know', 'yes') +
    renderKnowCard(u, "What we don't", 'no') +
    '</aside>'
  );
}

function renderEditorsNote(angle?: string, sourceCount?: number): string {
  if (!angle) return '';
  const siteName = 'Druck';
  return (
    '<aside class="editors-note" role="note">' +
    "<span class=\"lbl\">Editor's note</span> " +
    `Written by ${siteName}'s editorial agent from <b>${sourceCount ?? 1} sources</b>. ` +
    `<b>${siteName}'s angle:</b> ${escapeHtml(angle)}` +
    '</aside>'
  );
}

function renderShareBar(title: string, url?: string): string {
  const shareUrl = url ?? '#';
  return (
    '<div class="article-share-bar">' +
    '<span class="article-share-bar-label">Share this story</span>' +
    '<div class="article-share-bar-actions">' +
    `<button class="share-btn-pill" data-share-button data-share-title="${escapeHtml(title)}" data-share-url="${escapeHtml(shareUrl)}" aria-label="Share article">` +
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<line x1="22" y1="2" x2="11" y2="13"/>' +
    '<polygon points="22 2 15 22 11 13 2 9 22 2"/>' +
    '</svg>' +
    'Share' +
    '</button>' +
    '</div>' +
    '</div>'
  );
}

export function categoryClass(category: string): string {
  return `cat-${category}`;
}

function formatLabel(format: string): string {
  if (format === 'quick_take') return 'Quick Take';
  if (format === 'feature') return 'Feature';
  return '';
}

function renderRelated(related?: RelatedArticle[]): string {
  if (!related?.length) return '';
  const cards = related
    .map(
      (r) => {
        const safeRelatedUrl = safeUrl(r.url);
        if (!safeRelatedUrl) return '';
        return (
          `<a class="similar-card" href="${escapeHtml(safeRelatedUrl)}">` +
          (r.image ? `<img class="sc-img" src="${escapeHtml(safeUrl(r.image))}" alt="" loading="lazy">` : '') +
          `<div class="sc-text"><div class="sc-title">${escapeHtml(r.title)}</div>` +
          (r.category ? `<div class="sc-cat">${escapeHtml(r.category)}</div>` : '') +
          '</div></a>'
        );
      }
    )
    .join('');
  return '<section class="similar-articles">' + cards + '</section>';
}

export function renderArticle(data: ArticleData, opts?: RenderOptions): string {
  const lang = opts?.lang ?? 'en';
  const catClass = categoryClass(data.category);
  const titleHtml = titleWithAccent(data.title, data.titleAccentWord);
  const fLabel = formatLabel(data.format);

  if (data.format === 'wire') {
    return renderWireArticle(data, { ...opts, lang, catClass, titleHtml, fLabel });
  }

  return renderFeatureArticle(data, { ...opts, lang, catClass, titleHtml, fLabel });
}

interface RenderContext extends RenderOptions {
  lang: string;
  catClass: string;
  titleHtml: string;
  fLabel: string;
}

function renderFeatureArticle(data: ArticleData, ctx: RenderContext): string {
  const chaptersHtml = (data.chapters ?? [])
    .map((ch, i) => renderChapter(i + 1, data.chapters!.length, ch))
    .join('');

  const bodyHtml = transformInlineBlocks(data.bodyHtml ?? chaptersHtml);

  const readingSpan = data.readingTime ? `<span>${escapeHtml(data.readingTime)}</span>` : '';
  const byline = data.byline
    ? `<span>${escapeHtml(data.byline.author)}</span><span>${escapeHtml(data.byline.date)}</span>${readingSpan}`
    : `<span>By Editorial</span>${readingSpan}`;

  return (
    `<article class="article-shell ${ctx.catClass}">` +
    '<div class="article-progress" aria-hidden="true"><div class="fill"></div></div>' +

    '<header class="article-hero">' +
    '<div class="article-hero-inner">' +
    `<div class="article-kicker">${escapeHtml(data.category)}${ctx.fLabel ? ` <span class="sep">&middot;</span> ${ctx.fLabel}` : ''}</div>` +
    `<h1 class="article-title">${ctx.titleHtml}</h1>` +
    `<p class="article-deck">${escapeHtml(data.subtitle)}</p>` +
    `<div class="article-byline">${byline}</div>` +
    '</div>' +
    '</header>' +

    `<figure class="article-hero-img"><img src="${escapeHtml(safeUrl(data.heroImage))}" alt="${escapeHtml(data.heroImageAlt ?? data.title)}" loading="eager" fetchpriority="high" width="${safeDimension(data.heroImageWidth, 1920)}" height="${safeDimension(data.heroImageHeight, 1080)}"></figure>` +

    renderEditorsNote(data.editorsNote, data.sourceCount) +

    `<div class="article-body">${bodyHtml}</div>` +

    renderKeyPoints(data.keyPoints) +
    renderKnowCards(data.known, data.unknown) +

    renderRelated(data.related) +
    renderShareBar(data.title, data.shareUrl) +

    '</article>'
  );
}

function renderWireArticle(data: ArticleData, ctx: RenderContext): string {
  const bodyHtml = transformInlineBlocks(data.bodyHtml ?? '');

  return (
    `<article class="post-simple ${ctx.catClass}">` +
    '<header class="post-simple-head">' +
    `<div class="post-simple-kicker">${escapeHtml(data.category)}</div>` +
    `<h1 class="post-simple-title">${ctx.titleHtml}</h1>` +
    `<div class="post-simple-meta"><span>${escapeHtml(data.publishedAt)}</span>${data.readingTime ? `<span>${escapeHtml(data.readingTime)}</span>` : ''}</div>` +
    '</header>' +

    `<figure class="post-simple-img"><img src="${escapeHtml(safeUrl(data.heroImage))}" alt="${escapeHtml(data.heroImageAlt ?? data.title)}" loading="eager" fetchpriority="high" decoding="async" width="${safeDimension(data.heroImageWidth, 1600)}" height="${safeDimension(data.heroImageHeight, 900)}"></figure>` +

    `<div class="post-simple-body">${bodyHtml}</div>` +

    (data.pullQuote
      ? `<figure class="source-quote"><p class="q">${sanitizeInline(data.pullQuote)}</p></figure>`
      : '') +

    (data.whyItMatters
      ? `<aside class="editors-note" role="note"><span class="lbl">Why it matters</span> ${escapeHtml(data.whyItMatters)}</aside>`
      : '') +

    renderRelated(data.related) +
    renderShareBar(data.title, data.shareUrl) +

    '</article>'
  );
}

export function renderWeekly(data: WeeklyData, opts?: RenderOptions): string {
  const sectionsHtml = data.sections
    .map((s) => renderWeeklySection(s))
    .join('');

  return (
    `<article class="article-shell cat-weekly">` +
    '<div class="article-progress" aria-hidden="true"><div class="fill"></div></div>' +

    '<header class="article-hero">' +
    '<div class="article-hero-inner">' +
    '<div class="article-kicker">Weekly Recap</div>' +
    `<h1 class="article-title">${escapeHtml(data.title)}</h1>` +
    `<p class="article-deck">${escapeHtml(data.subtitle)}</p>` +
    '</div>' +
    '</header>' +

    `<figure class="article-hero-img"><img src="${escapeHtml(safeUrl(data.heroImage))}" alt="${escapeHtml(data.title)}" loading="eager" width="1920" height="1080"></figure>` +

    `<div class="recap-thesis">${escapeHtml(data.thesis)}</div>` +

    `<div class="article-body">${sectionsHtml}</div>` +

    renderKeyPoints(data.keyPoints) +
    renderKnowCards(data.known, data.unknown) +
    renderRelated(data.related) +
    renderShareBar(data.title, data.shareUrl) +

    '</article>'
  );
}

export function renderCard(data: ArticleData, opts?: RenderOptions): string {
  const catClass = categoryClass(data.category);
  const titleHtml = titleWithAccent(data.title, data.titleAccentWord);
  const fLabel = formatLabel(data.format);
  const rawHref = data.shareUrl ?? `#${data.slug}`;
  const href = safeUrl(rawHref) || '#';

  return (
    `<a class="druck-card ${catClass}" href="${escapeHtml(href)}">` +
    `<figure class="card-thumb"><img src="${escapeHtml(safeUrl(data.heroImage))}" alt="${escapeHtml(data.heroImageAlt ?? data.title)}" loading="lazy" width="400" height="225"></figure>` +
    `<div class="card-text">` +
    `<div class="card-kicker">${escapeHtml(data.category)}${fLabel ? ` <span class="sep">&middot;</span> ${fLabel}` : ''}</div>` +
    `<h3 class="card-title">${titleHtml}</h3>` +
    `<p class="card-subtitle">${escapeHtml(data.subtitle)}</p>` +
    `<div class="card-meta"><time>${escapeHtml(data.publishedAt)}</time>${data.readingTime ? `<span>${escapeHtml(data.readingTime)}</span>` : ''}</div>` +
    `</div>` +
    `</a>`
  );
}

function renderWeeklySection(section: WeeklySection): string {
  const narrativeHtml = transformInlineBlocks(section.narrative);
  const keyPointsHtml = renderKeyPoints(section.keyPoints);

  const articlesHtml = (section.articles ?? [])
    .map(
      (a) => {
        const safeArticleUrl = safeUrl(a.url);
        if (!safeArticleUrl) return '';
        return (
          `<a class="recap-article" href="${escapeHtml(safeArticleUrl)}">` +
          (a.image ? `<img class="recap-article-thumb" src="${escapeHtml(safeUrl(a.image))}" alt="" loading="lazy">` : '') +
          `<div class="recap-article-title">${escapeHtml(a.title)}</div>` +
          (a.summary ? `<div class="recap-article-summary">${escapeHtml(a.summary)}</div>` : '') +
          '</a>'
        );
      }
    )
    .join('');

  return (
    '<section class="chapter-panel recap-section">' +
    `<h2 class="recap-section-title">${escapeHtml(section.title)}</h2>` +
    `<div class="recap-section-narrative">${narrativeHtml}</div>` +
    keyPointsHtml +
    (articlesHtml ? `<div class="recap-articles">${articlesHtml}</div>` : '') +
    '</section>'
  );
}
