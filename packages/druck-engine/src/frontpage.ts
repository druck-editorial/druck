import { escapeHtml, safeUrl } from './format.js';
import { categoryClass, renderCard } from './render.js';
import type { ArticleData, RenderOptions } from './types.js';

export type FrontPageRowType = 'hero' | 'feature' | 'triple' | 'brief';

export interface FrontPageRow {
  type: FrontPageRowType;
  items: ArticleData[];
}

const BRIEF_MAX = 5;

export function buildFrontPage(items: ArticleData[]): FrontPageRow[] {
  if (!items.length) return [];
  const pool = [...items];
  const hotIdx = pool.findIndex((entry) => entry.hot);
  if (hotIdx > 0) pool.unshift(pool.splice(hotIdx, 1)[0]);

  const rows: FrontPageRow[] = [{ type: 'hero', items: pool.splice(0, 1) }];
  if (pool.length >= 2) rows.push({ type: 'feature', items: pool.splice(0, 2) });
  if (pool.length >= 3) rows.push({ type: 'triple', items: pool.splice(0, 3) });
  const brief = pool.splice(0, BRIEF_MAX);
  if (brief.length) rows.push({ type: 'brief', items: brief });
  return rows;
}

function renderHeroCard(data: ArticleData): string {
  const href = safeUrl(data.shareUrl ?? '') || '#';
  const imgSrc = safeUrl(data.heroImage) || 'data:,';
  return (
    `<a class="df-hero-card ${categoryClass(data.category)}" href="${escapeHtml(href)}">` +
    `<img class="df-hero-img" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(data.heroImageAlt ?? data.title)}" loading="lazy" width="1200" height="675">` +
    '<div class="df-hero-scrim" aria-hidden="true"></div>' +
    '<div class="df-hero-text">' +
    (data.hot ? '<span class="df-hot">HOT</span>' : '') +
    `<div class="card-kicker">${escapeHtml(data.category)}</div>` +
    `<h3 class="df-hero-title">${escapeHtml(data.title)}</h3>` +
    `<p class="df-hero-sub">${escapeHtml(data.subtitle)}</p>` +
    '</div></a>'
  );
}

function renderBriefItem(data: ArticleData): string {
  const href = safeUrl(data.shareUrl ?? '') || '#';
  return (
    `<li><a href="${escapeHtml(href)}">` +
    `<span class="df-brief-title">${escapeHtml(data.title)}</span>` +
    `<time>${escapeHtml(data.publishedAt)}</time>` +
    '</a></li>'
  );
}

export function renderFrontPage(rows: FrontPageRow[], opts?: RenderOptions): string {
  const rendered = rows.map((row) => {
    if (row.type === 'hero') {
      return `<div class="df-row df-row--hero">${renderHeroCard(row.items[0])}</div>`;
    }
    if (row.type === 'brief') {
      const lis = row.items.map(renderBriefItem).join('');
      return `<div class="df-row df-row--brief"><div class="df-brief-label">In brief</div><ul>${lis}</ul></div>`;
    }
    const cls = row.type === 'feature' ? 'df-row--feature' : 'df-row--triple';
    const cards = row.items.map((entry) => renderCard(entry, opts)).join('');
    return `<div class="df-row ${cls}">${cards}</div>`;
  });
  return `<div class="druck-front-page">${rendered.join('')}</div>`;
}
